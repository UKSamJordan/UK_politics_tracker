#!/usr/bin/env python3
"""
UK Politics Comparator - Data Bank Gemini Ingestion Script
-----------------------------------------------------------
This script uses Google Gemini Flash to safely update your political
data bank (policies, polls, fact-checks, cabinet members) on demand.

Why this saves you money:
- Site visitors NEVER hit the Gemini API directly.
- The website loads 100% statically from Cloudflare's CDN.
- You only run this script when new manifestos, reshuffles, or polls occur.
- A single call costs less than $0.001 (fractions of a penny) on Gemini Flash!

Usage:
  export GEMINI_API_KEY="your-api-key"
  python scripts/update_databank.py --type poll --input "YouGov latest poll: Labour 31%, Con 24%, Reform 20%, LD 13%, Green 8%"
  python scripts/update_databank.py --type factcheck --input "Full Fact checked claim by Nigel Farage on Net Zero savings..."
  python scripts/update_databank.py --type policy --party reform --category defence --input "Reform pledges 3% GDP on defence..."
"""

import os
import sys
import json
import argparse
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "src" / "data"

def call_gemini(prompt: str, api_key: str, model: str = "gemini-3.8-flash") -> str:
    """Calls Gemini API using standard python urllib (no heavy dependencies required)"""
    import urllib.request
    import urllib.error

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json"
        }
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except urllib.error.HTTPError as e:
        print(f"Error calling Gemini API: {e.code} - {e.read().decode('utf-8')}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

def update_poll(input_text: str, api_key: str):
    polls_file = DATA_DIR / "polls.json"
    current_data = json.loads(polls_file.read_text())
    
    prompt = f"""
    You are an expert UK political data analyst.
    Extract the polling data from this text into this EXACT JSON structure:
    {{
      "date": "YYYY-MM-DD",
      "pollster": "Name of pollster",
      "sampleSize": 2000,
      "labour": 31.0,
      "conservative": 24.0,
      "reform": 20.0,
      "libdem": 13.0,
      "green": 8.0,
      "snp": 3.0,
      "others": 1.0,
      "leadParty": "labour",
      "leadMargin": 7.0
    }}

    Input text:
    "{input_text}"
    """
    print(f"Calling Gemini Flash to parse poll...")
    response_json = call_gemini(prompt, api_key)
    new_poll = json.loads(response_json)
    
    # Append to timeSeries and update averages
    current_data["timeSeries"].append(new_poll)
    current_data["lastUpdated"] = new_poll["date"]
    
    # Save back to file
    polls_file.write_text(json.dumps(current_data, indent=2))
    print(f"Successfully added new poll from {new_poll['pollster']} ({new_poll['date']}) to Data Bank!")

def update_factcheck(input_text: str, api_key: str):
    fc_file = DATA_DIR / "factchecks.json"
    current_data = json.loads(fc_file.read_text())
    
    prompt = f"""
    Parse this UK political fact-check into this EXACT JSON structure:
    {{
      "id": "fc-unique-id",
      "partyId": "labour|conservative|reform|libdem|green|snp|plaid|restore",
      "speaker": "Speaker Name",
      "date": "YYYY-MM-DD",
      "category": "defence|economy|nhs|immigration|energy|housing",
      "claim": "Exact quote or claim",
      "verdict": "Accurate|Misleading|Unproven|Needs Context|False|Disputed",
      "explanation": "Concise summary of the factual evidence and figures",
      "source": "Full Fact / ONS / IFS / etc.",
      "sourceUrl": "https://..."
    }}

    Input text:
    "{input_text}"
    """
    print(f"Calling Gemini Flash to structure fact-check...")
    response_json = call_gemini(prompt, api_key)
    new_fc = json.loads(response_json)
    
    current_data.insert(0, new_fc)
    fc_file.write_text(json.dumps(current_data, indent=2))
    print(f"Successfully added fact-check on {new_fc['speaker']} ({new_fc['verdict']}) to Data Bank!")

def update_leader(input_text: str, api_key: str):
    polls_file = DATA_DIR / "polls.json"
    current_data = json.loads(polls_file.read_text())
    
    prompt = f"""
    Parse this UK party leader approval poll into this EXACT JSON structure:
    {{
      "partyId": "labour|conservative|reform|libdem|green|snp|plaid|restore",
      "leaderName": "Leader Name",
      "role": "Leader Role",
      "approvePct": 33,
      "disapprovePct": 52,
      "netRating": -19,
      "dontKnowPct": 15,
      "pollster": "YouGov / Ipsos / Savanta",
      "date": "YYYY-MM-DD",
      "trend": "+2|-3|0"
    }}

    Input text:
    "{input_text}"
    """
    print(f"Calling Gemini Flash to parse leader approval poll...")
    response_json = call_gemini(prompt, api_key)
    new_leader = json.loads(response_json)
    
    # Replace or append in leaderRatings
    existing = current_data.get("leaderRatings", [])
    updated = [l for l in existing if l["partyId"] != new_leader["partyId"]]
    updated.append(new_leader)
    current_data["leaderRatings"] = updated
    polls_file.write_text(json.dumps(current_data, indent=2))
    print(f"Successfully updated approval rating for {new_leader['leaderName']} ({new_leader['netRating']} Net) in Data Bank!")

def update_policy_poll(input_text: str, api_key: str):
    polls_file = DATA_DIR / "polls.json"
    current_data = json.loads(polls_file.read_text())
    
    prompt = f"""
    Parse this policy public opinion poll into this EXACT JSON structure:
    {{
      "policy": "Clear description of policy tested",
      "category": "defence|economy|nhs|immigration|energy|housing|welfare|education",
      "supportPct": 65,
      "opposePct": 20,
      "unsurePct": 15,
      "pollster": "Pollster Name",
      "date": "YYYY-MM",
      "partiesSupporting": ["labour", "libdem", etc.]
    }}

    Input text:
    "{input_text}"
    """
    print(f"Calling Gemini Flash to structure policy poll...")
    response_json = call_gemini(prompt, api_key)
    new_policy = json.loads(response_json)
    
    current_data["policyPopularity"].insert(0, new_policy)
    polls_file.write_text(json.dumps(current_data, indent=2))
    print(f"Successfully added policy poll for '{new_policy['policy']}' ({new_policy['supportPct']}% Support) to Data Bank!")

def main():
    parser = argparse.ArgumentParser(description="Update UK Politics Data Bank using Gemini Flash")
    parser.add_argument("--type", choices=["poll", "factcheck", "leader", "policy_poll"], required=True, help="Type of data to update")
    parser.add_argument("--input", required=True, help="Raw text, press release, or poll report to process")
    parser.add_argument("--key", default=os.environ.get("GEMINI_API_KEY"), help="Gemini API Key (or set GEMINI_API_KEY env var)")
    args = parser.parse_args()

    if not args.key:
        print("Error: No Gemini API Key provided. Set GEMINI_API_KEY environment variable or pass --key.")
        sys.exit(1)

    if args.type == "poll":
        update_poll(args.input, args.key)
    elif args.type == "factcheck":
        update_factcheck(args.input, args.key)
    elif args.type == "leader":
        update_leader(args.input, args.key)
    elif args.type == "policy_poll":
        update_policy_poll(args.input, args.key)

if __name__ == "__main__":
    main()
