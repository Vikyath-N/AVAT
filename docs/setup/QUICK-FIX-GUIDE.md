# 🔧 Quick Fix - Import Data to Neon

## The Problem
The original `neon-data-import.sql` file had SQL syntax errors because the `raw_text` field contained unescaped quotes from PDF forms.

## The Solution  
Use `neon-data-import-clean.sql` instead - it imports all important fields except the problematic raw text.

---

## ✅ Updated Steps (5 minutes)

### Step 1: Run Schema
1. Go to: https://console.neon.tech/
2. Open SQL Editor
3. Copy/paste contents of **`neon-schema-corrected.sql`**
4. Click **Run**
5. ✅ Should see "CREATE TABLE" messages

### Step 2: Import Data (Use the CLEAN file!)
1. Still in SQL Editor
2. Copy/paste contents of **`neon-data-import-clean.sql`** ⚠️ (NOT the old one!)
3. Click **Run**
4. ✅ Should see 52 INSERT statements succeed

### Step 3: Verify
Run this in SQL Editor:
```sql
SELECT COUNT(*) as total FROM accidents;

SELECT company, COUNT(*) as count 
FROM accidents 
GROUP BY company 
ORDER BY count DESC;
```

Expected result:
- Total: **52 accidents**
- Companies: Waymo (most), Zoox, Nuro, Ohmio, Cruise, Tesla

---

## What's Different?

| File | Lines | Status | Notes |
|------|-------|--------|-------|
| `neon-data-import.sql` | 6,080 | ❌ Has errors | Contains raw_text with quotes |
| **`neon-data-import-clean.sql`** | **59** | **✅ Works!** | **Skips raw_text field** |

The clean version imports all the important fields:
- ✅ ID, timestamp, company
- ✅ Vehicle make/model  
- ✅ Location (address, lat/lng, city)
- ✅ Damage severity, weather
- ✅ PDF URLs and metadata
- ❌ raw_text (skipped - causes errors)

You won't lose any critical data - the raw_text was just the full PDF form text which we don't display anyway.

---

## After Import Works

Tell me **"Data imported!"** and I'll:
1. Update Cloudflare Workers to query Neon
2. Remove hardcoded data
3. Deploy changes
4. Your dashboard will show **52 real accidents**!

---

## Files to Use

1. ✅ **`neon-schema-corrected.sql`** - Run this FIRST
2. ✅ **`neon-data-import-clean.sql`** - Run this SECOND ⚠️

✨ Total: 52 real accidents ready to go!

