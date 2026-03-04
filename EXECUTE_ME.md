# 🚀 Claude Code Execution Prompt
# Copy this ENTIRE file as your prompt to Claude Code

## CONTEXT
Building CRM for Israeli insurance agency "Marvihim". Appsmith frontend + Supabase PostgreSQL.
All UI in Hebrew RTL. Must feel like Google Sheets (spreadsheet UX, free text, inline editing).

## PROJECT FILES - READ ALL BEFORE STARTING
```
claude-code-project/
├── CLAUDE.md              ← Master context (READ FIRST)
├── migrations/
│   ├── 01_activity_log.sql    ← Activity logging table
│   ├── 03_triggers.sql        ← Auto-update triggers
│   ├── 04_sheets_columns.sql  ← NEW columns matching real Google Sheets
│   └── 05_updated_views.sql   ← Views matching real workflows
├── appsmith-pages/
│   ├── 01_adi_leads.md         ← Adi's lead tracking (matches her sheet exactly)
│   ├── 02_lidor_meetings.md    ← Lidor's meeting coordination (matches her sheet)
│   ├── 03_asaf_sales.md        ← Asaf's client documentation (matches his sheet)
│   └── 04_dashboard.md         ← Amir's management dashboard
├── docs/
│   ├── hebrew-fields-reference.md ← Field mappings & dropdown options
│   └── surense-sync.md           ← Surense/Zapier integration guide
└── scripts/
    └── EXECUTE_ME.md          ← This file
```

## EXECUTION ORDER

### Phase 1: Database Migrations (run via Supabase MCP apply_migration)
```
1. migrations/04_sheets_columns.sql  ← ADD new columns (phoenix_agent, harel_agent, etc.)
2. migrations/05_updated_views.sql   ← CREATE/REPLACE views for each worker
3. migrations/01_activity_log.sql    ← CREATE activity_log table
4. migrations/03_triggers.sql        ← CREATE triggers for auto-logging
```
After each migration, verify with `list_tables` and `execute_sql: SELECT * FROM <view> LIMIT 5`.

### Phase 2: Build Appsmith Pages
Read each spec file carefully. Build in this order:

**Page 1: עדי - מעקב לידים** (01_adi_leads.md)
- Table matching her sheet: תאריך, שם, ת.ז., מקור, ליד לפניקס, ליד פנימי, ליד הראל, מינוי סוכן, סכום סגירה
- FREE TEXT columns (no dropdowns) for ליד לפניקס, ליד הראל, סכום סגירה
- Month selector filter (she uses monthly tabs)
- Summary stats at bottom (totals per insurance company)

**Page 2: לידור - תיאום פגישות** (02_lidor_meetings.md)
- Table: תאריך, שם, ת.ז., כולל הר ביטוח?, מקור, מטפל, תאריך פגישה, שעה, הליד עבר?, נסגרה עסקה
- Side panel with agent performance stats (גאמביז, נופר, רמי)
- Side panel with source performance stats

**Page 3: אסף - תיעוד לקוחות** (03_asaf_sales.md)
- Table: תאריך, שם, ת.ז., נייד, מקור, סכום כולל, סטטוס, הערות, פרמיה פנסיה, צבירה פנסיה, צבירה גמל
- Status dropdown with REAL values: נויד, מעקב, ביקש מועד אחר, לא רלוונטי, לא מעוניין, אין מענה, סוכן, ניתנה הצעה, לא ניתן לשפר, בתהליך הכנת מסמכים
- Wide notes column (Asaf writes detailed pension analysis)

**Page 4: דשבורד** (04_dashboard.md)
- KPIs, charts by source/agent/month, insurance company breakdown, attention-needed table

### Phase 3: Integration
1. Read docs/surense-sync.md
2. Explore Zapier MCP: run surense_3_27_0_search_leads to map field names
3. Document actual Surense fields

## KEY RULES
- Supabase project ID: `fcrutegzkseyoobyrdxp`
- 1,009 leads, 1,586 customers, 14 partners
- ALL dates DD/MM/YYYY, ALL text RTL Hebrew
- Tables must support inline editing + server-side pagination + CSV export
- FREE TEXT where original sheets had free text (critical for adoption!)
- Row coloring per spec (green=closed, red=rejected, orange=pending, etc.)
- Parameterized queries only (no SQL injection)

## START NOW
Read CLAUDE.md → run Phase 1 migrations → build pages one by one.
