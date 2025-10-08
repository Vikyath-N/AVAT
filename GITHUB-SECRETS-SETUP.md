# GitHub Secrets Setup for AVAT Deployment

## Required Secrets

To deploy AVAT to GitHub Pages with the correct API configuration, you need to set up the following secrets in your GitHub repository.

### How to Add Secrets

1. Go to your GitHub repository: `https://github.com/vikyath-n/AVAT`
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret below

### Required Secrets

#### 1. PROD_API_BASE_URL
**Value:** `https://avat-backend.v-naradasi.workers.dev/api/v1`

**Description:** The production API base URL for the Cloudflare Workers backend. This MUST be HTTPS to avoid mixed content errors on GitHub Pages.

#### 2. PROD_WS_URL (Optional)
**Value:** `wss://avat-backend.v-naradasi.workers.dev/ws`

**Description:** WebSocket URL (currently not used with Cloudflare Workers, but kept for compatibility)

#### 3. MAPBOX_TOKEN
**Value:** `pk.eyJ1IjoidmlreWF0aCIsImEiOiJjbWZzcm15cDMwOXB3Mm1vbWo5YWV5Mjl6In0.Dndpo0Kbhw4qTuT-QZx7Gw`

**Description:** Mapbox public token for map rendering

## Verification

After adding these secrets:

1. Push a commit to trigger the GitHub Actions workflow
2. Wait for the deployment to complete
3. Visit `https://vikyath-n.github.io/AVAT/dashboard`
4. Open browser console and verify:
   - ✅ API requests go to `https://avat-backend.v-naradasi.workers.dev`
   - ✅ No mixed content warnings
   - ✅ Dashboard loads without errors

## Current Status

- ✅ Frontend code updated to handle HTTPS API calls
- ✅ Default fallback URL set to Cloudflare Workers HTTPS endpoint
- ⚠️ GitHub Secrets need to be configured (see above)
- 🔄 After secrets are set, push to trigger new deployment

## Troubleshooting

### Mixed Content Error
If you see "Mixed Content: The page at 'https://...' was loaded over HTTPS, but requested an insecure resource 'http://...'"

**Solution:** Ensure `PROD_API_BASE_URL` secret uses `https://` (not `http://`)

### Dashboard Error: "Cannot read properties of undefined"
If you see this error in the console:

**Solution:** 
1. Check that the API is returning data correctly: `curl https://avat-backend.v-naradasi.workers.dev/api/v1/stats`
2. Verify the response structure matches expected format
3. The frontend now handles both nested and flat response structures

### DNS Resolution Error
If curl shows "Could not resolve host: avat.vikyath.dev"

**Solution:** The domain `avat.vikyath.dev` doesn't exist. Use the Cloudflare Workers URL instead: `https://avat-backend.v-naradasi.workers.dev`

