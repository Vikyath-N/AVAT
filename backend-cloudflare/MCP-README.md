# AVAT MCP Client Integration

This document describes the integration of the Cloudflare Model Context Protocol (MCP) client into the AVAT (Autonomous Vehicle Accident Tracking) project.

## Overview

The MCP client provides integration with the remote Cloudflare MCP server, enabling the AVAT application to interact with Cloudflare services through the Model Context Protocol. This allows for programmatic management of Cloudflare Workers, KV storage, D1 databases, and R2 buckets.

## Features

### Cloudflare Service Management
- **getAvailableBindings**: Get available Cloudflare bindings for the account
- **createKVNamespace**: Create KV storage namespaces
- **createD1Database**: Create D1 SQL databases
- **createR2Bucket**: Create R2 object storage buckets
- **deployWorker**: Deploy Workers with bindings
- **getWorkerLogs**: Retrieve Worker execution logs
- **getWorkerMetrics**: Get Worker performance metrics

## Configuration

### Environment Variables
The MCP client requires the following environment variables:

```bash
# Cloudflare API credentials (set via wrangler secret put)
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

### MCP Client Configuration
The client configuration is defined in `src/mcp-client.js` and includes:

- Remote MCP server URL: `https://bindings.mcp.cloudflare.com/sse`
- API authentication with Cloudflare tokens
- Service management methods for Workers, KV, D1, and R2

## Usage

### API Endpoints

#### MCP Client Info
```
GET /mcp/info
```
Returns information about the MCP client capabilities.

#### Get Available Bindings
```
GET /mcp/bindings
```
Returns available Cloudflare bindings for the account.

#### Create KV Namespace
```
POST /mcp/kv
Content-Type: application/json

{
  "name": "my-kv-namespace"
}
```

#### Create D1 Database
```
POST /mcp/d1
Content-Type: application/json

{
  "name": "my-d1-database"
}
```

#### Create R2 Bucket
```
POST /mcp/r2
Content-Type: application/json

{
  "name": "my-r2-bucket"
}
```

### Example Usage

#### Get Available Bindings
```javascript
const mcpClient = new CloudflareMCPClient(env);
const bindings = await mcpClient.getAvailableBindings();
```

#### Create KV Namespace
```javascript
const result = await mcpClient.createKVNamespace('avat-cache');
```

#### Create D1 Database
```javascript
const result = await mcpClient.createD1Database('avat-data');
```

#### Deploy Worker
```javascript
const result = await mcpClient.deployWorker(workerId, script);
```

## Development

### Testing
Run the test script to verify MCP client functionality:

```bash
npm run test:mcp
```

### Local Development
Start the development server:

```bash
npm run dev
```

### Deployment
Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## MCP Protocol

The server implements the Model Context Protocol specification, providing:

1. **Tools**: Functions that AI models can call
2. **Resources**: Data sources that can be accessed
3. **Prompts**: Predefined queries for common tasks

### Tool Schema
Each tool includes:
- Name and description
- Input schema with validation
- Required and optional parameters
- Type definitions

### Resource Schema
Resources define:
- URI for identification
- Name and description
- MIME type
- Access permissions

## Integration with AI Models

The MCP server can be integrated with various AI models and assistants:

1. **Claude Desktop**: Add the MCP server URL to Claude Desktop configuration
2. **Custom AI Applications**: Use the MCP client libraries
3. **Web Interfaces**: Direct API calls to MCP endpoints

## Security

- CORS configuration restricts access to allowed origins
- Rate limiting prevents abuse
- Input validation on all tool parameters
- Secure handling of environment variables

## Monitoring

The MCP server includes:
- Health check endpoints
- Error logging and reporting
- Performance metrics
- Cache hit/miss statistics

## Troubleshooting

### Common Issues

1. **MCP Server not responding**: Check Cloudflare bindings configuration
2. **Tool execution errors**: Verify input parameters and environment variables
3. **Cache issues**: Check KV namespace configuration

### Debug Mode
Enable debug logging by setting the `DEBUG` environment variable:

```bash
DEBUG=avat:mcp npm run dev
```

## Contributing

When adding new tools or capabilities:

1. Define the tool in `mcp-config.js`
2. Implement the tool method in `mcp-server.js`
3. Add tests in `test-mcp.js`
4. Update this documentation

## References

- [Cloudflare MCP Server Documentation](https://github.com/cloudflare/mcp-server-cloudflare)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
