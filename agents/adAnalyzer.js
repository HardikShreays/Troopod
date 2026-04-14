const Groq = require('groq-sdk');

class AdAnalyzerAgent {
  constructor(apiKey) {
    this.client = new Groq({ apiKey });
    this.model = 'meta-llama/llama-4-scout-17b-16e-instruct';
  }

  async analyzeAd(adImageBase64, adType = 'image/jpeg') {
    const systemPrompt = `You are an expert ad analyzer. Extract key elements from advertisements to enable landing page personalization.

Your task:
1. Identify the main value proposition
2. Extract emotional triggers and pain points
3. Note the target audience
4. Identify key messaging themes
5. Extract specific benefits mentioned
6. Note the call-to-action style and urgency level
7. Identify visual style and tone

Respond ONLY in valid JSON format with this structure:
{
  "valueProposition": "main promise or benefit",
  "painPoints": ["pain point 1", "pain point 2"],
  "targetAudience": "demographic/psychographic description",
  "messagingThemes": ["theme 1", "theme 2"],
  "benefits": ["benefit 1", "benefit 2"],
  "ctaStyle": "urgent/soft/informational/etc",
  "tone": "professional/casual/friendly/etc",
  "emotionalTriggers": ["trigger 1", "trigger 2"],
  "keyPhrases": ["phrase 1", "phrase 2"]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: 2000,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${adType};base64,${adImageBase64}`
                }
              },
              {
                type: 'text',
                text: 'Analyze this advertisement and extract key elements for landing page personalization. Return ONLY valid JSON, no markdown, no explanations.'
              }
            ]
          }
        ]
      });

      const content = response.choices?.[0]?.message?.content || '';
      // Clean up response - remove markdown code blocks if present
      const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const analysis = JSON.parse(cleanedContent);
      
      // Validate required fields
      this._validateAnalysis(analysis);
      
      return {
        success: true,
        data: analysis
      };
    } catch (error) {
      console.error('Ad analysis error:', error);
      return {
        success: false,
        error: error.message,
        // Fallback to basic analysis
        data: this._getFallbackAnalysis()
      };
    }
  }

  _validateAnalysis(analysis) {
    const required = ['valueProposition', 'targetAudience', 'messagingThemes', 'benefits', 'tone'];
    for (const field of required) {
      if (!analysis[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  }

  _getFallbackAnalysis() {
    return {
      valueProposition: "Improve your results with our solution",
      painPoints: ["Looking for better results"],
      targetAudience: "General audience",
      messagingThemes: ["Quality", "Results"],
      benefits: ["Improved outcomes", "Easy to use"],
      ctaStyle: "informational",
      tone: "professional",
      emotionalTriggers: ["Success", "Improvement"],
      keyPhrases: ["Get started", "Learn more"]
    };
  }
}

module.exports = AdAnalyzerAgent;
