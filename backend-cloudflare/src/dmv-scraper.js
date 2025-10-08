/**
 * DMV Collision Reports Scraper for Cloudflare Workers
 * Scrapes https://www.dmv.ca.gov/portal/vehicle-industry-services/autonomous-vehicles/autonomous-vehicle-collision-reports/
 * Runs daily at 5am UTC via cron trigger
 */

import postgres from 'postgres';

const DMV_BASE_URL = 'https://www.dmv.ca.gov/portal/vehicle-industry-services/autonomous-vehicles/autonomous-vehicle-collision-reports/';
const DMV_DOMAIN = 'https://www.dmv.ca.gov';

/**
 * Parse anchor text like "Waymo September 18, 2025 (PDF)" or "Waymo August 21, 2025 (2) (PDF)"
 * Returns: { manufacturer, date, year, sequenceNum, displayText }
 */
function parseAnchorText(text) {
  // Remove multiple " (PDF)" suffixes and clean up
  let clean = text.replace(/\s*\(PDF\)\s*/gi, ' ').trim();
  
  // Remove "Narrative" suffix if present
  clean = clean.replace(/\s+Narrative\s*$/i, '').trim();
  
  // Extract sequence indicators: (2), (A), (B), (3), etc.
  let sequenceNum = 1;
  const seqMatch = clean.match(/\(([0-9]+|[A-Z])\)$/);
  if (seqMatch) {
    const seq = seqMatch[1];
    // If letter (A, B, C), convert to number (1, 2, 3)
    if (/^[A-Z]$/.test(seq)) {
      sequenceNum = seq.charCodeAt(0) - 64; // A=1, B=2, C=3, etc.
    } else {
      sequenceNum = parseInt(seq, 10);
    }
    clean = clean.replace(/\s*\([0-9A-Z]+\)$/, '').trim();
  }
  
  // Parse format: "Manufacturer Month DD, YYYY" or "Manufacturer Month DD YYYY"
  // Also handle "Month DD. YYYY" (period instead of comma)
  // Examples: "Waymo September 18, 2025", "Mercedes-Benz February 7, 2025", "Waymo June 28. 2023"
  const match = clean.match(/^(.+?)\s+([A-Z][a-z]+)\s+(\d{1,2})[,.]?\s+(\d{4})$/i);
  
  if (!match) {
    console.log(`Failed to parse anchor text: "${text}"`);
    return null;
  }
  
  const manufacturer = match[1].trim();
  const month = match[2];
  const day = parseInt(match[3], 10);
  const year = parseInt(match[4], 10);
  
  // Convert to ISO date string
  const monthMap = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };
  const monthNum = monthMap[month.toLowerCase()];
  if (!monthNum) {
    console.log(`Failed to parse month in: "${text}"`);
    return null;
  }
  
  const dateStr = `${year}-${monthNum}-${String(day).padStart(2, '0')}`;
  
  return {
    manufacturer,
    date: dateStr,
    year,
    sequenceNum,
    displayText: text.trim()
  };
}

/**
 * Scrape all PDF links from the DMV collision reports page
 * Returns array of { manufacturer, date, year, pdfUrl, displayText, sequenceNum }
 */
async function scrapeDMVPage() {
  console.log(`Fetching DMV page: ${DMV_BASE_URL}`);
  
  const response = await fetch(DMV_BASE_URL, {
    headers: {
      'User-Agent': 'AVATBot/2.0 (+https://avat.vikyath.dev)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  
  if (!response.ok) {
    throw new Error(`DMV page fetch failed: ${response.status} ${response.statusText}`);
  }
  
  const html = await response.text();
  const reports = [];
  
  // Parse HTML to extract links (simple regex-based for Cloudflare Workers)
  // Match patterns like: <a href="/portal/file/...">Waymo September 18, 2025 (PDF)</a>
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*\(PDF\)[^<]*)<\/a>/gi;
  
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].trim();
    
    // Skip if not a collision report link
    if (!text.includes('(PDF)')) continue;
    
    const parsed = parseAnchorText(text);
    if (!parsed) continue;
    
    // Construct full URL
    const pdfUrl = href.startsWith('http') ? href : `${DMV_DOMAIN}${href}`;
    
    reports.push({
      manufacturer: parsed.manufacturer,
      incidentDate: parsed.date,
      year: parsed.year,
      sequenceNum: parsed.sequenceNum,
      displayText: parsed.displayText,
      pdfUrl,
      pageUrl: DMV_BASE_URL
    });
  }
  
  console.log(`Scraped ${reports.length} collision reports from DMV website`);
  return reports;
}

/**
 * Upsert scraped reports into Neon database
 */
async function upsertReportsToNeon(reports, databaseUrl) {
  const sql = postgres(databaseUrl, {
    ssl: 'require',
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10
  });
  
  try {
    let newCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const report of reports) {
      try {
        // Create unique slug for deduplication
        const slug = `${report.manufacturer.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${report.incidentDate}-${report.sequenceNum}`;
        
        // Upsert into dmv_reports table
        const result = await sql`
          INSERT INTO dmv_reports (
            manufacturer, incident_date, year, sequence_num,
            display_text, page_url, pdf_url, source_slug,
            status, created_at, updated_at
          ) VALUES (
            ${report.manufacturer},
            ${report.incidentDate},
            ${report.year},
            ${report.sequenceNum},
            ${report.displayText},
            ${report.pageUrl},
            ${report.pdfUrl},
            ${slug},
            'new',
            NOW(),
            NOW()
          )
          ON CONFLICT (source_slug)
          DO UPDATE SET
            pdf_url = EXCLUDED.pdf_url,
            updated_at = NOW()
          RETURNING (xmax = 0) AS inserted
        `;
        
        if (result[0].inserted) {
          newCount++;
        } else {
          updatedCount++;
        }
      } catch (err) {
        console.error(`Error upserting report ${report.displayText}:`, err.message, err.stack);
        console.error(`Report data:`, JSON.stringify(report));
        errorCount++;
      }
    }
    
    console.log(`Database sync complete: ${newCount} new, ${updatedCount} updated, ${errorCount} errors`);
    
    // Record scrape run
    await sql`
      INSERT INTO dmv_scrape_runs (
        status, found, new, errors, notes, started_at, finished_at
      ) VALUES (
        ${errorCount === 0 ? 'success' : 'partial'},
        ${reports.length},
        ${newCount},
        ${errorCount},
        'Cloudflare Worker scrape',
        NOW(),
        NOW()
      )
    `;
    
    return { total: reports.length, new: newCount, updated: updatedCount, errors: errorCount };
  } finally {
    await sql.end();
  }
}

/**
 * Download and parse a single PDF
 * This function calls an external PDF parsing service or the Python backend
 */
async function parsePDF(pdfUrl, reportId, pythonBackendUrl) {
  try {
    // Option 1: Call Python backend to download and parse
    if (pythonBackendUrl) {
      const response = await fetch(`${pythonBackendUrl}/api/v1/internal/parse-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_url: pdfUrl, report_id: reportId })
      });
      
      if (!response.ok) {
        throw new Error(`PDF parse failed: ${response.status}`);
      }
      
      return await response.json();
    }
    
    // Option 2: Use external PDF parsing API (pdf.co, or similar)
    // For now, we'll just store the PDF URL and mark as 'pending_parse'
    // The Python backend can process these later
    return { status: 'pending_parse' };
  } catch (err) {
    console.error(`PDF parsing error for ${pdfUrl}:`, err.message);
    return { status: 'error', error: err.message };
  }
}

/**
 * Main scraper function
 */
export async function runDMVScraper(env) {
  const startTime = Date.now();
  console.log('=== DMV Scraper Started ===');
  
  try {
    // Step 1: Scrape HTML for PDF links
    const reports = await scrapeDMVPage();
    
    if (reports.length === 0) {
      console.warn('No reports found on DMV website');
      return { success: false, error: 'No reports found' };
    }
    
    // Step 2: Store in Neon database
    const dbResult = await upsertReportsToNeon(reports, env.DATABASE_URL);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`=== DMV Scraper Complete in ${elapsed}s ===`);
    console.log(`Total reports: ${dbResult.total}`);
    console.log(`New: ${dbResult.new}, Updated: ${dbResult.updated}, Errors: ${dbResult.errors}`);
    
    // Extract unique companies
    const companies = [...new Set(reports.map(r => r.manufacturer))].sort();
    console.log(`Unique companies (${companies.length}):`, companies.join(', '));
    
    return {
      success: true,
      stats: dbResult,
      companies,
      elapsed: `${elapsed}s`
    };
  } catch (err) {
    console.error('DMV Scraper failed:', err);
    return {
      success: false,
      error: err.message,
      stack: err.stack
    };
  }
}

/**
 * HTTP endpoint to trigger scraper manually
 */
export async function handleScrapeRequest(request, env) {
  // Optional: Add authentication (disabled for testing)
  // Uncomment below to enable auth:
  // const authHeader = request.headers.get('Authorization');
  // const expectedAuth = env.SCRAPER_SECRET || 'Bearer secret-token';
  // if (authHeader !== expectedAuth) {
  //   return new Response(JSON.stringify({ error: 'Unauthorized' }), {
  //     status: 401,
  //     headers: { 'Content-Type': 'application/json' }
  //   });
  // }
  
  const result = await runDMVScraper(env);
  
  return new Response(JSON.stringify(result, null, 2), {
    status: result.success ? 200 : 500,
    headers: { 'Content-Type': 'application/json' }
  });
}

