import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
import { scheduledIndexSync, scheduledPDFSync } from './scheduler';
import { CloudflareMCPClient } from './mcp-client.js';
import postgres from 'postgres';

// Initialize Hono app
const app = new Hono();

// Initialize MCP Client
let mcpClient = null;

// Add CORS middleware
app.use('/*', cors({
  origin: (origin) => {
    // Allow requests from your frontend domains
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://vikyath-n.github.io',
      'https://avat.vikyath.dev'
    ];

    if (allowedOrigins.includes(origin)) {
      return origin;
    }

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) {
      return '*';
    }

    return null;
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Environment variables (set in Cloudflare dashboard or wrangler.toml)
// Note: In Cloudflare Workers, these will be passed from request context

// Helper function to create a Neon PostgreSQL connection
async function createNeonClient(databaseUrl) {
  const sql = postgres(databaseUrl, {
    ssl: 'require',
    max: 1, // Cloudflare Workers should use minimal connections
    idle_timeout: 20,
    connect_timeout: 10,
  });
  
  // Set search_path to include avat_app schema
  try {
    await sql`SET search_path TO avat_app, public`;
  } catch (e) {
    console.log('Note: Could not set search_path, using default schema');
  }
  
  return sql;
}

// Helper function to query Upstash Redis
async function redisGet(key, upstashUrl, upstashToken) {
  try {
    const response = await fetch(`${upstashUrl}/get/${key}`, {
      headers: {
        'Authorization': `Bearer ${upstashToken}`
      }
    });
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

async function redisSet(key, value, ttl = null, upstashUrl, upstashToken) {
  try {
    const body = { value: JSON.stringify(value) };
    if (ttl) {
      body.px = ttl;
    }

    const response = await fetch(`${upstashUrl}/set/${key}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${upstashToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    return response.ok;
  } catch (error) {
    console.error('Redis SET error:', error);
    return false;
  }
}

// Health check endpoint
app.get('/api/v1/health', async (c) => {
  try {
    // Test database connection directly
    let accidentCount = 0;
    const databaseUrl = c.env.DATABASE_URL || 'YOUR_DATABASE_URL';
    if (databaseUrl && databaseUrl !== 'YOUR_DATABASE_URL') {
      try {
        // Simple database connectivity test
        const response = await fetch(`${databaseUrl.replace('postgresql://', 'https://')}/?query=SELECT+1`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${databaseUrl.split('@')[0].split(':')[2] || ''}`
          }
        });
        accidentCount = response.ok ? 'connected' : 'error';
      } catch (dbError) {
        accidentCount = 'error';
      }
    }

    // Test Redis connection - get environment variables from Cloudflare context
    const upstashUrl = c.env.UPSTASH_REDIS_REST_URL || 'https://your-redis.upstash.io';
    const upstashToken = c.env.UPSTASH_REDIS_REST_TOKEN || 'your_upstash_token';
    const redisTest = await redisSet('health_test', 'ok', 5000, upstashUrl, upstashToken);

    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: accidentCount || 'not_configured'
      },
      cache: {
        status: redisTest ? 'connected' : 'error'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return c.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 503);
  }
});

// Get system stats
app.get('/api/v1/stats', async (c) => {
  try {
    const databaseUrl = c.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    const sql = await createNeonClient(databaseUrl);

    try {
      // Query real stats from the database
      const [stats] = await sql`
        SELECT 
          COUNT(*) as total_accidents,
          COUNT(DISTINCT company) as total_companies,
          COUNT(DISTINCT city) as total_cities,
          MAX(created_at) as last_update
        FROM accidents
      `;

      await sql.end();

      return c.json({
        data: {
          total_accidents: parseInt(stats.total_accidents),
          total_companies: parseInt(stats.total_companies),
          total_cities: parseInt(stats.total_cities),
          data_freshness: stats.last_update,
          update_frequency: "daily",
          api_version: "2.0.0",
          database_size: "1.2 MB"
        },
        status: "success",
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      await sql.end();
      throw dbError;
    }
  } catch (error) {
    console.error('Stats error:', error);
    return c.json({
      error: "Internal Server Error",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Get analytics overview
app.get('/api/v1/analytics/overview', async (c) => {
  try {
    const databaseUrl = c.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    const sql = await createNeonClient(databaseUrl);

    try {
      // Query company stats
      const companyStats = await sql`
        SELECT 
          company,
          COUNT(*) as accident_count,
          AVG(COALESCE(casualties, 0)) as avg_casualties,
          COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as market_share
        FROM accidents
        WHERE company IS NOT NULL
        GROUP BY company
        ORDER BY accident_count DESC
      `;

      // Query city stats
      const cityStats = await sql`
        SELECT 
          city,
          city_type,
          COUNT(*) as accident_count,
          intersection_type as most_common_intersection_type
        FROM accidents
        WHERE city IS NOT NULL
        GROUP BY city, city_type, intersection_type
        ORDER BY accident_count DESC
        LIMIT 10
      `;

      // Query summary stats
      const [summary] = await sql`
        SELECT 
          COUNT(*) as total_accidents,
          damage_severity as most_common_severity
        FROM accidents
        GROUP BY damage_severity
        ORDER BY COUNT(*) DESC
        LIMIT 1
      `;

      await sql.end();

      return c.json({
        data: {
          company_stats: companyStats.map(row => ({
            company: row.company,
            accident_count: parseInt(row.accident_count),
            avg_casualties: parseFloat(row.avg_casualties).toFixed(1),
            market_share: parseFloat(row.market_share).toFixed(2)
          })),
          city_stats: cityStats.map(row => ({
            city: row.city,
            city_type: row.city_type,
            accident_count: parseInt(row.accident_count),
            most_common_intersection_type: row.most_common_intersection_type
          })),
          summary: {
            total_accidents: parseInt(summary.total_accidents),
            trend_direction: "stable",
            trend_percentage: 0.0,
            most_common_severity: summary.most_common_severity || "MINOR"
          }
        },
        status: "success",
        message: null,
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      await sql.end();
      throw dbError;
    }
  } catch (error) {
    console.error('Analytics error:', error);
    return c.json({
      error: "Internal Server Error",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Get accidents with filtering
app.get('/api/v1/accidents', async (c) => {
  try {
    const databaseUrl = c.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    const sql = await createNeonClient(databaseUrl);

    try {
      // Get query parameters
      const { 
        limit = 100, 
        offset = 0, 
        company, 
        city, 
        severity,
        start_date,
        end_date
      } = c.req.query();

      // Build dynamic query based on filters
      let query = sql`
        SELECT 
          id, timestamp, company, vehicle_make, vehicle_model,
          location_address, location_lat, location_lng,
          city, county, city_type, intersection_type,
          damage_severity, weather_conditions, time_of_day,
          casualties, av_mode, speed_limit, traffic_signals,
          road_type, damage_location, report_url, created_at
        FROM accidents
        WHERE 1=1
      `;

      // Apply filters (basic implementation)
      if (company) {
        query = sql`${query} AND company = ${company}`;
      }
      if (city) {
        query = sql`${query} AND city = ${city}`;
      }
      if (severity) {
        query = sql`${query} AND damage_severity = ${severity}`;
      }

      // Add ordering and pagination
      const accidents = await sql`
        ${query}
        ORDER BY timestamp DESC
        LIMIT ${parseInt(limit)}
        OFFSET ${parseInt(offset)}
      `;

      // Get total count
      const [countResult] = await sql`
        SELECT COUNT(*) as total FROM accidents
      `;

      await sql.end();

      return c.json({
        data: accidents,
        status: 'success',
        timestamp: new Date().toISOString(),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: parseInt(countResult.total)
        }
      });
    } catch (dbError) {
      await sql.end();
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching accidents:', error);
    return c.json({
      error: 'Internal server error',
      message: error.message
    }, 500);
  }
});

// Get analytics data (placeholder for now)
app.get('/api/v1/analytics', async (c) => {
  try {
    const { type = 'overview' } = c.req.query();

    // For now, return placeholder analytics
    // TODO: Implement direct PostgreSQL queries when schema is ready

    const analyticsData = {
      total_accidents: 0,
      companies: {},
      severities: {},
      states: {},
      message: 'Database connected. Analytics will be available after schema migration.'
    };

    return c.json({
      data: analyticsData,
      status: 'success',
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return c.json({
      error: 'Internal server error',
      message: error.message
    }, 500);
  }
});

// Get filter options (placeholder for now)
app.get('/api/v1/filters/options', async (c) => {
  try {
    // For now, return placeholder filter options
    // TODO: Implement direct PostgreSQL queries when schema is ready

    const options = {
      companies: ['Tesla', 'Waymo', 'Cruise', 'Zoox'],
      states: ['CA', 'AZ', 'TX', 'FL', 'NV'],
      severities: ['Minor', 'Moderate', 'Major', 'Fatal'],
      message: 'Filter options will be populated after schema migration.'
    };

    return c.json({
      data: options,
      status: 'success',
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching filter options:', error);
    return c.json({
      error: 'Internal server error',
      message: error.message
    }, 500);
  }
});

// MCP Client endpoints
app.get('/mcp/bindings', async (c) => {
  try {
    // Debug: Log environment variables
    console.log('Environment variables available:', Object.keys(c.env));
    console.log('CLOUDFLARE_API_TOKEN present:', !!c.env.CLOUDFLARE_API_TOKEN);
    console.log('CLOUDFLARE_ACCOUNT_ID present:', !!c.env.CLOUDFLARE_ACCOUNT_ID);

    // Initialize MCP client if not already done
    if (!mcpClient) {
      mcpClient = new CloudflareMCPClient(c.env);
    }

    // Get available bindings
    const bindings = await mcpClient.getAvailableBindings();
    return c.json({
      success: true,
      data: bindings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('MCP Client error:', error);
    return c.json({
      error: 'MCP Client Error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Create KV namespace
app.post('/mcp/kv', async (c) => {
  try {
    if (!mcpClient) {
      mcpClient = new CloudflareMCPClient(c.env);
    }
    
    const { name } = await c.req.json();
    const result = await mcpClient.createKVNamespace(name);
    
    return c.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('KV creation error:', error);
    return c.json({
      error: 'KV Creation Error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Create D1 database
app.post('/mcp/d1', async (c) => {
  try {
    if (!mcpClient) {
      mcpClient = new CloudflareMCPClient(c.env);
    }
    
    const { name } = await c.req.json();
    const result = await mcpClient.createD1Database(name);
    
    return c.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('D1 creation error:', error);
    return c.json({
      error: 'D1 Creation Error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Create R2 bucket
app.post('/mcp/r2', async (c) => {
  try {
    if (!mcpClient) {
      mcpClient = new CloudflareMCPClient(c.env);
    }
    
    const { name } = await c.req.json();
    const result = await mcpClient.createR2Bucket(name);
    
    return c.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('R2 creation error:', error);
    return c.json({
      error: 'R2 Creation Error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// MCP Client info endpoint
app.get('/mcp/info', (c) => {
  return c.json({
    name: 'AVAT MCP Client',
    version: '1.0.0',
    description: 'Model Context Protocol client for Cloudflare Workers integration',
    capabilities: [
      'getAvailableBindings',
      'createKVNamespace',
      'createD1Database',
      'createR2Bucket',
      'deployWorker',
      'getWorkerLogs',
      'getWorkerMetrics'
    ],
    serverUrl: 'https://api.cloudflare.com/client/v4',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'AV Accident Analysis Platform API',
    version: '2.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    docs: '/api/docs',
    mcp: '/mcp/info',
    endpoints: [
      '/api/v1/health',
      '/api/v1/accidents',
      '/api/v1/analytics',
      '/api/v1/filters/options',
      '/mcp/info'
    ]
  });
});

// Cron trigger endpoints (for Cloudflare Workers cron)
app.get('/cron/index-sync', async (c) => {
  return await scheduledIndexSync();
});

app.get('/cron/pdf-sync', async (c) => {
  return await scheduledPDFSync();
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    timestamp: new Date().toISOString()
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  }, 500);
});

export default app;
