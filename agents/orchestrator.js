const AdAnalyzerAgent = require('./adAnalyzer');
const LandingPageScraperAgent = require('./pageScraper');
const PersonalizationStrategyAgent = require('./strategyAgent');
const HTMLGeneratorAgent = require('./htmlGenerator');

class PersonalizationOrchestrator {
  constructor(apiKey) {
    this.adAnalyzer = new AdAnalyzerAgent(apiKey);
    this.pageScraper = new LandingPageScraperAgent();
    this.strategyAgent = new PersonalizationStrategyAgent(apiKey);
    this.htmlGenerator = new HTMLGeneratorAgent(apiKey);
  }

  async personalizeLandingPage(adImageBase64, landingPageURL, adType = 'image/jpeg', options = {}) {
    const { landingPageHTML } = options;
    const results = {
      steps: [],
      success: false,
      error: null,
      data: null
    };

    try {
      // Step 1: Analyze the ad creative
      console.log('Step 1: Analyzing ad creative...');
      const adAnalysis = await this.adAnalyzer.analyzeAd(adImageBase64, adType);
      results.steps.push({
        step: 'Ad Analysis',
        success: adAnalysis.success,
        data: adAnalysis.data
      });

      if (!adAnalysis.success) {
        throw new Error(`Ad analysis failed: ${adAnalysis.error}`);
      }

      // Step 2: Scrape the landing page (or use pasted HTML when fetch is blocked, e.g. Vercel 403)
      console.log('Step 2: Scraping landing page...');
      const pageData = await this.pageScraper.scrapePage(landingPageURL, {
        html: landingPageHTML
      });
      results.steps.push({
        step: 'Page Scraping',
        success: pageData.success,
        data: pageData.success
          ? { structure: pageData.data.structure, source: pageData.data.source }
          : null
      });

      if (!pageData.success) {
        throw new Error(`Page scraping failed: ${pageData.error}`);
      }

      // Step 3: Create personalization strategy
      console.log('Step 3: Creating personalization strategy...');
      const strategy = await this.strategyAgent.createStrategy(
        adAnalysis.data,
        {
          ...pageData.data.structure,
          title: pageData.data.title,
          metaDescription: pageData.data.metaDescription
        }
      );
      results.steps.push({
        step: 'Strategy Creation',
        success: strategy.success,
        data: strategy.data
      });

      if (!strategy.success) {
        throw new Error(`Strategy creation failed: ${strategy.error}`);
      }

      // Step 4: Generate personalized HTML
      console.log('Step 4: Generating personalized HTML...');
      const personalizedHTML = await this.htmlGenerator.generatePersonalizedHTML(
        pageData.data.html,
        strategy.data,
        pageData.data.structure
      );
      results.steps.push({
        step: 'HTML Generation',
        success: personalizedHTML.success,
        data: personalizedHTML.success ? { 
          modifications: personalizedHTML.data.modifications 
        } : null
      });

      if (!personalizedHTML.success) {
        throw new Error(`HTML generation failed: ${personalizedHTML.error}`);
      }

      // Success!
      results.success = true;
      results.data = {
        adAnalysis: adAnalysis.data,
        originalPage: {
          url: landingPageURL,
          title: pageData.data.title,
          structure: pageData.data.structure
        },
        strategy: strategy.data,
        personalizedHTML: personalizedHTML.data.html,
        modifications: personalizedHTML.data.modifications,
        summary: this._generateSummary(adAnalysis.data, strategy.data)
      };

      return results;

    } catch (error) {
      console.error('Orchestration error:', error);
      results.success = false;
      results.error = error.message;
      return results;
    }
  }

  _generateSummary(adAnalysis, strategy) {
    return {
      messageMatch: `Aligned page messaging with ad's value proposition: "${adAnalysis.valueProposition}"`,
      keyChanges: strategy.keyChanges || [],
      tone: `Adjusted tone to match ad: ${adAnalysis.tone}`,
      expectedImpact: strategy.expectedImpact || 'Improved conversion through better message consistency'
    };
  }

  // Method to get status/health of all agents
  async healthCheck() {
    return {
      adAnalyzer: 'ready',
      pageScraper: 'ready',
      strategyAgent: 'ready',
      htmlGenerator: 'ready',
      status: 'operational'
    };
  }
}

module.exports = PersonalizationOrchestrator;
