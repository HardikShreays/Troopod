const Groq = require('groq-sdk');

class PersonalizationStrategyAgent {
  constructor(apiKey) {
    this.client = new Groq({ apiKey });
    this.model = 'llama-3.3-70b-versatile';
  }

  async createStrategy(adAnalysis, pageStructure) {
    const systemPrompt = `You are a CRO (Conversion Rate Optimization) expert specializing in message match optimization.

Your task: Create a personalization strategy that aligns the landing page with the ad creative while following CRO best practices.

CRO Principles to Follow:
1. Message Match: Ensure headline and main messaging echo the ad's value proposition
2. Above-the-fold clarity: Main benefit should be immediately visible
3. Social proof placement: Position trust elements strategically
4. CTA optimization: Make CTAs action-oriented and benefit-focused
5. Scent trail: Maintain consistent language from ad to page
6. Anxiety reduction: Address concerns raised in the ad
7. Visual hierarchy: Guide eye flow to key conversion elements

Respond ONLY in valid JSON format:
{
  "strategy": {
    "headline": {
      "original": "current headline",
      "personalized": "new headline matching ad",
      "reasoning": "why this change improves conversion"
    },
    "subheadline": {
      "original": "current subheadline",
      "personalized": "supporting subheadline",
      "reasoning": "explanation"
    },
    "ctas": [
      {
        "original": "old CTA text",
        "personalized": "new CTA text",
        "reasoning": "explanation",
        "position": "primary/secondary"
      }
    ],
    "contentBlocks": [
      {
        "type": "benefit/social-proof/objection-handler",
        "content": "specific content",
        "placement": "above-fold/mid-page/etc",
        "reasoning": "why this helps conversion"
      }
    ],
    "keyChanges": ["change 1", "change 2"],
    "expectedImpact": "summary of expected conversion improvements"
  }
}`;

    try {
      const prompt = this._buildStrategyPrompt(adAnalysis, pageStructure);
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 3000,
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      });

      const content = response.choices?.[0]?.message?.content || '';
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const strategy = JSON.parse(cleanedContent);
      
      // Validate strategy
      this._validateStrategy(strategy);
      
      return {
        success: true,
        data: strategy.strategy
      };
    } catch (error) {
      console.error('Strategy creation error:', error);
      return {
        success: false,
        error: error.message,
        data: this._getFallbackStrategy(adAnalysis, pageStructure)
      };
    }
  }

  _buildStrategyPrompt(adAnalysis, pageStructure) {
    return `Create a personalization strategy based on:

AD ANALYSIS:
- Value Proposition: ${adAnalysis.valueProposition}
- Target Audience: ${adAnalysis.targetAudience}
- Pain Points: ${adAnalysis.painPoints.join(', ')}
- Messaging Themes: ${adAnalysis.messagingThemes.join(', ')}
- Benefits: ${adAnalysis.benefits.join(', ')}
- CTA Style: ${adAnalysis.ctaStyle}
- Tone: ${adAnalysis.tone}
- Emotional Triggers: ${adAnalysis.emotionalTriggers.join(', ')}

CURRENT PAGE STRUCTURE:
- Current Headline: ${pageStructure.headlines[0]?.text || 'No headline found'}
- Current CTAs: ${pageStructure.ctas.map(c => c.text).slice(0, 3).join(', ')}
- Page Title: ${pageStructure.title}

Create a strategy that:
1. Matches the ad's message in the headline
2. Echoes the ad's emotional triggers
3. Uses similar language and tone
4. Optimizes CTAs to match the ad's urgency level
5. Adds trust elements if the ad mentions them

Return ONLY valid JSON, no markdown, no explanations.`;
  }

  _validateStrategy(strategy) {
    if (!strategy.strategy) {
      throw new Error('Missing strategy object');
    }
    const required = ['headline', 'ctas', 'keyChanges'];
    for (const field of required) {
      if (!strategy.strategy[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  _getFallbackStrategy(adAnalysis, pageStructure) {
    return {
      headline: {
        original: pageStructure.headlines[0]?.text || 'Welcome',
        personalized: adAnalysis.valueProposition,
        reasoning: 'Direct message match from ad'
      },
      subheadline: {
        original: pageStructure.subheadlines[0]?.text || '',
        personalized: adAnalysis.benefits[0] || 'Discover our solution',
        reasoning: 'Supporting the main value proposition'
      },
      ctas: [{
        original: pageStructure.ctas[0]?.text || 'Learn More',
        personalized: `Get Started ${adAnalysis.ctaStyle === 'urgent' ? 'Now' : 'Today'}`,
        reasoning: 'Action-oriented CTA matching ad urgency',
        position: 'primary'
      }],
      contentBlocks: [],
      keyChanges: ['Updated headline for message match', 'Optimized CTA'],
      expectedImpact: 'Improved message consistency between ad and landing page'
    };
  }
}

module.exports = PersonalizationStrategyAgent;
