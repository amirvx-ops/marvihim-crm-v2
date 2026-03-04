# Appsmith Page: אסף - תיעוד לקוחות (UPDATED from real Google Sheet)

## Asaf's Actual Google Sheet Structure
Main tab "תיעוד פגישות", plus "מעקב סגירות + יעדים" and "מעקבים טיפול סגירות". Columns:
A=תאריך, B=שם לקוח, C=תעודת זהות, D=נייד, E=מקור הגעה, F=סכום כולל, G=סטטוס, H=הערות, I=פרמיה פנסיה, J=צבירה פנסיה, K=צבירה גמל השתלמות

Key findings:
- "מקור הגעה" values: "תיאום פגישות לידור", "תיק קיים", "בדיקת מסלקה", "תיק קייים", "הצטרף לביטוח דרך הראל סטנדרט", "תיק קיים / אמיר"
- "סטטוס" values (THE REAL ONES): נויד, מעקב, ביקש מועד אחר, לא רלוונטי, לא מעוניין, אין מענה, סוכן, ניתנה הצעה, לא ניתן לשפר, בתהליך הכנת מסמכים
- "הערות" = very detailed free text about pension details, negotiations, follow-ups
- "סכום כולל" = total accumulation amounts (80000, 150000, 240000...)
- He tracks pension premiums and accumulations separately

## Queries

### `fetch_asaf_leads`
```sql
SELECT * FROM asaf_sales_view
WHERE ({{!Input_Search.text || Input_Search.text === ''}} 
     OR שם_לקוח ILIKE {{'%' + Input_Search.text + '%'}} 
     OR תעודת_זהות ILIKE {{'%' + Input_Search.text + '%'}}
     OR נייד ILIKE {{'%' + Input_Search.text + '%'}})
    AND ({{!Select_Status.selectedOptionValue || Select_Status.selectedOptionValue === ''}} 
     OR סטטוס = {{Select_Status.selectedOptionValue}})
    AND ({{!Select_Source.selectedOptionValue || Select_Source.selectedOptionValue === ''}} 
     OR מקור_הגעה = {{Select_Source.selectedOptionValue}})
ORDER BY תאריך DESC
LIMIT {{Table_Asaf.pageSize}} OFFSET {{(Table_Asaf.pageNo - 1) * Table_Asaf.pageSize}};
```

### `asaf_stats`
```sql
SELECT 
    COUNT(*) AS total,
    COUNT(CASE WHEN main_status = 'נויד' THEN 1 END) AS ported,
    COUNT(CASE WHEN main_status = 'מעקב' THEN 1 END) AS follow_up,
    COUNT(CASE WHEN main_status = 'ניתנה הצעה' THEN 1 END) AS proposal_given,
    COUNT(CASE WHEN main_status IN ('לא מעוניין','לא רלוונטי','אין מענה','לא ניתן לשפר','סוכן') THEN 1 END) AS closed_no_deal,
    COALESCE(SUM(CASE WHEN main_status = 'נויד' THEN total_amount END), 0) AS total_ported_amount,
    COALESCE(SUM(pension_premium), 0) AS total_pension_premium
FROM leads
WHERE assigned_to = 'אסף' OR main_status IN ('נויד','מעקב','ניתנה הצעה','ביקש מועד אחר','בתהליך הכנת מסמכים');
```

### `update_asaf_lead`
```sql
UPDATE leads SET
    main_status = {{Table_Asaf.updatedRow.סטטוס}},
    total_amount = NULLIF({{Table_Asaf.updatedRow.סכום_כולל}}, '')::numeric,
    notes = {{Table_Asaf.updatedRow.הערות}},
    pension_premium = NULLIF({{Table_Asaf.updatedRow.פרמיה_פנסיה}}, '')::numeric,
    pension_accumulation = NULLIF({{Table_Asaf.updatedRow.צבירה_פנסיה}}, '')::numeric,
    gemel_hishtalmut_accumulation = NULLIF({{Table_Asaf.updatedRow.צבירה_גמל_השתלמות}}, '')::numeric
WHERE id = {{Table_Asaf.updatedRow.lead_id}};
```

### `update_asaf_customer`
```sql
UPDATE customers SET
    mobile = {{Table_Asaf.updatedRow.נייד}}
WHERE id = {{Table_Asaf.updatedRow.customer_id}};
```

## Table Columns (SAME ORDER as his sheet)
1. `תאריך` → "תאריך" (readonly, DD/MM/YYYY)
2. `שם_לקוח` → "שם לקוח" (readonly)
3. `תעודת_זהות` → "תעודת זהות" (readonly)
4. `נייד` → "נייד" (Editable - Text, clickable tel: link)
5. `מקור_הגעה` → "מקור הגעה" (readonly)
6. `סכום_כולל` → "סכום כולל" (Editable - Number)
7. `סטטוס` → "סטטוס" (Editable - Select with these EXACT options:)
   - נויד, מעקב, ביקש מועד אחר, לא רלוונטי, לא מעוניין, אין מענה, סוכן, ניתנה הצעה, לא ניתן לשפר, בתהליך הכנת מסמכים
8. `הערות` → "הערות" (Editable - Text multiline, WIDE column - this is where Asaf writes detailed notes)
9. `פרמיה_פנסיה` → "פרמיה פנסיה" (Editable - Number)
10. `צבירה_פנסיה` → "צבירה פנסיה" (Editable - Number)
11. `צבירה_גמל_השתלמות` → "צבירה גמל/השתלמות" (Editable - Number)

## Row Coloring
```javascript
{{
  currentRow.סטטוס === 'נויד' ? '#C8E6C9' :
  currentRow.סטטוס === 'מעקב' || currentRow.סטטוס === 'ביקש מועד אחר' ? '#FFF9C4' :
  currentRow.סטטוס === 'ניתנה הצעה' || currentRow.סטטוס === 'בתהליך הכנת מסמכים' ? '#E3F2FD' :
  currentRow.סטטוס === 'אין מענה' ? '#FFE0B2' :
  currentRow.סטטוס === 'לא מעוניין' || currentRow.סטטוס === 'לא רלוונטי' || currentRow.סטטוס === 'לא ניתן לשפר' ? '#FFCDD2' :
  currentRow.סטטוס === 'סוכן' ? '#F5F5F5' :
  '#FFFFFF'
}}
```

## Stats: total, ported (נויד), follow_up, proposal_given, closed_no_deal, ₪total_ported_amount
## Filters: Status (Select from real values), Source, Free search
## Page: "asaf_sales", label "תיעוד לקוחות - אסף", icon trending-up
