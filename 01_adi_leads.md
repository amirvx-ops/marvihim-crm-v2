# Appsmith Page: עדי - מעקב לידים (UPDATED from real Google Sheet)

## Adi's Actual Google Sheet Structure
Monthly tabs (07/23 through 03/26). Columns:
A=תאריך, B=שם לקוח, C=תעודת זהות, D=מקור ליד, E=ליד לפניקס, F=ליד פנימי, G=ליד הראל, H=מינוי סוכן, I=סכום סגירה

Key: She writes FREE TEXT everywhere. "עבר לאריה", "לא נסגר", "לא עונה", "/", "?". No dropdowns.
Summary at bottom: total leads, closings, amounts per insurance company.

## DESIGN PRINCIPLE: Mirror her sheet exactly. Same columns, same order, free text.

## Queries

### `fetch_adi_leads`
```sql
SELECT * FROM adi_leads_view
WHERE ({{!Input_Search.text || Input_Search.text === ''}} 
     OR שם_לקוח ILIKE {{'%' + Input_Search.text + '%'}} 
     OR תעודת_זהות ILIKE {{'%' + Input_Search.text + '%'}})
    AND ({{!Select_Partner.selectedOptionValue || Select_Partner.selectedOptionValue === ''}} 
     OR מקור_ליד = {{Select_Partner.selectedOptionValue}})
    AND ({{!Select_Month.selectedOptionValue || Select_Month.selectedOptionValue === ''}}
     OR TO_CHAR(תאריך, 'MM/YYYY') = {{Select_Month.selectedOptionValue}})
ORDER BY תאריך DESC
LIMIT {{Table_Adi.pageSize}} OFFSET {{(Table_Adi.pageNo - 1) * Table_Adi.pageSize}};
```

### `count_adi_stats`
```sql
SELECT COUNT(*) AS total_leads,
    COUNT(CASE WHEN סכום_סגירה > 0 THEN 1 END) AS closings,
    COALESCE(SUM(סכום_סגירה), 0) AS total_closing,
    COALESCE(SUM(מינוי_סוכן), 0) AS total_appointment,
    COUNT(CASE WHEN ליד_הראל IS NOT NULL AND ליד_הראל != '' THEN 1 END) AS harel_leads,
    COUNT(CASE WHEN ליד_לפניקס IS NOT NULL AND ליד_לפניקס != '' THEN 1 END) AS phoenix_leads
FROM adi_leads_view
WHERE ({{!Select_Month.selectedOptionValue || Select_Month.selectedOptionValue === ''}}
     OR TO_CHAR(תאריך, 'MM/YYYY') = {{Select_Month.selectedOptionValue}});
```

### `update_adi_lead`
```sql
UPDATE leads SET
    phoenix_agent = {{Table_Adi.updatedRow.ליד_לפניקס}},
    internal_lead = {{Table_Adi.updatedRow.ליד_פנימי}},
    harel_agent = {{Table_Adi.updatedRow.ליד_הראל}},
    agent_appointment_amount = NULLIF({{Table_Adi.updatedRow.מינוי_סוכן}}, '')::numeric,
    closing_amount = CASE WHEN {{Table_Adi.updatedRow.סכום_סגירה}} ~ '^\d+\.?\d*$' THEN {{Table_Adi.updatedRow.סכום_סגירה}}::numeric ELSE NULL END,
    closing_status = {{Table_Adi.updatedRow.סטטוס_סגירה}},
    notes = {{Table_Adi.updatedRow.הערות}}
WHERE id = {{Table_Adi.updatedRow.lead_id}};
```

## Table Columns (SAME ORDER as her sheet)
1. `תאריך` → "תאריך" (readonly, DD/MM/YYYY)
2. `שם_לקוח` → "שם לקוח" (readonly)
3. `תעודת_זהות` → "ת.ז." (readonly)
4. `מקור_ליד` → "מקור ליד" (readonly)
5. `ליד_לפניקס` → "ליד לפניקס" (Editable - Plain Text)
6. `ליד_פנימי` → "ליד פנימי" (Editable - Checkbox)
7. `ליד_הראל` → "ליד הראל" (Editable - Plain Text)
8. `מינוי_סוכן` → "מינוי סוכן" (Editable - Number)
9. `סכום_סגירה` → "סכום סגירה" (Editable - Plain Text! Can be number or "לא נסגר")
10. `סטטוס_סגירה` → "סטטוס" (Editable - Plain Text)
11. `הערות` → "הערות" (Editable - Text multiline)
Hidden: lead_id, customer_id, main_status, updated_at, surense_lead_id, surens_customer_id, טלפון

## Row Coloring
```javascript
{{
  currentRow.סכום_סגירה && !isNaN(currentRow.סכום_סגירה) && Number(currentRow.סכום_סגירה) > 0 ? '#C8E6C9' :
  (currentRow.סטטוס_סגירה || '').includes('לא נסגר') ? '#FFCDD2' :
  (currentRow.סטטוס_סגירה || '').includes('לא עונה') ? '#FFE0B2' :
  currentRow.ליד_לפניקס === '/' && currentRow.ליד_הראל === '/' ? '#F5F5F5' :
  '#FFFFFF'
}}
```

## Stats: total_leads, closings, ₪total_closing, ₪total_appointment, harel_leads, phoenix_leads
## Filters: Month selector (default=current), Partner, Free search
## Page: "adi_leads", label "מעקב לידים", icon list
