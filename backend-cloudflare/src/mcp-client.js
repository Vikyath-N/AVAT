/**
 * MCP Client for Cloudflare Workers Bindings
 * This module provides integration with the remote Cloudflare MCP server
 */

export class CloudflareMCPClient {
  constructor(env) {
    this.env = env;
    this.mcpServerUrl = 'https://bindings.mcp.cloudflare.com/sse';
    this.apiToken = env.CLOUDFLARE_API_TOKEN;
    this.accountId = env.CLOUDFLARE_ACCOUNT_ID;
  }

  /**
   * Create a new Worker with MCP bindings
   */
  async createWorkerWithBindings(workerConfig) {
    try {
      const response = await fetch(`${this.mcpServerUrl}/workers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId: this.accountId,
          name: workerConfig.name,
          script: workerConfig.script,
          bindings: workerConfig.bindings || {}
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create worker: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating worker with bindings:', error);
      throw error;
    }
  }

  /**
   * Get available bindings for the account
   */
  async getAvailableBindings() {
    try {
      const response = await fetch(`${this.mcpServerUrl}/bindings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get bindings: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting bindings:', error);
      throw error;
    }
  }

  /**
   * Create KV namespace binding
   */
  async createKVNamespace(name) {
    try {
      const response = await fetch(`${this.mcpServerUrl}/kv/namespaces`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId: this.accountId,
          name
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create KV namespace: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating KV namespace:', error);
      throw error;
    }
  }

  /**
   * Create D1 database binding
   */
  async createD1Database(name) {
    try {
      const response = await fetch(`${this.mcpServerUrl}/d1/databases`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId: this.accountId,
          name
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create D1 database: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating D1 database:', error);
      throw error;
    }
  }

  /**
   * Create R2 bucket binding
   */
  async createR2Bucket(name) {
    try {
      const response = await fetch(`${this.mcpServerUrl}/r2/buckets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId: this.accountId,
          name
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create R2 bucket: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating R2 bucket:', error);
      throw error;
    }
  }

  /**
   * Deploy worker with bindings
   */
  async deployWorker(workerId, script) {
    try {
      const response = await fetch(`${this.mcpServerUrl}/workers/${workerId}/deploy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          script
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to deploy worker: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deploying worker:', error);
      throw error;
    }
  }

  /**
   * Get worker logs
   */
  async getWorkerLogs(workerId, startTime, endTime) {
    try {
      const response = await fetch(`${this.mcpServerUrl}/workers/${workerId}/logs?start=${startTime}&end=${endTime}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get worker logs: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting worker logs:', error);
      throw error;
    }
  }

  /**
   * Get worker metrics
   */
  async getWorkerMetrics(workerId, timeRange = '1h') {
    try {
      const response = await fetch(`${this.mcpServerUrl}/workers/${workerId}/metrics?range=${timeRange}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get worker metrics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting worker metrics:', error);
      throw error;
    }
  }
}

export default CloudflareMCPClient;
