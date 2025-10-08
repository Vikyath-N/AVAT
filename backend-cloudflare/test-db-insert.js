import postgres from 'postgres';

const DATABASE_URL = 'postgresql://avat_app:npg_MN95PdsCTzgy@ep-aged-leaf-adig818q.c-2.us-east-1.aws.neon.tech/avat_prod?sslmode=require';

async function testInsert() {
  const sql = postgres(DATABASE_URL, {
    ssl: 'require',
    max: 1
  });

  try {
    console.log('Testing simple insert...');
    
    const testReport = {
      manufacturer: 'Waymo',
      incidentDate: '2025-09-18',
      year: 2025,
      sequenceNum: 1,
      displayText: 'Waymo September 18, 2025 (PDF)',
      pageUrl: 'https://www.dmv.ca.gov/portal/vehicle-industry-services/autonomous-vehicles/autonomous-vehicle-collision-reports/',
      pdfUrl: 'https://www.dmv.ca.gov/portal/file/waymo-september-18-2025-pdf/',
      slug: 'waymo-2025-09-18-1'
    };
    
    console.log('Attempting to insert:', testReport);
    
    const result = await sql`
      INSERT INTO dmv_reports (
        manufacturer, incident_date, year, sequence_num,
        display_text, page_url, pdf_url, source_slug,
        status, created_at, updated_at
      ) VALUES (
        ${testReport.manufacturer},
        ${testReport.incidentDate},
        ${testReport.year},
        ${testReport.sequenceNum},
        ${testReport.displayText},
        ${testReport.pageUrl},
        ${testReport.pdfUrl},
        ${testReport.slug},
        'new',
        NOW(),
        NOW()
      )
      RETURNING id, source_slug
    `;
    
    console.log('✅ Insert successful:', result);
    
    // Try the upsert syntax
    console.log('\nTesting UPSERT syntax...');
    const result2 = await sql`
      INSERT INTO dmv_reports (
        manufacturer, incident_date, year, sequence_num,
        display_text, page_url, pdf_url, source_slug,
        status, created_at, updated_at
      ) VALUES (
        ${testReport.manufacturer},
        ${testReport.incidentDate},
        ${testReport.year},
        ${testReport.sequenceNum},
        ${testReport.displayText},
        ${testReport.pageUrl},
        ${testReport.pdfUrl},
        ${testReport.slug},
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
    
    console.log('✅ Upsert successful (updated):', result2);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Full error:', err);
  } finally {
    await sql.end();
  }
}

testInsert();

