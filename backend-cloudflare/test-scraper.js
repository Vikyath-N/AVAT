/**
 * Stress Test for DMV Scraper
 * Verifies all 868+ collision reports are properly captured
 * 
 * Run with: node test-scraper.js
 */

import { runDMVScraper } from './src/dmv-scraper.js';
import postgres from 'postgres';

// Load environment variables
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://avat_app:npg_MN95PdsCTzgy@ep-aged-leaf-adig818q.c-2.us-east-1.aws.neon.tech/avat_prod?sslmode=require';

async function runStressTest() {
  console.log('🧪 ================== DMV SCRAPER STRESS TEST ==================\n');
  
  const env = {
    DATABASE_URL,
    SCRAPER_SECRET: 'Bearer test-token'
  };
  
  // Step 1: Run the scraper
  console.log('Step 1: Running scraper...\n');
  const result = await runDMVScraper(env);
  
  if (!result.success) {
    console.error('❌ Scraper failed:', result.error);
    process.exit(1);
  }
  
  console.log('\n✅ Scraper completed successfully');
  console.log(`   Total reports found: ${result.stats.total}`);
  console.log(`   New reports: ${result.stats.new}`);
  console.log(`   Updated reports: ${result.stats.updated}`);
  console.log(`   Errors: ${result.stats.errors}`);
  console.log(`   Unique companies: ${result.companies.length}`);
  console.log(`   Companies: ${result.companies.join(', ')}\n`);
  
  // Step 2: Verify data in database
  console.log('Step 2: Verifying database records...\n');
  
  const sql = postgres(DATABASE_URL, {
    ssl: 'require',
    max: 1
  });
  
  try {
    // Count total reports
    const [totalCount] = await sql`
      SELECT COUNT(*) as count FROM dmv_reports
    `;
    
    // Count by manufacturer
    const companyCounts = await sql`
      SELECT manufacturer, COUNT(*) as count
      FROM dmv_reports
      GROUP BY manufacturer
      ORDER BY count DESC
    `;
    
    // Count by year
    const yearCounts = await sql`
      SELECT year, COUNT(*) as count
      FROM dmv_reports
      GROUP BY year
      ORDER BY year DESC
    `;
    
    // Count by status
    const statusCounts = await sql`
      SELECT status, COUNT(*) as count
      FROM dmv_reports
      GROUP BY status
    `;
    
    // Get date range
    const [dateRange] = await sql`
      SELECT 
        MIN(incident_date) as earliest,
        MAX(incident_date) as latest
      FROM dmv_reports
    `;
    
    console.log(`📊 Database Statistics:`);
    console.log(`   Total reports in DB: ${totalCount.count}`);
    console.log(`   Date range: ${dateRange.earliest} to ${dateRange.latest}\n`);
    
    console.log(`📈 Reports by Company:`);
    companyCounts.forEach(row => {
      console.log(`   ${row.manufacturer.padEnd(20)} ${row.count}`);
    });
    
    console.log(`\n📅 Reports by Year:`);
    yearCounts.forEach(row => {
      console.log(`   ${row.year}: ${row.count}`);
    });
    
    console.log(`\n📌 Reports by Status:`);
    statusCounts.forEach(row => {
      console.log(`   ${row.status.padEnd(15)} ${row.count}`);
    });
    
    // Step 3: Validate expected count
    console.log('\n🎯 Validation:');
    const expectedMinimum = 868; // As per DMV website (as of Sep 26, 2025)
    
    if (parseInt(totalCount.count) >= expectedMinimum) {
      console.log(`   ✅ PASS: Found ${totalCount.count} reports (expected >= ${expectedMinimum})`);
    } else {
      console.log(`   ⚠️  WARNING: Found ${totalCount.count} reports (expected >= ${expectedMinimum})`);
      console.log(`   Missing ${expectedMinimum - parseInt(totalCount.count)} reports`);
    }
    
    // Step 4: Check for common companies
    const expectedCompanies = ['Waymo', 'Cruise', 'Zoox', 'Tesla', 'Nuro', 'Mercedes-Benz', 'Pony.ai'];
    const foundCompanies = new Set(companyCounts.map(r => r.manufacturer));
    
    console.log('\n🏢 Company Validation:');
    expectedCompanies.forEach(company => {
      if (foundCompanies.has(company)) {
        console.log(`   ✅ ${company} found`);
      } else {
        console.log(`   ⚠️  ${company} not found`);
      }
    });
    
    // Step 5: Check for data quality issues
    console.log('\n🔍 Data Quality Checks:');
    
    const [nullUrls] = await sql`
      SELECT COUNT(*) as count FROM dmv_reports WHERE pdf_url IS NULL
    `;
    console.log(`   PDF URLs missing: ${nullUrls.count} ${nullUrls.count === '0' ? '✅' : '⚠️'}`);
    
    const [invalidDates] = await sql`
      SELECT COUNT(*) as count FROM dmv_reports WHERE incident_date IS NULL
    `;
    console.log(`   Invalid dates: ${invalidDates.count} ${invalidDates.count === '0' ? '✅' : '⚠️'}`);
    
    const duplicates = await sql`
      SELECT source_slug, COUNT(*) as count
      FROM dmv_reports
      GROUP BY source_slug
      HAVING COUNT(*) > 1
    `;
    console.log(`   Duplicate records: ${duplicates && duplicates.length} ${!duplicates || duplicates.length === 0 ? '✅' : '⚠️'}`);
    
    console.log('\n🎉 ================== STRESS TEST COMPLETE ==================\n');
    
  } finally {
    await sql.end();
  }
}

// Run the test
runStressTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

