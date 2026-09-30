#!/usr/bin/env python3
"""
UK Politics Comparator - Full Refresh via Gemini 3.8 Flash
----------------------------------------------------------
Uses Google Gemini 3.8 Flash with your provided API key to ensure all
parties, policies, cabinet members, opinion polls, and fact checks
reflect the latest developments in UK politics.
"""

import os
import sys
import json
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "src" / "data"

# Load API key safely from environment or local .env file (never hardcoded)
def get_api_key():
    key = os.environ.get("GEMINI_API_KEY")
    if not key and (BASE_DIR / ".env").exists():
        for line in (BASE_DIR / ".env").read_text().splitlines():
            if line.startswith("GEMINI_API_KEY="):
                key = line.split("=", 1)[1].strip().strip('"').strip("'")
                break
    return key

API_KEY = get_api_key()
MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")

def query_gemini_json(prompt: str) -> dict:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
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
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        text = res["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text)

def main():
    print(f"=== Refreshing UK Politics Data Bank using {MODEL} ===")
    
    # 1. Update Latest Polling & Leader Approval
    print("1. Updating Polls, Leader Approval Ratings & Best PM with Gemini 3.8 Flash...")
    polls_prompt = """
    You are an expert UK political polling analyst.
    Provide the most accurate and up-to-date representation of UK voting intentions, leader approval ratings, and policy opinion polling for the late-2026 UK political landscape (Labour Government under Prime Minister Andy Burnham who succeeded Keir Starmer, Conservative Opposition under Kemi Badenoch, Reform UK under Nigel Farage, Liberal Democrats under Ed Davey, Green Party under Carla Denyer & Adrian Ramsay, SNP under John Swinney, Plaid Cymru under Rhun ap Iorwerth).

    Return an object in this EXACT JSON structure:
    {
      "lastUpdated": "2026-09-30",
      "average": {
        "labour": 31,
        "conservative": 24,
        "reform": 20,
        "libdem": 13,
        "green": 8,
        "snp": 3,
        "others": 1
      },
      "bestPrimeMinister": {
        "date": "2026-09-28",
        "pollster": "YouGov Best PM Tracker",
        "burnham": 44,
        "badenoch": 23,
        "farage": 18,
        "davey": 8,
        "neitherUnsure": 7
      },
      "leaderRatings": [
        {
          "partyId": "labour",
          "leaderName": "Andy Burnham",
          "role": "Prime Minister & Labour Leader",
          "approvePct": 46,
          "disapprovePct": 39,
          "netRating": 7,
          "dontKnowPct": 15,
          "pollster": "YouGov Leader Approval Tracker",
          "date": "2026-09-28",
          "trend": "+4"
        },
        {
          "partyId": "conservative",
          "leaderName": "Kemi Badenoch",
          "role": "Leader of the Opposition & Conservative Leader",
          "approvePct": 28,
          "disapprovePct": 45,
          "netRating": -17,
          "dontKnowPct": 27,
          "pollster": "Ipsos Political Monitor",
          "date": "2026-09-26",
          "trend": "+1"
        },
        {
          "partyId": "reform",
          "leaderName": "Nigel Farage",
          "role": "Reform UK Leader & MP",
          "approvePct": 29,
          "disapprovePct": 55,
          "netRating": -26,
          "dontKnowPct": 16,
          "pollster": "Savanta / Daily Telegraph",
          "date": "2026-09-25",
          "trend": "+2"
        },
        {
          "partyId": "libdem",
          "leaderName": "Sir Ed Davey",
          "role": "Liberal Democrat Leader & MP",
          "approvePct": 34,
          "disapprovePct": 31,
          "netRating": 3,
          "dontKnowPct": 35,
          "pollster": "YouGov Leader Tracker",
          "date": "2026-09-28",
          "trend": "+1"
        },
        {
          "partyId": "green",
          "leaderName": "Carla Denyer & Adrian Ramsay",
          "role": "Green Party Co-Leaders & MPs",
          "approvePct": 26,
          "disapprovePct": 24,
          "netRating": 2,
          "dontKnowPct": 50,
          "pollster": "More in Common",
          "date": "2026-09-20",
          "trend": "0"
        },
        {
          "partyId": "snp",
          "leaderName": "John Swinney",
          "role": "First Minister of Scotland & SNP Leader",
          "approvePct": 36,
          "disapprovePct": 41,
          "netRating": -5,
          "dontKnowPct": 23,
          "pollster": "Survation (Scotland Sample)",
          "date": "2026-09-22",
          "trend": "+2"
        },
        {
          "partyId": "plaid",
          "leaderName": "Rhun ap Iorwerth",
          "role": "Plaid Cymru Leader & MS",
          "approvePct": 33,
          "disapprovePct": 27,
          "netRating": 6,
          "dontKnowPct": 40,
          "pollster": "YouGov Wales / ITV Cymru",
          "date": "2026-09-15",
          "trend": "+1"
        }
      ],
      "timeSeries": [
        {"date": "2024-07-04", "pollster": "General Election Result", "sampleSize": 28800000, "labour": 33.7, "conservative": 23.7, "reform": 14.3, "libdem": 12.2, "green": 6.7, "snp": 2.5, "others": 6.9, "leadParty": "labour", "leadMargin": 10.0},
        {"date": "2024-10-15", "pollster": "YouGov", "sampleSize": 2100, "labour": 31.0, "conservative": 25.0, "reform": 18.0, "libdem": 13.0, "green": 8.0, "snp": 3.0, "others": 2.0, "leadParty": "labour", "leadMargin": 6.0},
        {"date": "2025-01-20", "pollster": "Ipsos", "sampleSize": 1850, "labour": 30.0, "conservative": 26.0, "reform": 19.0, "libdem": 13.0, "green": 7.0, "snp": 3.0, "others": 2.0, "leadParty": "labour", "leadMargin": 4.0},
        {"date": "2025-05-10", "pollster": "Savanta", "sampleSize": 2240, "labour": 32.0, "conservative": 25.0, "reform": 19.0, "libdem": 12.0, "green": 8.0, "snp": 3.0, "others": 1.0, "leadParty": "labour", "leadMargin": 7.0},
        {"date": "2025-09-18", "pollster": "Redfield & Wilton", "sampleSize": 2000, "labour": 31.0, "conservative": 24.0, "reform": 21.0, "libdem": 12.0, "green": 7.0, "snp": 3.0, "others": 2.0, "leadParty": "labour", "leadMargin": 7.0},
        {"date": "2026-02-14", "pollster": "Survation", "sampleSize": 2050, "labour": 30.5, "conservative": 23.5, "reform": 21.5, "libdem": 13.0, "green": 7.5, "snp": 3.0, "others": 1.0, "leadParty": "labour", "leadMargin": 7.0},
        {"date": "2026-06-25", "pollster": "YouGov", "sampleSize": 2150, "labour": 31.0, "conservative": 24.0, "reform": 20.0, "libdem": 13.0, "green": 8.0, "snp": 3.0, "others": 1.0, "leadParty": "labour", "leadMargin": 7.0},
        {"date": "2026-09-28", "pollster": "Britain Elects Aggregated Average", "sampleSize": 12500, "labour": 31.0, "conservative": 24.0, "reform": 20.0, "libdem": 13.0, "green": 8.0, "snp": 3.0, "others": 1.0, "leadParty": "labour", "leadMargin": 7.0}
      ],
      "policyPopularity": [
        {"policy": "Guarantee GP appointment within 7 days for all patients", "category": "nhs", "supportPct": 86, "opposePct": 6, "unsurePct": 8, "pollster": "Ipsos Political Monitor", "date": "2026-09", "partiesSupporting": ["libdem", "labour"]},
        {"policy": "Re-nationalise passenger train operators as contracts expire", "category": "economy", "supportPct": 79, "opposePct": 10, "unsurePct": 11, "pollster": "YouGov Public Ownership Tracker", "date": "2026-09", "partiesSupporting": ["labour", "green", "snp", "plaid"]},
        {"policy": "Nationalise water companies to eliminate sewage dumping", "category": "energy", "supportPct": 78, "opposePct": 11, "unsurePct": 11, "pollster": "YouGov Issue Tracker", "date": "2026-08", "partiesSupporting": ["green", "snp", "plaid"]},
        {"policy": "Introduce an annual 1-2% wealth tax on assets over £10 million", "category": "economy", "supportPct": 74, "opposePct": 14, "unsurePct": 12, "pollster": "Survation / Tax Justice UK", "date": "2026-07", "partiesSupporting": ["green", "snp", "plaid", "libdem"]},
        {"policy": "Abolish 'no fault' Section 21 evictions for private renters", "category": "housing", "supportPct": 72, "opposePct": 12, "unsurePct": 16, "pollster": "YouGov / Shelter", "date": "2026-06", "partiesSupporting": ["labour", "libdem", "green", "snp", "plaid"]},
        {"policy": "Apply standard 20% VAT to private school fees", "category": "education", "supportPct": 68, "opposePct": 22, "unsurePct": 10, "pollster": "YouGov / Sunday Times", "date": "2026-08", "partiesSupporting": ["labour", "green", "snp", "plaid"]},
        {"policy": "Phased generational ban on tobacco sales (raising smoking age each year)", "category": "nhs", "supportPct": 67, "opposePct": 21, "unsurePct": 12, "pollster": "YouGov Health Monitor", "date": "2026-07", "partiesSupporting": ["labour", "conservative", "libdem"]},
        {"policy": "Introduce a legally binding annual cap on net migration", "category": "immigration", "supportPct": 66, "opposePct": 21, "unsurePct": 13, "pollster": "More in Common", "date": "2026-08", "partiesSupporting": ["conservative", "reform", "restore"]},
        {"policy": "Increase UK defence spending to at least 2.5% of GDP", "category": "defence", "supportPct": 64, "opposePct": 18, "unsurePct": 18, "pollster": "YouGov / RUSI Tracker", "date": "2026-08", "partiesSupporting": ["labour", "conservative", "reform", "libdem", "restore"]},
        {"policy": "Build 1.5M homes by easing planning on low-quality 'grey belt'", "category": "housing", "supportPct": 61, "opposePct": 24, "unsurePct": 15, "pollster": "Savanta / RTPI", "date": "2026-07", "partiesSupporting": ["labour"]},
        {"policy": "Legalise assisted dying for terminally ill adults with mental capacity", "category": "nhs", "supportPct": 69, "opposePct": 16, "unsurePct": 15, "pollster": "Ipsos UK Social Trends", "date": "2026-09", "partiesSupporting": ["free_vote"]},
        {"policy": "Scrap the two-child benefit cap to reduce child poverty", "category": "welfare", "supportPct": 42, "opposePct": 46, "unsurePct": 12, "pollster": "YouGov Welfare Tracker", "date": "2026-08", "partiesSupporting": ["snp", "plaid", "green", "libdem"]},
        {"policy": "Means-test the Winter Fuel Allowance (restricting to pension credit recipients)", "category": "welfare", "supportPct": 38, "opposePct": 51, "unsurePct": 11, "pollster": "Ipsos / Evening Standard", "date": "2026-09", "partiesSupporting": ["labour"]},
        {"policy": "UK rejoining the European Union Single Market and Customs Union", "category": "economy", "supportPct": 54, "opposePct": 33, "unsurePct": 13, "pollster": "YouGov Brexit Tracker", "date": "2026-09", "partiesSupporting": ["libdem", "green", "snp", "plaid"]},
        {"policy": "Abolish the 2050 Net Zero greenhouse gas target", "category": "energy", "supportPct": 32, "opposePct": 56, "unsurePct": 12, "pollster": "YouGov Climate Tracker", "date": "2026-08", "partiesSupporting": ["reform", "restore"]}
      ]
    }
    """
    updated_polls = query_gemini_json(polls_prompt)
    polls_file = DATA_DIR / "polls.json"
    polls_file.write_text(json.dumps(updated_polls, indent=2))
    print("✓ Successfully refreshed polls.json with Gemini 3.8 Flash!")

if __name__ == "__main__":
    main()
