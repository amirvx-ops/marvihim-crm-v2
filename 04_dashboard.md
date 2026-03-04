# Appsmith Page: דשבורד ניהול (Amir - UPDATED with real metrics)

## Dashboard Metrics (based on actual data from all 3 sheets)

### From Adi: Lead flow + closing amounts per insurance company
### From Lidor: Meeting scheduling + agent performance + source ROI
### From Asaf: Porting success + pension amounts

## Queries

### `dashboard_kpis`
```sql
SELECT 
    (SELECT COUNT(*) FROM leads) AS total_leads,
    (SELECT COUNT(*) FROM leads WHERE main_status = 'New') AS new_leads,
    (SELECT COUNT(*) FROM leads WHERE closing_amount > 0) AS total_closings,
    (SELECT COALESCE(SUM(closing_amount), 0) FROM leads WHERE closing_amount > 0) AS total_closing_amount,
    (SELECT COALESCE(SUM(agent_appointment_amount), 0) FROM leads) AS total_appointment_amount,
    (SELECT COUNT(*) FROM leads WHERE lead_passed = TRUE) AS total_leads_passed,
    (SELECT COUNT(*) FROM leads WHERE deal_closed = 'כן') AS total_deals_closed,
    (SELECT COUNT(*) FROM leads WHERE main_status = 'נויד') AS total_ported,
    (SELECT COALESCE(SUM(total_amount), 0) FROM leads WHERE main_status = 'נויד') AS total_ported_amount;
```

### `chart_by_source` (Bar - like Lidor's source table)
```sql
SELECT p.name AS source,
    COUNT(*) AS total,
    COUNT(CASE WHEN l.lead_passed = TRUE THEN 1 END) AS passed,
    COUNT(CASE WHEN l.deal_closed = 'כן' THEN 1 END) AS closed,
    COALESCE(SUM(l.closing_amount), 0) AS revenue
FROM leads l LEFT JOIN partners p ON l.partner_id = p.id
GROUP BY p.name ORDER BY total DESC;
```

### `chart_by_agent` (Bar - like Lidor's agent table)
```sql
SELECT COALESCE(assigned_agent, 'לא מוקצה') AS agent,
    COUNT(CASE WHEN lead_passed = TRUE THEN 1 END) AS passed,
    COUNT(CASE WHEN deal_closed = 'כן' THEN 1 END) AS closed,
    CASE WHEN COUNT(CASE WHEN lead_passed = TRUE THEN 1 END) > 0
        THEN ROUND(COUNT(CASE WHEN deal_closed = 'כן' THEN 1 END)::numeric / COUNT(CASE WHEN lead_passed = TRUE THEN 1 END)::numeric * 100)
        ELSE 0 END AS close_rate
FROM leads GROUP BY assigned_agent ORDER BY passed DESC;
```

### `chart_monthly_trend` (Line)
```sql
SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'MM/YYYY') AS month,
    COUNT(*) AS new_leads,
    COUNT(CASE WHEN closing_amount > 0 THEN 1 END) AS closings,
    COUNT(CASE WHEN main_status = 'נויד' THEN 1 END) AS ported
FROM leads WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at);
```

### `chart_asaf_statuses` (Pie - Asaf's status distribution)
```sql
SELECT main_status AS status, COUNT(*) AS count
FROM leads WHERE main_status IN ('נויד','מעקב','ביקש מועד אחר','לא רלוונטי','לא מעוניין','אין מענה','סוכן','ניתנה הצעה','לא ניתן לשפר','בתהליך הכנת מסמכים')
GROUP BY main_status ORDER BY count DESC;
```

### `chart_insurance_company` (Bar - Adi's הראל vs הפניקס breakdown)
```sql
SELECT 
    'הראל' AS company,
    COUNT(CASE WHEN harel_agent IS NOT NULL AND harel_agent != '' THEN 1 END) AS leads,
    COUNT(CASE WHEN harel_agent IS NOT NULL AND closing_amount > 0 THEN 1 END) AS closings,
    COALESCE(SUM(CASE WHEN harel_agent IS NOT NULL AND closing_amount > 0 THEN closing_amount END), 0) AS amount
FROM leads
UNION ALL
SELECT 'הפניקס',
    COUNT(CASE WHEN phoenix_agent IS NOT NULL AND phoenix_agent != '' THEN 1 END),
    COUNT(CASE WHEN phoenix_agent IS NOT NULL AND closing_amount > 0 THEN 1 END),
    COALESCE(SUM(CASE WHEN phoenix_agent IS NOT NULL AND closing_amount > 0 THEN closing_amount END), 0)
FROM leads;
```

### `attention_needed`
```sql
SELECT c.full_name AS שם, c.phone AS טלפון, p.name AS מקור,
    l.main_status AS סטטוס, l.assigned_agent AS מטפל,
    TO_CHAR(l.updated_at, 'DD/MM/YYYY') AS עדכון_אחרון,
    EXTRACT(DAY FROM NOW() - l.updated_at)::integer AS ימים_ללא_עדכון
FROM leads l LEFT JOIN customers c ON l.customer_id = c.id LEFT JOIN partners p ON l.partner_id = p.id
WHERE l.main_status NOT IN ('נויד','לא רלוונטי','לא מעוניין','לא ניתן לשפר','סוכן')
    AND l.main_status NOT LIKE 'סגור%'
    AND l.updated_at < NOW() - INTERVAL '7 days'
ORDER BY l.updated_at ASC LIMIT 20;
```

## Layout
KPI row (6 cards) → 2 charts per row (source bar + agent bar) → monthly trend line → insurance company bar + Asaf status pie → attention table

## Page: "dashboard", label "דשבורד", icon bar-chart, DEFAULT page for Amir
