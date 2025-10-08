# MCP Integration Setup Guide

This guide walks you through setting up the Cloudflare MCP (Model Context Protocol) integration for the AVAT project.

## Prerequisites

1. **Cloudflare Account**: You need an active Cloudflare account
2. **API Token**: Generate a Cloudflare API token with appropriate permissions
3. **Account ID**: Your Cloudflare account ID

## Step 1: Generate Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. Set permissions:
   - **Account**: `Cloudflare Workers:Edit`
   - **Zone**: `Zone:Read` (if needed)
5. Set account resources to include your account
6. Copy the generated token

## Step 2: Get Your Account ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain or go to "My Profile"
3. Copy your Account ID from the right sidebar

## Step 3: Set Environment Variables

Set the secrets in your Cloudflare Worker:

```bash
# Set API token
wrangler secret put CLOUDFLARE_API_TOKEN

# Set account ID
wrangler secret put CLOUDFLARE_ACCOUNT_ID
```

## Step 4: Deploy the Worker

```bash
npm run deploy
```

## Step 5: Test the Integration

### Test MCP Client Info
```bash
curl https://avat-backend.vikyath.workers.dev/mcp/info
```

### Test Available Bindings
```bash
curl https://avat-backend.vikyath.workers.dev/mcp/bindings
```

### Create KV Namespace
```bash
curl -X POST https://avat-backend.vikyath.workers.dev/mcp/kv \
  -H "Content-Type: application/json" \
  -d '{"name": "avat-cache"}'
```

### Create D1 Database
```bash
curl -X POST https://avat-backend.vikyath.workers.dev/mcp/d1 \
  -H "Content-Type: application/json" \
  -d '{"name": "avat-data"}'
```

### Create R2 Bucket
```bash
curl -X POST https://avat-backend.vikyath.workers.dev/mcp/r2 \
  -H "Content-Type: application/json" \
  -d '{"name": "avat-storage"}'
```

## Step 6: Configure MCP Client (Optional)

If you want to use the MCP client with AI assistants like Claude Desktop:

1. Install the MCP remote tool:
   ```bash
   npm install -g mcp-remote
   ```

2. Configure your MCP client (e.g., in Claude Desktop):
   ```json
   {
     "mcpServers": {
       "cloudflare-bindings": {
         "command": "npx",
         "args": ["mcp-remote", "https://bindings.mcp.cloudflare.com/sse"]
       }
     }
   }
   ```

## Usage Examples

### Programmatic Usage

```javascript
import { CloudflareMCPClient } from './mcp-client.js';

// Initialize client
const mcpClient = new CloudflareMCPClient(env);

// Get available bindings
const bindings = await mcpClient.getAvailableBindings();

// Create services
const kvNamespace = await mcpClient.createKVNamespace('avat-cache');
const d1Database = await mcpClient.createD1Database('avat-data');
const r2Bucket = await mcpClient.createR2Bucket('avat-storage');

// Deploy worker
const worker = await mcpClient.deployWorker(workerId, script);

// Get metrics
const metrics = await mcpClient.getWorkerMetrics(workerId, '1h');
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Verify your API token has correct permissions
2. **Account ID Issues**: Ensure you're using the correct account ID
3. **Rate Limiting**: Cloudflare has rate limits on API calls
4. **CORS Issues**: Check that your origin is allowed in the CORS configuration

### Debug Mode

Enable debug logging:
```bash
DEBUG=avat:mcp npm run dev
```

### Check Logs

View worker logs:
```bash
wrangler tail
```

## Security Considerations

1. **API Token Security**: Never commit API tokens to version control
2. **Permissions**: Use least-privilege principle for API tokens
3. **Rate Limiting**: Implement proper rate limiting in your application
4. **CORS**: Configure CORS appropriately for your use case

## Next Steps

1. **Integrate with Frontend**: Use the MCP endpoints in your frontend application
2. **Add Monitoring**: Set up monitoring for MCP operations
3. **Scale Services**: Create additional KV namespaces, D1 databases, or R2 buckets as needed
4. **Automate Deployment**: Set up CI/CD pipelines for automated deployments

## Support

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Cloudflare MCP Server Repository](https://github.com/cloudflare/mcp-server-cloudflare)
