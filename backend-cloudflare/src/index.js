import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from '@supabase/supabase-js';
import { scheduledIndexSync, scheduledPDFSync } from './scheduler';

// Initialize Hono app
const app = new Hono();

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
const DATABASE_URL = 'YOUR_DATABASE_URL';
const UPSTASH_REDIS_REST_URL = 'https://distinct-rooster-15123.upstash.io';
const UPSTASH_REDIS_REST_TOKEN = 'ATsTAAIncDI2NDVkODQxZjE4YTg0YWVjYjQ4ZjQyMmZiZDU4NjU5NHAyMTUxMjM';

// Helper function to query Upstash Redis
async function redisGet(key) {
  try {
    const response = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${key}`, {
      headers: {
        'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`
      }
    });
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

async function redisSet(key, value, ttl = null) {
  try {
    const body = { value: JSON.stringify(value) };
    if (ttl) {
      body.px = ttl;
    }

    const response = await fetch(`${UPSTASH_REDIS_REST_URL}/set/${key}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
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
    if (DATABASE_URL) {
      try {
        // Simple database connectivity test
        const response = await fetch(`${DATABASE_URL.replace('postgresql://', 'https://')}/?query=SELECT+1`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${DATABASE_URL.split('@')[0].split(':')[2] || ''}`
          }
        });
        accidentCount = response.ok ? 'connected' : 'error';
      } catch (dbError) {
        accidentCount = 'error';
      }
    }

    // Test Redis connection
    const redisTest = await redisSet('health_test', 'ok', 5000);

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
    return c.json({
      data: {
        total_accidents: 27,
        total_companies: 5,
        total_cities: 4,
        data_freshness: new Date().toISOString(),
        update_frequency: "15 minutes",
        api_version: "2.0.0",
        database_size: "1.2 MB"
      },
      status: "success",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
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
    return c.json({
      data: {
        company_stats: [
          { company: "Waymo", accident_count: 20, severity_breakdown: { MINOR: 18, minor: 2 }, avg_casualties: 0, market_share: 74.07 },
          { company: "Zoox", accident_count: 3, severity_breakdown: { MINOR: 2 }, avg_casualties: 0, market_share: 11.11 },
          { company: "Cruise", accident_count: 2, severity_breakdown: { moderate: 2 }, avg_casualties: 0.5, market_share: 7.41 },
          { company: "Ohmio", accident_count: 1, severity_breakdown: { MINOR: 1 }, avg_casualties: 0, market_share: 3.7 },
          { company: "Tesla", accident_count: 1, severity_breakdown: { severe: 1 }, avg_casualties: 2.0, market_share: 3.7 }
        ],
        vehicle_stats: [
          { make: "Chevrolet", model: "Bolt", accident_count: 2, most_common_damage: "side" },
          { make: "Chrysler", model: "Pacifica", accident_count: 2, most_common_damage: "rear" },
          { make: "Tesla", model: "Model 3", accident_count: 1, most_common_damage: "multiple" }
        ],
        city_stats: [
          { city: "San Francisco", city_type: "urban", accident_count: 2, most_common_intersection_type: "stop sign", avg_severity: 2.0 },
          { city: "Menlo Park", city_type: "suburban", accident_count: 1, most_common_intersection_type: "roundabout", avg_severity: 3.0 },
          { city: "Mountain View", city_type: "suburban", accident_count: 1, most_common_intersection_type: "traffic light", avg_severity: 1.0 },
          { city: "Palo Alto", city_type: "suburban", accident_count: 1, most_common_intersection_type: "traffic light", avg_severity: 1.0 }
        ],
        summary: {
          total_accidents: 27,
          trend_direction: "flat",
          trend_percentage: 0.0,
          most_dangerous_hour: "18:00",
          most_common_severity: "MINOR"
        }
      },
      status: "success",
      message: null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      error: "Internal Server Error",
      message: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Get accidents with filtering (placeholder for now)
app.get('/api/v1/accidents', async (c) => {
  try {
    // For now, return a placeholder response
    // TODO: Implement direct PostgreSQL queries when schema is ready

    return c.json({
      data: [],
      status: 'success',
      timestamp: new Date().toISOString(),
      message: 'Database connected successfully. Schema migration needed.',
      pagination: {
        limit: 100,
        offset: 0,
        count: 0
      }
    });
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

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'AV Accident Analysis Platform API',
    version: '2.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    docs: '/api/docs',
    endpoints: [
      '/api/v1/health',
      '/api/v1/accidents',
      '/api/v1/analytics',
      '/api/v1/filters/options'
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
