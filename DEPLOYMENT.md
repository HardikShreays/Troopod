# Cloud Deployment Guide

This guide explains how to deploy the Troopod LP Personalizer to various cloud platforms.

---

## Option 1: Heroku (Simplest)

### Prerequisites
- Heroku account
- Heroku CLI installed

### Steps

1. **Prepare the app**
   ```bash
   cd troopod-lp-personalizer
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create Heroku app**
   ```bash
   heroku create troopod-lp-personalizer
   ```

3. **Set environment variables**
   ```bash
   heroku config:set ANTHROPIC_API_KEY=your_api_key_here
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Open app**
   ```bash
   heroku open
   ```

**Cost:** Free tier available, $7/month for hobby tier

---

## Option 2: Railway (Modern Alternative)

### Steps

1. **Connect GitHub**
   - Push code to GitHub
   - Visit railway.app
   - Click "New Project" → "Deploy from GitHub"

2. **Configure**
   - Select repository
   - Add environment variable: `ANTHROPIC_API_KEY`
   - Railway auto-detects Node.js and builds

3. **Deploy**
   - Automatic deployment on git push
   - Get public URL from Railway dashboard

**Cost:** Free tier: $5 credit/month, then $0.000231/GB-hour

---

## Option 3: Render (Reliable)

### Steps

1. **Create render.yaml**
   ```yaml
   services:
     - type: web
       name: troopod-lp-personalizer
       env: node
       buildCommand: npm install
       startCommand: npm start
       envVars:
         - key: ANTHROPIC_API_KEY
           sync: false
   ```

2. **Deploy**
   - Push to GitHub
   - Connect repository on render.com
   - Add environment variables in dashboard
   - Deploy

**Cost:** Free tier available (sleeps after inactivity), $7/month for always-on

---

## Option 4: DigitalOcean App Platform

### Steps

1. **Push to GitHub**

2. **Create App**
   - Go to DigitalOcean Apps
   - Select repository
   - Choose "Node.js" environment

3. **Configure**
   ```
   Build Command: npm install
   Run Command: npm start
   HTTP Port: 3000
   ```

4. **Add Environment Variable**
   - `ANTHROPIC_API_KEY` in App settings

**Cost:** $5/month for basic tier

---

## Option 5: AWS Elastic Beanstalk

### Prerequisites
- AWS account
- EB CLI installed

### Steps

1. **Initialize EB**
   ```bash
   eb init -p node.js troopod-lp-personalizer
   ```

2. **Create environment**
   ```bash
   eb create troopod-production
   ```

3. **Set environment variables**
   ```bash
   eb setenv ANTHROPIC_API_KEY=your_api_key_here
   ```

4. **Deploy**
   ```bash
   eb deploy
   ```

5. **Open**
   ```bash
   eb open
   ```

**Cost:** ~$20/month (t2.micro instance + load balancer)

---

## Option 6: Google Cloud Run (Serverless)

### Prerequisites
- Google Cloud account
- gcloud CLI installed

### Steps

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and deploy**
   ```bash
   gcloud run deploy troopod-lp-personalizer \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars ANTHROPIC_API_KEY=your_key
   ```

**Cost:** Pay per request, free tier: 2M requests/month

---

## Option 7: Vercel (Frontend-Focused)

### Note
Vercel is optimized for frontend. For this backend app, use serverless functions.

### Steps

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Create vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ],
     "env": {
       "ANTHROPIC_API_KEY": "@anthropic-api-key"
     }
   }
   ```

3. **Deploy**
   ```bash
   vercel
   ```

**Cost:** Free tier: 100GB bandwidth/month

---

## Recommended for Demo: Railway or Render

**Why:**
- Easy setup (no complex configuration)
- Free tier available
- Auto-deploys on git push
- Good for demos and MVPs
- Doesn't sleep as aggressively as Heroku

**Best Choice:** **Railway**
- Most modern interface
- Simple environment variable setup
- Fast deployments
- Free $5 credit monthly

---

## Production Deployment Checklist

Before deploying to production:

### Environment Variables
- [x] `ANTHROPIC_API_KEY` set securely
- [x] `NODE_ENV=production`
- [x] `PORT` configured (use platform default or 3000)

### Security
- [x] Add rate limiting
- [x] Enable CORS properly
- [x] Add helmet.js for security headers
- [x] Validate all inputs
- [x] Add API authentication (if needed)

### Performance
- [x] Enable compression
- [x] Add response caching
- [x] Implement request queuing
- [x] Set up CDN for static assets
- [x] Monitor API usage

### Monitoring
- [x] Add logging (Winston/Pino)
- [x] Error tracking (Sentry)
- [x] Uptime monitoring
- [x] Analytics

### Enhancements for Production

**Add to server.js:**

```javascript
// Compression
const compression = require('compression');
app.use(compression());

// Security headers
const helmet = require('helmet');
app.use(helmet());

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Request logging
const morgan = require('morgan');
app.use(morgan('combined'));
```

**Install packages:**
```bash
npm install compression helmet express-rate-limit morgan
```

---

## Custom Domain Setup

After deploying to any platform:

1. **Get deployment URL** (e.g., `troopod-lp.railway.app`)

2. **Add custom domain** (e.g., `personalizer.troopod.io`)
   - In platform dashboard, add custom domain
   - Update DNS records at your domain registrar
   - Add CNAME record pointing to platform URL

3. **SSL/HTTPS**
   - Most platforms provide automatic SSL
   - If not, use Let's Encrypt

---

## Testing Deployed App

```bash
# Health check
curl https://your-app-url.com/health

# Test personalization
curl -X POST https://your-app-url.com/api/personalize \
  -F "adCreative=@ad.jpg" \
  -F "landingPageURL=https://example.com"
```

---

## Monitoring & Maintenance

### Set up monitoring alerts for:
- API response time > 10s
- Error rate > 5%
- CPU usage > 80%
- Memory usage > 80%
- Anthropic API rate limits

### Regular maintenance:
- Monitor Anthropic API costs
- Review error logs weekly
- Update dependencies monthly
- Backup environment variables

---

## Cost Estimation (Monthly)

**Development/Demo:**
- Railway Free Tier: $0 (with $5 credit)
- Anthropic API: $5-10 (100-500 requests)
- **Total: $5-10/month**

**Production (low traffic):**
- Railway Pro: $20
- Anthropic API: $50 (1000-2000 requests)
- Monitoring: $0 (free tiers)
- **Total: $70/month**

**Production (high traffic):**
- Cloud provider: $100-200
- Anthropic API: $200+ (scaled usage)
- Monitoring/logging: $50
- **Total: $350-450/month**

---

## Support

For deployment help:
- Platform documentation
- Discord/Slack communities
- Contact: nj@troopod.io

---

**Recommended Next Step:** Deploy to Railway for demo, then present to Troopod team with live link!
