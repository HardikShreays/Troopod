const axios = require('axios');
const cheerio = require('cheerio');

class LandingPageScraperAgent {
  constructor() {
    this.timeout = 10000;
  }

  async scrapePage(url) {
    try {
      // Validate URL
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid URL protocol');
      }

      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        maxRedirects: 5
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // Extract key elements
      const structure = this._extractStructure($);
      
      return {
        success: true,
        data: {
          url,
          html,
          structure,
          title: $('title').text() || '',
          metaDescription: $('meta[name="description"]').attr('content') || ''
        }
      };
    } catch (error) {
      console.error('Scraping error:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  _extractStructure($) {
    const structure = {
      headlines: [],
      subheadlines: [],
      ctas: [],
      paragraphs: [],
      images: [],
      sections: []
    };

    // Extract headlines
    $('h1, h2, h3').each((i, el) => {
      const text = $(el).text().trim();
      const tag = el.name;
      if (text) {
        if (tag === 'h1') {
          structure.headlines.push({ text, selector: this._getSelector($, el) });
        } else {
          structure.subheadlines.push({ text, tag, selector: this._getSelector($, el) });
        }
      }
    });

    // Extract CTAs (buttons and links with button-like text)
    $('button, a.btn, a.button, [role="button"], input[type="submit"]').each((i, el) => {
      const text = $(el).text().trim() || $(el).attr('value') || '';
      const href = $(el).attr('href') || '';
      if (text) {
        structure.ctas.push({ 
          text, 
          href,
          selector: this._getSelector($, el)
        });
      }
    });

    // Extract main content paragraphs
    $('p').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 20) { // Only meaningful paragraphs
        structure.paragraphs.push({ 
          text: text.substring(0, 200), // Limit length
          selector: this._getSelector($, el)
        });
      }
    });

    // Extract images
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      const alt = $(el).attr('alt') || '';
      if (src) {
        structure.images.push({ src, alt, selector: this._getSelector($, el) });
      }
    });

    return structure;
  }

  _getSelector($, element) {
    const el = $(element);
    const id = el.attr('id');
    if (id) return `#${id}`;

    const classes = el.attr('class');
    if (classes) {
      const classList = classes.split(' ').filter(c => c.trim());
      if (classList.length > 0) {
        return `${element.name}.${classList[0]}`;
      }
    }

    return element.name;
  }
}

module.exports = LandingPageScraperAgent;
