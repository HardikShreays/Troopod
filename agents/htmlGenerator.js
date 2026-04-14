const cheerio = require('cheerio');

/** Trim and collapse whitespace so LLM output does not leave odd gaps or empty blocks. */
function normalizeCopyText(str) {
  if (str == null || typeof str !== 'string') return '';
  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/[\t\f\v\u00a0]+/g, ' ')
    .replace(/ +/g, ' ')
    .trim();
}

class HTMLGeneratorAgent {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async generatePersonalizedHTML(originalHTML, strategy, pageStructure) {
    const systemPrompt = `You are an expert web developer specializing in landing page optimization.

Your task: Modify the existing HTML to implement the personalization strategy WITHOUT breaking the UI.

CRITICAL RULES:
1. PRESERVE all existing CSS classes, IDs, and structure
2. ONLY modify text content, not HTML structure
3. Keep all <script> tags intact
4. Maintain all inline styles
5. Don't remove or restructure elements
6. Only update the content within existing tags
7. Preserve all data attributes and aria labels
8. Keep the original responsive design intact

Return ONLY the complete modified HTML with NO markdown code blocks, NO explanations.`;

    try {
      const $ = cheerio.load(originalHTML);
      
      // Apply changes safely using cheerio
      const modifications = this._applyModifications($, strategy, pageStructure);
      
      // Get the modified HTML
      let modifiedHTML = $.html();
      
      // Validate that the structure is still intact
      const validation = this._validateHTML(originalHTML, modifiedHTML);
      if (!validation.valid) {
        console.error('HTML validation failed:', validation.errors);
        // Fall back to safer modifications
        modifiedHTML = this._applySafeModifications(originalHTML, strategy, pageStructure);
      }

      // Add personalization indicator
      modifiedHTML = this._addPersonalizationBanner(modifiedHTML, strategy);
      
      return {
        success: true,
        data: {
          html: modifiedHTML,
          modifications: modifications
        }
      };
    } catch (error) {
      console.error('HTML generation error:', error);
      return {
        success: false,
        error: error.message,
        data: {
          html: this._addPersonalizationBanner(originalHTML, strategy),
          modifications: []
        }
      };
    }
  }

  _applyModifications($, strategy, pageStructure) {
    const modifications = [];

    try {
      // Update main headline
      if (strategy.headline && strategy.headline.personalized) {
        const next = normalizeCopyText(strategy.headline.personalized);
        if (next) {
          const h1 = $('h1').first();
          if (h1.length > 0) {
            const original = h1.text();
            this._setHeadingText($, h1, next);
            modifications.push({
              type: 'headline',
              original,
              new: next
            });
          }
        }
      }

      // Update subheadline
      if (strategy.subheadline && strategy.subheadline.personalized) {
        const next = normalizeCopyText(strategy.subheadline.personalized);
        if (next) {
          const h2 = $('h2').first();
          if (h2.length > 0) {
            const original = h2.text();
            this._setHeadingText($, h2, next);
            modifications.push({
              type: 'subheadline',
              original,
              new: next
            });
          }
        }
      }

      // Update CTAs
      if (strategy.ctas && Array.isArray(strategy.ctas)) {
        strategy.ctas.forEach((cta, index) => {
          if (cta.personalized && pageStructure.ctas[index]) {
            const next = normalizeCopyText(cta.personalized);
            if (!next) return;
            const selector = pageStructure.ctas[index].selector;
            const element = $(selector).first();
            if (element.length > 0) {
              const original = element.text();
              element.text(next);
              modifications.push({
                type: 'cta',
                original,
                new: next,
                selector
              });
            }
          }
        });
      }

      return modifications;
    } catch (error) {
      console.error('Error applying modifications:', error);
      return modifications;
    }
  }

  /**
   * Prefer updating a single inner wrapper (span/div) when present so flex/grid layouts
   * that rely on sibling nodes (icons, badges) are not flattened into one text node.
   */
  _setHeadingText($, $heading, text) {
    const kids = $heading.children();
    if (kids.length === 1) {
      const only = kids.first();
      const name = (only.get(0) && only.get(0).name) || '';
      if (/^(span|div|p|strong|em|b|i|a)$/i.test(name)) {
        only.text(text);
        return;
      }
    }
    $heading.text(text);
  }

  _validateHTML(original, modified) {
    try {
      const $original = cheerio.load(original);
      const $modified = cheerio.load(modified);

      const errors = [];
      const warnings = [];

      // Check only key structural landmarks. `div` counts can shift because
      // malformed source HTML gets normalized by the parser.
      const structuralTags = ['nav', 'header', 'footer', 'main'];
      structuralTags.forEach(tag => {
        const originalCount = $original(tag).length;
        const modifiedCount = $modified(tag).length;
        if (originalCount !== modifiedCount) {
          errors.push(`${tag} count mismatch: ${originalCount} -> ${modifiedCount}`);
        }
      });

      // Treat section/div count changes as warnings only.
      ['section', 'div'].forEach(tag => {
        const originalCount = $original(tag).length;
        const modifiedCount = $modified(tag).length;
        if (originalCount !== modifiedCount) {
          warnings.push(`${tag} count mismatch (non-blocking): ${originalCount} -> ${modifiedCount}`);
        }
      });

      // Check that scripts are preserved
      const originalScripts = $original('script').length;
      const modifiedScripts = $modified('script').length;
      if (originalScripts !== modifiedScripts) {
        errors.push(`script count mismatch: ${originalScripts} -> ${modifiedScripts}`);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        warnings: []
      };
    }
  }

  _applySafeModifications(originalHTML, strategy, pageStructure) {
    const $ = cheerio.load(originalHTML);

    if (strategy.headline && strategy.headline.personalized) {
      const next = normalizeCopyText(strategy.headline.personalized);
      if (next) {
        this._setHeadingText($, $('h1').first(), next);
      }
    }

    return $.html();
  }

  _addPersonalizationBanner(html, strategy) {
    const $ = cheerio.load(html);

    const banner =
      '<div style="position:fixed;bottom:0;left:0;right:0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:12px 20px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;box-shadow:0 -2px 10px rgba(0,0,0,0.1);z-index:9999;display:flex;justify-content:center;align-items:center;gap:10px">' +
      '<span style="font-weight:600">✨ Personalized Landing Page</span>' +
      '<span style="opacity:.9">• Optimized for your ad creative</span>' +
      '</div>';

    $('body').append(banner);
    return $.html();
  }
}

module.exports = HTMLGeneratorAgent;
