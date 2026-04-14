# Quick Setup Guide

## Prerequisites
- Node.js 16 or higher installed
- Anthropic API key (get one at: https://console.anthropic.com/)

## Setup Steps

1. **Extract the project** (if you received a zip file)
   ```bash
   unzip troopod-lp-personalizer.zip
   cd troopod-lp-personalizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit .env and add your API key
   # ANTHROPIC_API_KEY=sk-ant-xxxxx
   ```
   
   Or manually create a `.env` file with:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   PORT=3000
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## Verification

1. Check health endpoint:
   ```bash
   curl http://localhost:3000/health
   ```
   
   Should return:
   ```json
   {
     "status": "ok",
     "agents": {
       "adAnalyzer": "ready",
       "pageScraper": "ready",
       "strategyAgent": "ready",
       "htmlGenerator": "ready",
       "status": "operational"
     }
   }
   ```

2. Test the interface:
   - Upload an ad image (any marketing/promotional image)
   - Enter a landing page URL (try: https://www.anthropic.com)
   - Click "Personalize Landing Page"
   - Wait 10-15 seconds for processing
   - View results and personalized page

## Troubleshooting

### "Cannot find module"
Run: `npm install`

### "ANTHROPIC_API_KEY is not defined"
Make sure .env file exists and contains your API key

### Port 3000 already in use
Change PORT in .env to a different number (e.g., 3001)

### API request failed
- Verify your API key is valid
- Check you have credits in your Anthropic account
- Ensure you have internet connectivity

## Project Structure

```
troopod-lp-personalizer/
├── agents/                 # AI agents
│   ├── adAnalyzer.js      # Analyzes ad creatives
│   ├── pageScraper.js     # Scrapes landing pages
│   ├── strategyAgent.js   # Creates CRO strategy
│   ├── htmlGenerator.js   # Generates personalized HTML
│   └── orchestrator.js    # Coordinates all agents
├── public/
│   └── index.html         # Frontend interface
├── server.js              # Express API server
├── package.json           # Dependencies
├── .env.example           # Environment template
├── README.md              # Full documentation
├── DOCUMENTATION.md       # Technical deep dive
└── TEST.md               # Testing guide
```

## Next Steps

- Read README.md for architecture details
- Read DOCUMENTATION.md for technical explanation
- Read TEST.md for testing instructions
- Try different ads and landing pages
- Experiment with the system

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all setup steps were completed
3. Review DOCUMENTATION.md for troubleshooting
4. Contact: nj@troopod.io

---

Happy personalizing! 🚀
