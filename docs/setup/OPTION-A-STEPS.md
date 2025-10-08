# Option A: Get Real Data Flowing - Step by Step

## ✅ Status: Ready to Execute
- 52 real accidents exported from local SQLite
- Schema file created: `neon-schema-corrected.sql`
- Data file created: `neon-data-import.sql` (6,080 lines)

---

## Step 1: Set Up Neon Database (5 minutes)

### 1.1 Go to Neon Console
1. Open: https://console.neon.tech/
2. Log in with your account
3. Select your project (should be `avat_prod`)

### 1.2 Run Schema SQL
1. Click on **SQL Editor** in the left sidebar
2. Copy the contents of `neon-schema-corrected.sql`
3. Paste into the SQL Editor
4. Click **Run** button
5. ✅ You should see: "CREATE TABLE", "CREATE INDEX" messages

### 1.3 Import Data
1. Still in SQL Editor
2. Copy the contents of `neon-data-import.sql`
3. Paste into the SQL Editor  
4. Click **Run** button
5. ✅ You should see 52 "INSERT" statements execute successfully

### 1.4 Verify Data
Run this query in SQL Editor:
```sql
SELECT COUNT(*) as total, company, COUNT(*) as count 
FROM accidents 
GROUP BY company 
ORDER BY count DESC;
```

Expected result:
- ~52 total accidents
- Companies: Waymo, Zoox, Nuro, Ohmio, Cruise

---

## Step 2: Configure Cloudflare Workers (5 minutes)

### 2.1 Set Database Secret
```bash
cd /Users/vikyath/Projects/AVAT/backend-cloudflare

# Set DATABASE_URL
wrangler secret put DATABASE_URL
# When prompted, paste:
postgresql://avat_app:npg_MN95PdsCTzgy@ep-aged-leaf-adig818q.c-2.us-east-1.aws.neon.tech/avat_prod?sslmode=require
```

### 2.2 Set Redis Secrets (Optional, for caching)
```bash
wrangler secret put UPSTASH_REDIS_REST_URL
# Paste: https://distinct-rooster-15123.upstash.io

wrangler secret put UPSTASH_REDIS_REST_TOKEN
# Paste: ATsTAAIncDI2NDVkODQxZjE4YTg0YWVjYjQ4ZjQyMmZiZDU4NjU5NHAyMTUxMjM
```

---

## Step 3: Update Cloudflare Workers Code (I'll do this)

I'll update `backend-cloudflare/src/index.js` to:
1. Connect to Neon PostgreSQL
2. Query real accidents data
3. Return actual counts and stats
4. Remove hardcoded fallback data

---

## Step 4: Deploy & Test (2 minutes)

### 4.1 Deploy
```bash
cd /Users/vikyath/Projects/AVAT/backend-cloudflare
wrangler deploy
```

### 4.2 Test API
```bash
# Test stats endpoint
curl https://avat-backend.v-naradasi.workers.dev/api/v1/stats

# Expected: {"data":{"total_accidents":52,...}}

# Test accidents endpoint  
curl https://avat-backend.v-naradasi.workers.dev/api/v1/accidents?limit=5

# Expected: Array of 5 real accidents
```

### 4.3 Verify Frontend
1. Go to: https://vikyath-n.github.io/AVAT/dashboard
2. Should now show: **52 Total Accidents** (not 27!)
3. Real companies: Waymo, Zoox, Nuro, Ohmio, Cruise

---

## Timeline

| Step | Task | Time |
|------|------|------|
| 1 | Run schema + import in Neon Console | 5 min |
| 2 | Set Cloudflare secrets | 5 min |
| 3 | Update Workers code (I do this) | 10 min |
| 4 | Deploy & test | 2 min |
| **TOTAL** | **Get real data flowing** | **~20 min** |

---

## What You Need to Do NOW

1. ✅ **Go to Neon Console**: https://console.neon.tech/
2. ✅ **Run `neon-schema-corrected.sql`** in SQL Editor
3. ✅ **Run `neon-data-import.sql`** in SQL Editor  
4. ✅ **Verify**: `SELECT COUNT(*) FROM accidents;` should return 52

Then tell me **"Done!"** and I'll immediately:
- Update the Workers code to connect to Neon
- Remove hardcoded data
- Deploy the changes
- Test that real data flows to frontend

---

## Files Ready

1. ✅ `neon-schema-corrected.sql` - Database schema
2. ✅ `neon-data-import.sql` - 52 real accidents
3. ⏳ `backend-cloudflare/src/index.js` - Will update after you set up DB

---

## Need Help?

If you get stuck on any step, just tell me which step and I'll guide you through it!

**Ready? Go to Neon Console and run those two SQL files!** 🚀

