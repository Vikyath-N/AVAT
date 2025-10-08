/**
 * MCP Client for Cloudflare Workers Bindings
 * This module provides integration with the remote Cloudflare MCP server
 */

export class CloudflareMCPClient {
  constructor(env) {
    this.env = env;
    this.apiBaseUrl = 'https://api.cloudflare.com/client/v4';
    this.apiToken = env.CLOUDFLARE_API_TOKEN || 'MISSING';
    this.accountId = env.CLOUDFLARE_ACCOUNT_ID || 'MISSING';
  }

  /**
   * Create a new Worker with MCP bindings
   */
  async createWorkerWithBindings(workerConfig) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/accounts/${this.accountId}/workers/scripts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
      console.log('MCP Client - API Token:', this.apiToken ? 'Present' : 'Missing');
      console.log('MCP Client - Account ID:', this.accountId);

      // Get account details and available services
      const accountResponse = await fetch(`${this.apiBaseUrl}/accounts/${this.accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Account response status:', accountResponse.status);
      console.log('Account response headers:', Object.fromEntries(accountResponse.headers));

      if (!accountResponse.ok) {
        const errorText = await accountResponse.text();
        console.log('Account error response:', errorText);
        throw new Error(`Failed to get account info: ${accountResponse.status} ${accountResponse.statusText} - ${errorText}`);
      }

      const accountData = await accountResponse.json();
      console.log('Account data received successfully');

      // Get workers scripts
      const workersResponse = await fetch(`${this.apiBaseUrl}/accounts/${this.accountId}/workers/scripts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Workers response status:', workersResponse.status);

      const workersData = workersResponse.ok ? await workersResponse.json() : { result: [] };
      console.log('Workers data retrieved, count:', workersData.result?.length || 0);

      return {
        account: accountData.result,
        workers: workersData.result,
        availableServices: {
          kv: true,
          d1: true,
          r2: true,
          workers: true
        }
      };
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
      const response = await fetch(`${this.apiBaseUrl}/accounts/${this.accountId}/storage/kv/namespaces`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: name
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
      const response = await fetch(`${this.apiBaseUrl}/accounts/${this.accountId}/d1/database`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
      const response = await fetch(`${this.apiBaseUrl}/accounts/${this.accountId}/r2/buckets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
      const response = await fetch(`${this.apiBaseUrl}/accounts/${this.accountId}/workers/scripts/${workerId}`, {
        method: 'PUT',
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
      // Cloudflare Workers logs are typically accessed through wrangler tail or dashboard
      // This is a simplified implementation
      return {
        workerId,
        logs: [],
        message: 'Worker logs are available through wrangler tail or Cloudflare dashboard'
      };
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
      // Cloudflare Workers metrics are available through the dashboard or analytics API
      // This is a simplified implementation
      return {
        workerId,
        timeRange,
        metrics: {
          requests: 0,
          errors: 0,
          cpuTime: 0,
          message: 'Worker metrics are available through Cloudflare dashboard analytics'
        }
      };
    } catch (error) {
      console.error('Error getting worker metrics:', error);
      throw error;
    }
  }
}

export default CloudflareMCPClient;
