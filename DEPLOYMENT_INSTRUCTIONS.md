# 🚀 Final Deployment Instructions

## ✅ What's Already Done

1. **Code Deployed** ✅
   - GitHub Actions workflow created and pushed
   - PostgreSQL compatibility fixes applied
   - All scripts tested and working
   - Commit: `02f1e2d` pushed to main branch

2. **Local Processing** 🔄
   - **Status**: 49 PDFs parsed, 101 accidents extracted
   - **Remaining**: 683 PDFs pending
   - **Process**: Running in background (PID 73945)
   - **Estimated**: ~7-8 hours remaining

---

## 🎯 Next Steps (5-10 minutes)

### Step 1: Add GitHub Secret (Required)

The GitHub Actions workflow needs your Neon database URL to work.

**Option A: Via GitHub Web Interface** (Recommended - 2 minutes)

1. Go to: https://github.com/Vikyath-N/AVAT/settings/secrets/actions

2. Click **"New repository secret"**

3. Add the following:
   - **Name**: `NEON_DATABASE_URL`
   - **Value**: `postgresql://avat_app:npg_MN95PdsCTzgy@ep-aged-leaf-a4ig818q-pooler.us-east-1.aws.neon.tech/avat_prod?sslmode=require`

4. Click **"Add secret"**

**Option B: Via GitHub CLI** (If you have `gh` installed)

```bash
cd /Users/vikyath/Projects/AVAT

# Add the secret
gh secret set NEON_DATABASE_URL --body "postgresql://avat_app:npg_MN95PdsCTzgy@ep-aged-leaf-a4ig818q-pooler.us-east-1.aws.neon.tech/avat_prod?sslmode=require"

# Verify it was added
gh secret list
```

---

### Step 2: Trigger the Workflow (2 minutes)

After adding the secret, you can trigger the workflow in several ways:

**Option A: Manual Trigger via GitHub Web** (Easiest)

1. Go to: https://github.com/Vikyath-N/AVAT/actions/workflows/parse-new-pdfs.yml

2. Click **"Run workflow"** dropdown button

3. Select branch: `main`

4. Click **"Run workflow"** green button

5. Refresh the page to see it running

**Option B: Via GitHub CLI**

```bash
gh workflow run parse-new-pdfs.yml --ref main
```

**Option C: Wait for Automatic Trigger**

The workflow is scheduled to run automatically:
- **Daily at 5:30 AM UTC** (10:30 PM PST / 1:30 AM EST)
- No action needed, just wait

---

### Step 3: Monitor the Workflow (Optional)

**Via GitHub Web:**
1. Go to: https://github.com/Vikyath-N/AVAT/actions
2. Watch the workflow run in real-time
3. Click on the run to see detailed logs

**Via Command Line:**
```bash
# Watch workflow runs
gh run list --workflow=parse-new-pdfs.yml

# View latest run details
gh run view --log
```

---

## 📊 What the Workflow Does

When triggered, it will:

1. **Check for new PDFs** in Neon database (`status = 'new'`)
2. **Download PDFs** from DMV website
3. **Parse PDFs** using enhanced_data_pipeline.py
4. **Extract accidents** (date, location, weather, description, etc.)
5. **Store in Neon** PostgreSQL database
6. **Update status** to 'parsed' or 'error'

**Processing Rate:**
- ~10-15 PDFs per run (configurable)
- ~30-60 seconds per PDF
- Total time: 5-15 minutes per run

**Expected Results (First Run):**
- Should process ~10-15 of the 731 pending PDFs
- Will add ~10-50 new accidents to Neon database
- Any errors will be logged in the workflow output

---

## 🔍 Verification

After the workflow runs, verify it worked:

**Check Neon Database:**
```bash
# Use the local test script
cd /Users/vikyath/Projects/AVAT
python scripts/test_github_actions_locally.py

# You should see:
# - Fewer PDFs with status='new'
# - More PDFs with status='parsed'
# - More accidents in the database
```

**Check via SQL (if you have psql):**
```bash
# Connect to Neon
psql "postgresql://avat_app:npg_MN95PdsCTzgy@ep-aged-leaf-a4ig818q-pooler.us-east-1.aws.neon.tech/avat_prod?sslmode=require"

# Check status
SELECT status, COUNT(*) FROM dmv_reports GROUP BY status;

# Check recent accidents
SELECT COUNT(*) FROM accidents WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

## 📈 Current Statistics

**Local Database:**
- Total Reports: 733
- Parsed: 49
- Pending: 683
- Accidents: 101
- Status: Processing in background

**Neon Database (Production):**
- Total Reports: 733
- Parsed: 56 (before workflow)
- Pending: ~677
- Accidents: 56 (will grow after workflow runs)

---

## 🐛 Troubleshooting

### Workflow Fails with "Secret not found"
- Make sure you added `NEON_DATABASE_URL` as a repository secret
- Check the secret name is exactly: `NEON_DATABASE_URL` (case-sensitive)
- Verify at: https://github.com/Vikyath-N/AVAT/settings/secrets/actions

### Workflow Fails with Database Connection Error
- Check the database URL is correct
- Verify Neon database is running
- Check if your Neon project has any IP restrictions

### Workflow Runs but Processes 0 PDFs
- Check if there are any PDFs with `status='new'` in dmv_reports table
- Run: `SELECT COUNT(*) FROM dmv_reports WHERE status='new'`
- If 0, you need to scrape new PDFs or reset some to 'new'

### PDFs Download but Don't Parse
- Check the workflow logs for parsing errors
- Common issues:
  - PDF format changed
  - Missing data in PDF
  - Network timeout during download
- Errors are logged in the `dmv_reports.error_msg` column

---

## 🎉 Success Criteria

The deployment is successful when:

✅ GitHub secret is added  
✅ Workflow runs without errors  
✅ At least 5-10 PDFs are processed  
✅ New accidents appear in Neon database  
✅ Frontend shows new data (may need cache refresh)  

---

## 📞 Next Actions

### Immediate (Do Now):
1. ✅ Add GitHub secret (2 min)
2. ✅ Trigger workflow manually (1 min)
3. ✅ Watch it run and verify (5 min)

### Later (After Local Bulk Processing Completes):
4. Export all 733 processed PDFs to Neon
5. Verify frontend shows all data
6. Set up monitoring/alerts

### Optional Enhancements:
- Increase processing limit from 15 to 50 PDFs per run
- Add Slack/email notifications for failures
- Add metrics/monitoring dashboard
- Optimize parsing for speed

---

## 📁 Reference Files

- **Workflow**: `.github/workflows/parse-new-pdfs.yml`
- **Main Script**: `scripts/test_github_actions_locally.py`
- **Parser**: `enhanced_data_pipeline.py`
- **Database Utils**: `backend/utils/database.py`
- **Scraper Service**: `backend/services/dmv_scraper_service.py`

---

## ⏱️ Timeline

- **Now**: Add secret and trigger workflow (5 min)
- **+5-15 min**: First workflow run completes
- **+8 hours**: Local bulk processing completes
- **+8.5 hours**: Export to Neon, full deployment complete

---

**Ready to deploy? Follow Steps 1 & 2 above!** 🚀

