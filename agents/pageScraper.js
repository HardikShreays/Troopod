const axios = require('axios');
const cheerio = require('cheerio');

/** Headers that mimic a current desktop browser; reduces 403s from CDNs/WAFs vs bare axios. */
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1'
};

function formatScrapeError(error) {
  if (axios.isAxiosError(error) && error.response) {
    const status = error.response.status;
    if (status === 403 || status === 401) {
      return (
        `Landing page returned HTTP ${status} (access denied). ` +
        'The site may block requests from cloud/datacenter IPs or bots. ' +
        'Try another public URL, a simpler marketing page, or host a copy the server can reach.'
      );
    }
    if (status === 429) {
      return 'Landing page rate-limited the request (HTTP 429). Try again later or use a different URL.';
    }
    return `HTTP ${status} when fetching the page`;
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'Request timed out while fetching the landing page';
  }
  if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
    return 'Could not resolve the landing page hostname';
  }
  return error.message || String(error);
}

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
        headers: BROWSER_HEADERS,
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
        error: formatScrapeError(error),
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
