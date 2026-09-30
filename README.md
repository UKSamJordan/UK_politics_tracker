# 🇬🇧 UK Politics Comparator & Intelligence Hub

An interactive, responsive political dashboard comparing the main UK political parties (**Labour, Conservative, Reform UK, Liberal Democrats, Green Party, SNP, Plaid Cymru, and Restore**). Features side-by-side policy matrices, dedicated military & defence focus, cabinet/shadow cabinet rosters, live opinion polling trajectories, policy popularity breakdowns, Full Fact checkers, and an interactive policy quiz.

Built with **React 18 + TypeScript + Vite + Tailwind CSS + Lucide + Recharts**.

---

## ⚡ The "Data Bank" Architecture (Zero Visitor Cost)

- **Cloudflare Edge CDN:** Friends and family visiting from their phones, tablets, or computers load pre-compiled JSON directly from Cloudflare. Load time is <100ms with **£0 cost**.
- **Gemini Flash 3.8:** The Gemini API is **never** hit by site visitors. You only invoke it on-demand when you want to ingest new manifestos, speeches, or polls.

---

## 🚀 How to Run Locally

```bash
# 1. Navigate to the project directory
cd /home/Dad/.gemini/antigravity/scratch/uk-politics-comparator

# 2. Start the local development server
npm run dev
```

Open your browser to `http://localhost:5173`.

---

## ☁️ How to Deploy to Cloudflare Pages (Step-by-Step)

Cloudflare Pages offers unlimited bandwidth, automatic SSL, and instant global CDN delivery for free.

### Method A: Connect your GitHub Repo (Recommended - Auto-Deploys on Git Push)
1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of UK Politics Comparator"
   # Add your remote and push to github.com
   ```
2. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) and click **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select your repository.
4. Set the build settings:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Click **Save and Deploy**. Cloudflare will provide you with a live URL (e.g. `https://uk-politics-comparator.pages.dev`) that you can share with friends and family.

### Method B: Direct Upload (No Git Required)
1. Build the production files:
   ```bash
   npm run build
   ```
2. In the Cloudflare Dashboard, go to **Workers & Pages** > **Create application** > **Pages** > **Upload assets**.
3. Drag and drop the `dist/` folder.
4. Your site is instantly live!

---

## 🤖 Updating the Data Bank with Gemini Flash

Whenever new policies or polls are published:

```bash
# Set your API key
export GEMINI_API_KEY="your-gemini-api-key"

# Ingest a new poll:
python scripts/update_databank.py --type poll --input "YouGov Voting Intention 28 Sep: Lab 31%, Con 24%, Ref 20%, LD 13%, Grn 8%"

# Ingest a new fact check:
python scripts/update_databank.py --type factcheck --input "Full Fact analyzed claim by Nigel Farage regarding Net Zero savings..."
```

After updating, run `npm run build` (or push to GitHub) to publish the latest data bank to Cloudflare Pages.
