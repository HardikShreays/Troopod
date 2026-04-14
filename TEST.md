# Test Instructions

## Quick Test

1. Start the server:
```bash
npm start
```

2. Open http://localhost:3000 in your browser

3. Test with sample data:

### Sample Ad Creative
You can use any ad image. For testing, try:
- Screenshot of a Facebook/Google ad
- Product promotional banner
- Service advertisement

### Sample Landing Pages to Test
- https://www.anthropic.com
- https://stripe.com
- https://www.shopify.com
- https://www.notion.so
- https://vercel.com

### Expected Results
The system should:
1. Extract key messaging from your ad
2. Analyze the landing page structure
3. Generate a personalized version that matches the ad's:
   - Tone and voice
   - Value proposition
   - Call-to-action style
   - Emotional triggers

### Validation Checks
✅ All 4 processing steps complete
✅ No broken HTML structure
✅ Modifications list shows specific changes
✅ Personalized page opens in new window
✅ Download works correctly

## API Testing

Test the API directly:

```bash
# Health check
curl http://localhost:3000/health

# Personalization (with file)
curl -X POST http://localhost:3000/api/personalize \
  -F "adCreative=@/path/to/ad.jpg" \
  -F "landingPageURL=https://example.com"
```

## Troubleshooting

### Server won't start
- Check that port 3000 is available
- Verify .env file has ANTHROPIC_API_KEY set

### "Ad analysis failed"
- Check API key is valid
- Verify image file is valid format (JPG/PNG)
- Check file size is under 10MB

### "Page scraping failed"  
- URL must include http:// or https://
- Page must be publicly accessible
- Check for network/firewall issues

### "HTML generation failed"
- This is rare due to fallback mechanisms
- Check console logs for details
- System should still return partial results
