# Troopod AI Landing Page Personalizer

An AI-powered system that personalizes landing pages based on ad creatives using multi-agent architecture and CRO (Conversion Rate Optimization) principles.

## 🎯 Overview

This system takes an ad creative and a landing page URL as input, analyzes both using AI agents, and generates a personalized version of the landing page that matches the messaging and tone of the ad creative while applying CRO best practices.

## 🏗️ Architecture

### Multi-Agent System

The system uses four specialized AI agents working in sequence:

1. **Ad Analyzer Agent** (`agents/adAnalyzer.js`)
   - Analyzes uploaded ad creatives using Claude's vision capabilities
   - Extracts: value proposition, pain points, target audience, messaging themes, benefits, CTA style, tone, emotional triggers
   - Returns structured JSON data with fallback mechanisms

2. **Landing Page Scraper Agent** (`agents/pageScraper.js`)
   - Scrapes and parses the target landing page
   - Extracts structural elements: headlines, subheadlines, CTAs, paragraphs, images
   - Maps elements to CSS selectors for precise modifications

3. **Personalization Strategy Agent** (`agents/strategyAgent.js`)
   - Creates CRO-optimized personalization strategy
   - Applies principles: message match, above-fold clarity, CTA optimization, scent trail
   - Generates specific changes with reasoning for each modification

4. **HTML Generator Agent** (`agents/htmlGenerator.js`)
   - Implements the strategy on the actual HTML
   - Uses Cheerio for safe DOM manipulation
   - Validates changes to prevent broken UI
   - Adds personalization indicator banner

5. **Orchestrator** (`agents/orchestrator.js`)
   - Coordinates all agents in proper sequence
   - Handles error propagation and fallbacks
   - Provides health check and monitoring

## 🔧 How It Works

### Processing Flow

```
1. User uploads ad creative (image) + landing page URL
2. Ad Analyzer extracts key elements from ad
3. Page Scraper fetches and parses landing page structure
4. Strategy Agent creates personalization plan based on CRO principles
5. HTML Generator applies changes to actual HTML
6. User receives personalized page + detailed analysis
```

### Example Transformation

**Input:**
- Ad Creative: Image promoting "Save 30% on Premium Plans"
- Landing Page: Generic SaaS homepage

**Output:**
- Headline changed from "Best SaaS Solution" → "Save 30% on Premium Plans"
- CTAs updated to match ad's urgency level
- Subheadline adjusted to reinforce the discount offer
- Message consistency maintained throughout

## 🛡️ Safeguards Against Common Issues

### 1. Handling Random Changes
- **Strategy-based modifications**: All changes follow a documented strategy with reasoning
- **Structured output validation**: JSON schemas enforce consistent response formats
- **Fallback mechanisms**: Each agent has predefined fallback responses if AI output is invalid
- **Idempotency**: Same inputs produce consistent outputs through deterministic processing

### 2. Preventing Broken UI
- **Non-destructive editing**: Only text content is modified, never HTML structure
- **Cheerio-based DOM manipulation**: Safe, tested library for HTML modifications
- **Structural validation**: Before/after comparison checks element counts
- **CSS preservation**: All classes, IDs, and styles remain intact
- **Script protection**: JavaScript tags are never modified or removed
- **Ultra-safe fallback**: If validation fails, system applies minimal changes (headline only)

### 3. Avoiding Hallucinations
- **Explicit constraints in prompts**: "Return ONLY valid JSON, no markdown, no explanations"
- **Response cleaning**: Automatic removal of markdown code blocks
- **Field validation**: Required fields are checked before accepting responses
- **Grounded in source data**: All personalizations reference actual ad analysis
- **No speculative content**: Strategy agent only modifies based on extracted ad elements

### 4. Ensuring Consistent Outputs
- **JSON-only responses**: All AI outputs are structured JSON
- **Schema validation**: Each response validated against expected structure
- **Error handling**: Try-catch blocks at every agent level
- **Fallback data**: Pre-defined safe defaults if AI fails
- **Logging**: All steps logged for debugging and monitoring
- **Health checks**: API endpoint to verify all agents are operational

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- Anthropic API key

### Installation

1. Clone and install:
```bash
cd troopod-lp-personalizer
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

3. Start the server:
```bash
npm start
```

4. Open browser:
```
http://localhost:3000
```

### Usage

1. Upload an ad creative (JPG, PNG, WebP)
2. Enter the landing page URL
3. Click "Personalize Landing Page"
4. View results:
   - Ad analysis
   - Personalization strategy
   - List of modifications
5. Actions available:
   - View personalized page in new window
   - Download HTML file
   - Start new request

## 📊 API Endpoints

### POST /api/personalize
Personalizes a landing page based on ad creative.

**Request:**
- `Content-Type: multipart/form-data`
- `adCreative`: Image file
- `landingPageURL`: URL string

**Response:**
```json
{
  "success": true,
  "data": {
    "adAnalysis": { ... },
    "originalPage": { ... },
    "strategy": { ... },
    "summary": { ... },
    "modifications": [ ... ]
  },
  "personalizedHTML": "<html>...</html>",
  "steps": [ ... ]
}
```

### GET /health
Returns system health status.

**Response:**
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

## 🎨 CRO Principles Applied

1. **Message Match**: Headline and main copy echo ad's value proposition
2. **Scent Trail**: Consistent language from ad to page
3. **Above-the-fold Clarity**: Main benefit immediately visible
4. **CTA Optimization**: Action-oriented, benefit-focused CTAs
5. **Anxiety Reduction**: Address concerns raised in ad
6. **Social Proof Placement**: Strategic trust element positioning
7. **Visual Hierarchy**: Guide eye flow to conversion elements

## 🔐 Security Considerations

- URL validation before scraping
- File size limits (10MB for uploads)
- Timeout protection on external requests
- No execution of scraped JavaScript
- CORS enabled for controlled access
- Environment variables for sensitive data

## 🧪 Testing Recommendations

Test with various scenarios:
- Different ad styles (urgent vs. soft sell)
- Complex landing pages (multi-section)
- Simple landing pages (single page apps)
- Different industries and tones
- Mobile-responsive designs

## 📈 Future Enhancements

- A/B testing framework integration
- Real-time preview during editing
- Multi-variant generation
- Analytics integration
- Template library
- Advanced CRO metrics calculation

## 🤝 Support

For issues or questions, contact: nj@troopod.io

---

Built with ❤️ using Claude AI (Anthropic)
