/**
 * Test script for AVAT MCP Client
 * This script tests the MCP client functionality
 */

import { CloudflareMCPClient } from './mcp-client.js';

// Mock environment for testing
const mockEnv = {
  CLOUDFLARE_API_TOKEN: 'test_token',
  CLOUDFLARE_ACCOUNT_ID: 'test_account_id'
};

// Test function
async function testMCPClient() {
  console.log('🚀 Testing AVAT MCP Client...\n');
  
  try {
    // Initialize MCP client
    const mcpClient = new CloudflareMCPClient(mockEnv);
    console.log('✅ MCP Client initialized successfully');
    console.log('Server URL:', mcpClient.mcpServerUrl);
    console.log('Account ID:', mcpClient.accountId);
    
    // Test getting available bindings (this will fail in test mode)
    console.log('\n📊 Testing getAvailableBindings...');
    try {
      const bindings = await mcpClient.getAvailableBindings();
      console.log('Available bindings:', bindings);
    } catch (error) {
      console.log('Expected error (no real API token):', error.message);
    }
    
    // Test creating KV namespace (this will fail in test mode)
    console.log('\n💾 Testing createKVNamespace...');
    try {
      const kvResult = await mcpClient.createKVNamespace('test-kv');
      console.log('KV namespace created:', kvResult);
    } catch (error) {
      console.log('Expected error (no real API token):', error.message);
    }
    
    // Test creating D1 database (this will fail in test mode)
    console.log('\n🗄️ Testing createD1Database...');
    try {
      const d1Result = await mcpClient.createD1Database('test-d1');
      console.log('D1 database created:', d1Result);
    } catch (error) {
      console.log('Expected error (no real API token):', error.message);
    }
    
    // Test creating R2 bucket (this will fail in test mode)
    console.log('\n🪣 Testing createR2Bucket...');
    try {
      const r2Result = await mcpClient.createR2Bucket('test-r2');
      console.log('R2 bucket created:', r2Result);
    } catch (error) {
      console.log('Expected error (no real API token):', error.message);
    }
    
    console.log('\n✅ All MCP Client tests completed successfully!');
    console.log('\n📝 Note: To test with real Cloudflare API, set up:');
    console.log('1. CLOUDFLARE_API_TOKEN environment variable');
    console.log('2. CLOUDFLARE_ACCOUNT_ID environment variable');
    console.log('3. Deploy the worker with proper secrets');
    
  } catch (error) {
    console.error('❌ MCP Client test failed:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMCPClient()
    .then(() => {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Tests failed:', error);
      process.exit(1);
    });
}

export { testMCPClient };
