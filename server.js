require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const PersonalizationOrchestrator = require('./agents/orchestrator');

const app = express();
const PORT = process.env.PORT || 3000;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize orchestrator
const orchestrator = new PersonalizationOrchestrator(process.env.GROQ_API_KEY);

function ensureValidUrl(value, label) {
  try {
    return new URL(value);
  } catch (error) {
    throw new Error(`Invalid ${label} format`);
  }
}

async function getAdImagePayload(req) {
  const adCreativeURL = (req.body.adCreativeURL || '').trim();

  if (req.file) {
    if (!SUPPORTED_IMAGE_TYPES.has(req.file.mimetype)) {
      throw new Error('Unsupported image type. Please use JPG, PNG, or WebP');
    }

    return {
      adImageBase64: req.file.buffer.toString('base64'),
      adType: req.file.mimetype
    };
  }

  if (!adCreativeURL) {
    throw new Error('Ad creative image file or image URL is required');
  }

  ensureValidUrl(adCreativeURL, 'ad creative URL');
  const imageResponse = await fetch(adCreativeURL);

  if (!imageResponse.ok) {
    throw new Error(`Unable to fetch ad creative URL (status ${imageResponse.status})`);
  }

  const contentType = (imageResponse.headers.get('content-type') || '').split(';')[0];
  if (!SUPPORTED_IMAGE_TYPES.has(contentType)) {
    throw new Error('Ad creative URL must point to JPG, PNG, or WebP image');
  }

  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  return {
    adImageBase64: imageBuffer.toString('base64'),
    adType: contentType
  };
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', async (req, res) => {
  try {
    const health = await orchestrator.healthCheck();
    res.json({ status: 'ok', agents: health });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/personalize', upload.single('adCreative'), async (req, res) => {
  try {
    const landingPageURL = (req.body.landingPageURL || '').trim();
    const landingPageHTML = (req.body.landingPageHTML || '').trim();

    // Validation
    if (!landingPageURL) {
      return res.status(400).json({ 
        success: false, 
        error: 'Landing page URL is required' 
      });
    }

    // Validate URL format
    try {
      ensureValidUrl(landingPageURL, 'landing page URL');
    } catch (e) {
      return res.status(400).json({ 
        success: false, 
        error: e.message
      });
    }

    console.log(`Processing personalization request for: ${landingPageURL}`);

    let adPayload;
    try {
      adPayload = await getAdImagePayload(req);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Process the personalization
    const result = await orchestrator.personalizeLandingPage(
      adPayload.adImageBase64,
      landingPageURL,
      adPayload.adType,
      { landingPageHTML }
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
        steps: result.steps
      });
    }

    // Return the results
    res.json({
      success: true,
      data: {
        adAnalysis: result.data.adAnalysis,
        originalPage: result.data.originalPage,
        strategy: result.data.strategy,
        summary: result.data.summary,
        modifications: result.data.modifications
      },
      personalizedHTML: result.data.personalizedHTML,
      steps: result.steps
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint to serve the personalized HTML
app.post('/api/preview', express.json(), (req, res) => {
  try {
    const { html } = req.body;
    if (!html) {
      return res.status(400).json({ error: 'HTML content required' });
    }
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// Start server with automatic port fallback
function startServer(port, retries = 10) {
  const server = app.listen(port, () => {
    console.log(`🚀 Troopod LP Personalizer running on http://localhost:${port}`);
    console.log(`📝 API endpoint: http://localhost:${port}/api/personalize`);
    console.log(`💚 Health check: http://localhost:${port}/health`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && retries > 0) {
      const nextPort = Number(port) + 1;
      console.warn(`⚠️ Port ${port} is in use, trying ${nextPort}...`);
      startServer(nextPort, retries - 1);
      return;
    }

    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
}

startServer(PORT);

module.exports = app;
