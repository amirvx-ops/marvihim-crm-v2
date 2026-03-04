# Appsmith Page: לידור - תיאום פגישות (UPDATED from real Google Sheet)

## Lidor's Actual Google Sheet Structure
Monthly tabs. Columns:
A=תאריך, B=שם, C=ת.ז., D=כולל הר ביטוח?, E=מקור, F=מטפל, G=תאריך פגישה, H=שעה, I=הליד עבר?, J=נסגרה עסקה

Key findings:
- "מטפל" = agent name: גאמביז, נופר, רמי (NOT עדי/לידור/אסף!)
- "כולל הר ביטוח?" = כן/לא/לא עולה/תעדכן בתז/חתם לא עולה/לבדוק שחתם/לקוח שלנו/לעלות שוב
- "הליד עבר?" = כן/לא
- "נסגרה עסקה" = כן/לא/במעקב/free text ("הכחיש וטען שיש סוכנת", "כל הכספים מעוקלים", "אין מענה", "לא מעוניין")
- Side tables: performance summaries per agent (גאמביז 93 leads/19 closings=20%, נופר 17/0=0%, רמי 27/3=11%)
- Side tables: per source company (מרוויחים, אולג'ובס, פתרון, הייטקס, קו זכות, החזר טק, פיבו)

## Queries

### `fetch_lidor_leads`
```sql
SELECT * FROM lidor_meetings_view
WHERE ({{!Input_Search.text || Input_Search.text === ''}} 
     OR שם ILIKE {{'%' + Input_Search.text + '%'}} 
     OR תז ILIKE {{'%' + Input_Search.text + '%'}})
    AND ({{!Select_Source.selectedOptionValue || Select_Source.selectedOptionValue === ''}} 
     OR מקור = {{Select_Source.selectedOptionValue}})
    AND ({{!Select_Agent.selectedOptionValue || Select_Agent.selectedOptionValue === ''}} 
     OR מטפל = {{Select_Agent.selectedOptionValue}})
    AND ({{!Select_Month.selectedOptionValue || Select_Month.selectedOptionValue === ''}}
     OR TO_CHAR(תאריך, 'MM/YYYY') = {{Select_Month.selectedOptionValue}})
ORDER BY תאריך_פגישה DESC NULLS LAST
LIMIT {{Table_Lidor.pageSize}} OFFSET {{(Table_Lidor.pageNo - 1) * Table_Lidor.pageSize}};
```

### `lidor_performance_stats`
```sql
-- Per agent stats (like her side table)
SELECT 
    COALESCE(l.assigned_agent, 'לא מוקצה') AS agent,
    COUNT(CASE WHEN l.lead_passed = TRUE THEN 1 END) AS leads_passed,
    COUNT(CASE WHEN l.deal_closed = 'כן' THEN 1 END) AS deals_closed,
    CASE WHEN COUNT(CASE WHEN l.lead_passed = TRUE THEN 1 END) > 0
        THEN ROUND(COUNT(CASE WHEN l.deal_closed = 'כן' THEN 1 END)::numeric / 
             COUNT(CASE WHEN l.lead_passed = TRUE THEN 1 END)::numeric * 100)
        ELSE 0 END AS close_rate
FROM leads l
WHERE ({{!Select_Month.selectedOptionValue || Select_Month.selectedOptionValue === ''}}
     OR TO_CHAR(l.created_at, 'MM/YYYY') = {{Select_Month.selectedOptionValue}})
GROUP BY l.assigned_agent ORDER BY leads_passed DESC;
```

### `lidor_source_stats`
```sql
-- Per source stats (like her other side table)
SELECT p.name AS source, 
    COUNT(CASE WHEN l.lead_passed = TRUE THEN 1 END) AS leads_passed,
    COUNT(CASE WHEN l.deal_closed = 'כן' THEN 1 END) AS deals_closed
FROM leads l LEFT JOIN partners p ON l.partner_id = p.id
WHERE ({{!Select_Month.selectedOptionValue || Select_Month.selectedOptionValue === ''}}
     OR TO_CHAR(l.created_at, 'MM/YYYY') = {{Select_Month.selectedOptionValue}})
GROUP BY p.name ORDER BY leads_passed DESC;
```

### `update_lidor_lead`
```sql
UPDATE leads SET
    has_har_bituach = {{Table_Lidor.updatedRow.כולל_הר_ביטוח}},
    assigned_agent = {{Table_Lidor.updatedRow.מטפל}},
    meeting_scheduled_date = {{Table_Lidor.updatedRow.תאריך_פגישה}},
    meeting_time = {{Table_Lidor.updatedRow.שעה}},
    lead_passed = {{Table_Lidor.updatedRow.הליד_עבר}},
    deal_closed = {{Table_Lidor.updatedRow.נסגרה_עסקה}},
    notes = {{Table_Lidor.updatedRow.הערות}}
WHERE id = {{Table_Lidor.updatedRow.lead_id}};
```

## Table Columns (SAME ORDER as her sheet)
1. `תאריך` → "תאריך" (readonly, DD/MM/YYYY)
2. `שם` → "שם" (readonly)
3. `תז` → "ת.ז." (readonly)
4. `כולל_הר_ביטוח` → "כולל הר ביטוח?" (Editable - Plain Text)
5. `מקור` → "מקור" (readonly)
6. `מטפל` → "מטפל" (Editable - Select: גאמביז, נופר, רמי, אסף, or free text)
7. `תאריך_פגישה` → "תאריך פגישה" (Editable - DatePicker DD/MM/YYYY)
8. `שעה` → "שעה" (Editable - Text, format "HH:MM")
9. `הליד_עבר` → "הליד עבר?" (Editable - Select: כן/לא)
10. `נסגרה_עסקה` → "נסגרה עסקה" (Editable - Plain Text, because values are mixed: כן/לא/free text)
11. `הערות` → "הערות" (Editable - Text multiline, hidden by default, show on expand)

## Row Coloring
```javascript
{{
  currentRow.נסגרה_עסקה === 'כן' ? '#C8E6C9' :
  currentRow.נסגרה_עסקה === 'לא' ? '#FFCDD2' :
  currentRow.הליד_עבר === true ? '#E3F2FD' :
  '#FFFFFF'
}}
```

## Side Panels (like her summary tables)
- Agent performance table (small): agent, leads_passed, deals_closed, close_rate%
- Source performance table (small): source, leads_passed, deals_closed

## Filters: Month, Source (מקור), Agent (מטפל), Free search
## Stats: total leads passed, total deals, overall close rate, total commission (₪2,740 leads + ₪1,100 closings)
## Page: "lidor_meetings", label "תיאום פגישות", icon calendar
