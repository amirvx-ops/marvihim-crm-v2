const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PREFIX = '69a83c7ea57cda66ecff91bb_';

const pages = {
  'מעקב לידים': [
    { name: 'fetch_adi_leads', body: "SELECT * FROM adi_leads_view\nWHERE ({{!Input_Search.text || Input_Search.text === ''}}\n     OR \u05e9\u05dd_\u05dc\u05e7\u05d5\u05d7 ILIKE {{'%' + Input_Search.text + '%'}}\n     OR \u05ea\u05e2\u05d5\u05d3\u05ea_\u05d6\u05d4\u05d5\u05ea ILIKE {{'%' + Input_Search.text + '%'}})\n    AND ({{!Select_Partner.selectedOptionValue || Select_Partner.selectedOptionValue === ''}}\n     OR \u05de\u05e7\u05d5\u05e8_\u05dc\u05d9\u05d3 = {{Select_Partner.selectedOptionValue}})\n    AND ({{!Select_Month.selectedOptionValue || Select_Month.selectedOptionValue === ''}}\n     OR TO_CHAR(\u05ea\u05d0\u05e8\u05d9\u05da, 'MM/YYYY') = {{Select_Month.selectedOptionValue}})\nORDER BY \u05ea\u05d0\u05e8\u05d9\u05da DESC\nLIMIT {{Table_Adi.pageSize}} OFFSET {{(Table_Adi.pageNo - 1) * Table_Adi.pageSize}}" },
    { name: 'count_adi_stats', body: "SELECT\n    COUNT(*) AS total_leads,\n    COUNT(CASE WHEN closing_amount > 0 THEN 1 END) AS closings,\n    COALESCE(SUM(closing_amount), 0) AS total_closing,\n    COALESCE(SUM(agent_appointment_amount), 0) AS total_appointment,\n    COUNT(CASE WHEN harel_agent IS NOT NULL AND harel_agent != '' THEN 1 END) AS harel_leads,\n    COUNT(CASE WHEN phoenix_agent IS NOT NULL AND phoenix_agent != '' THEN 1 END) AS phoenix_leads\nFROM adi_leads_view\nWHERE ({{!Select_Month.selectedOptionValue || Select_Month.selectedOptionValue === ''}}\n     OR TO_CHAR(\u05ea\u05d0\u05e8\u05d9\u05da, 'MM/YYYY') = {{Select_Month.selectedOptionValue}})" },
    { name: 'update_adi_lead', body: "UPDATE leads SET\n    phoenix_agent = {{Table_Adi.updatedRow.\u05dc\u05d9\u05d3_\u05dc\u05e4\u05e0\u05d9\u05e7\u05e1}},\n    harel_agent = {{Table_Adi.updatedRow.\u05dc\u05d9\u05d3_\u05d4\u05e8\u05d0\u05dc}},\n    internal_lead = {{Table_Adi.updatedRow.\u05dc\u05d9\u05d3_\u05e4\u05e0\u05d9\u05de\u05d9}},\n    agent_appointment_amount = {{Table_Adi.updatedRow.\u05de\u05d9\u05e0\u05d5\u05d9_\u05e1\u05d5\u05db\u05df}},\n    closing_amount = {{Table_Adi.updatedRow.\u05e1\u05db\u05d5\u05dd_\u05e1\u05d2\u05d9\u05e8\u05d4}},\n    closing_status = {{Table_Adi.updatedRow.\u05e1\u05d8\u05d8\u05d5\u05e1_\u05e1\u05d2\u05d9\u05e8\u05d4}},\n    notes = {{Table_Adi.updatedRow.\u05d4\u05e2\u05e8\u05d5\u05ea}}\nWHERE id = {{Table_Adi.updatedRow.lead_id}}" }
  ],
  'תיאום פגישות (לידור)': [
    { name: 'fetch_lidor_leads', body: "SELECT * FROM lidor_meetings_view\nWHERE ({{!Input_Search.text || Input_Search.text === ''}}\n     OR \u05e9\u05dd ILIKE {{'%' + Input_Search.text + '%'}}\n     OR \u05ea\u05e2\u05d5\u05d3\u05ea_\u05d6\u05d4\u05d5\u05ea ILIKE {{'%' + Input_Search.text + '%'}})\n    AND ({{!Select_Source.selectedOptionValue || Select_Source.selectedOptionValue === ''}}\n     OR \u05de\u05e7\u05d5\u05e8 = {{Select_Source.selectedOptionValue}})\n    AND ({{!Select_Agent.selectedOptionValue || Select_Agent.selectedOptionValue === ''}}\n     OR \u05de\u05d8\u05e4\u05dc = {{Select_Agent.selectedOptionValue}})\n    AND ({{!Select_Month.selectedOptionValue || Select_Month.selectedOptionValue === ''}}\n     OR TO_CHAR(\u05ea\u05d0\u05e8\u05d9\u05da, 'MM/YYYY') = {{Select_Month.selectedOptionValue}})\nORDER BY \u05ea\u05d0\u05e8\u05d9\u05da DESC\nLIMIT {{Table_Lidor.pageSize}} OFFSET {{(Table_Lidor.pageNo - 1) * Table_Lidor.pageSize}}" },
    { name: 'lidor_performance_stats', body: "SELECT COALESCE(assigned_agent, '\u05dc\u05d0 \u05de\u05d5\u05e7\u05e6\u05d4') AS agent,\n    COUNT(CASE WHEN lead_passed = TRUE THEN 1 END) AS leads_passed,\n    COUNT(CASE WHEN deal_closed = '\u05db\u05df' THEN 1 END) AS deals_closed,\n    CASE WHEN COUNT(CASE WHEN lead_passed = TRUE THEN 1 END) > 0\n        THEN ROUND(COUNT(CASE WHEN deal_closed = '\u05db\u05df' THEN 1 END)::numeric / COUNT(CASE WHEN lead_passed = TRUE THEN 1 END)::numeric * 100)\n        ELSE 0 END AS close_rate\nFROM lidor_meetings_view GROUP BY assigned_agent ORDER BY leads_passed DESC" },
    { name: 'lidor_source_stats', body: "SELECT COALESCE(\u05de\u05e7\u05d5\u05e8, '\u05dc\u05d0 \u05d9\u05d3\u05d5\u05e2') AS source,\n    COUNT(CASE WHEN lead_passed = TRUE THEN 1 END) AS leads_passed,\n    COUNT(CASE WHEN deal_closed = '\u05db\u05df' THEN 1 END) AS deals_closed\nFROM lidor_meetings_view GROUP BY \u05de\u05e7\u05d5\u05e8 ORDER BY leads_passed DESC" },
    { name: 'update_lidor_lead', body: "UPDATE leads SET\n    has_har_bituach = {{Table_Lidor.updatedRow.\u05db\u05d5\u05dc\u05dc_\u05d4\u05e8_\u05d1\u05d9\u05d8\u05d5\u05d7}},\n    assigned_agent = {{Table_Lidor.updatedRow.\u05de\u05d8\u05e4\u05dc}},\n    meeting_scheduled_date = {{Table_Lidor.updatedRow.\u05ea\u05d0\u05e8\u05d9\u05da_\u05e4\u05d2\u05d9\u05e9\u05d4}},\n    meeting_time = {{Table_Lidor.updatedRow.\u05e9\u05e2\u05d4}},\n    lead_passed = {{Table_Lidor.updatedRow.\u05d4\u05dc\u05d9\u05d3_\u05e2\u05d1\u05e8 === '\u05db\u05df'}},\n    deal_closed = {{Table_Lidor.updatedRow.\u05e0\u05e1\u05d2\u05e8\u05d4_\u05e2\u05e1\u05e7\u05d4}},\n    notes = {{Table_Lidor.updatedRow.\u05d4\u05e2\u05e8\u05d5\u05ea}}\nWHERE id = {{Table_Lidor.updatedRow.lead_id}}" }
  ],
  'תיעוד לקוחות (אסף)': [
    { name: 'fetch_asaf_leads', body: "SELECT * FROM asaf_sales_view\nWHERE ({{!Input_Search.text || Input_Search.text === ''}}\n     OR \u05e9\u05dd ILIKE {{'%' + Input_Search.text + '%'}}\n     OR \u05ea\u05e2\u05d5\u05d3\u05ea_\u05d6\u05d4\u05d5\u05ea ILIKE {{'%' + Input_Search.text + '%'}}\n     OR \u05e0\u05d9\u05d9\u05d3 ILIKE {{'%' + Input_Search.text + '%'}})\n    AND ({{!Select_Status.selectedOptionValue || Select_Status.selectedOptionValue === ''}}\n     OR \u05e1\u05d8\u05d8\u05d5\u05e1 = {{Select_Status.selectedOptionValue}})\n    AND ({{!Select_Source.selectedOptionValue || Select_Source.selectedOptionValue === ''}}\n     OR \u05de\u05e7\u05d5\u05e8_\u05d4\u05d2\u05e2\u05d4 = {{Select_Source.selectedOptionValue}})\nORDER BY \u05ea\u05d0\u05e8\u05d9\u05da DESC\nLIMIT {{Table_Asaf.pageSize}} OFFSET {{(Table_Asaf.pageNo - 1) * Table_Asaf.pageSize}}" },
    { name: 'asaf_stats', body: "SELECT\n    COUNT(*) AS total,\n    COUNT(CASE WHEN \u05e1\u05d8\u05d8\u05d5\u05e1 = '\u05e0\u05d5\u05d9\u05d3' THEN 1 END) AS ported,\n    COUNT(CASE WHEN \u05e1\u05d8\u05d8\u05d5\u05e1 = '\u05de\u05e2\u05e7\u05d1' THEN 1 END) AS followup,\n    COUNT(CASE WHEN \u05e1\u05d8\u05d8\u05d5\u05e1 = '\u05e0\u05d9\u05ea\u05e0\u05d4 \u05d4\u05e6\u05e2\u05d4' THEN 1 END) AS proposal,\n    COUNT(CASE WHEN \u05e1\u05d8\u05d8\u05d5\u05e1 IN ('\u05dc\u05d0 \u05de\u05e2\u05d5\u05e0\u05d9\u05d9\u05df','\u05dc\u05d0 \u05e8\u05dc\u05d5\u05d5\u05e0\u05d8\u05d9','\u05d0\u05d9\u05df \u05de\u05e2\u05e0\u05d4','\u05dc\u05d0 \u05e0\u05d9\u05ea\u05df \u05dc\u05e9\u05e4\u05e8') THEN 1 END) AS closed_no_deal,\n    COALESCE(SUM(CASE WHEN \u05e1\u05d8\u05d8\u05d5\u05e1 = '\u05e0\u05d5\u05d9\u05d3' THEN \u05e1\u05db\u05d5\u05dd_\u05db\u05d5\u05dc\u05dc END), 0) AS ported_amount\nFROM asaf_sales_view" },
    { name: 'update_asaf_lead', body: "UPDATE leads SET\n    main_status = {{Table_Asaf.updatedRow.\u05e1\u05d8\u05d8\u05d5\u05e1}},\n    total_amount = {{Table_Asaf.updatedRow.\u05e1\u05db\u05d5\u05dd_\u05db\u05d5\u05dc\u05dc}},\n    pension_premium = {{Table_Asaf.updatedRow.\u05e4\u05e8\u05de\u05d9\u05d4_\u05e4\u05e0\u05e1\u05d9\u05d4}},\n    pension_accumulation = {{Table_Asaf.updatedRow.\u05e6\u05d1\u05d9\u05e8\u05d4_\u05e4\u05e0\u05e1\u05d9\u05d4}},\n    gemel_hishtalmut_accumulation = {{Table_Asaf.updatedRow.\u05e6\u05d1\u05d9\u05e8\u05d4_\u05d2\u05de\u05dc_\u05d4\u05e9\u05ea\u05dc\u05de\u05d5\u05ea}},\n    notes = {{Table_Asaf.updatedRow.\u05d4\u05e2\u05e8\u05d5\u05ea}}\nWHERE id = {{Table_Asaf.updatedRow.lead_id}}" },
    { name: 'update_asaf_customer', body: "UPDATE customers SET mobile = {{Table_Asaf.updatedRow.\u05e0\u05d9\u05d9\u05d3}} WHERE id = {{Table_Asaf.updatedRow.customer_id}}" }
  ],
  'Page1': [
    { name: 'dashboard_kpis', body: "SELECT\n    (SELECT COUNT(*) FROM leads) AS total_leads,\n    (SELECT COUNT(*) FROM leads WHERE main_status = 'New') AS new_leads,\n    (SELECT COUNT(*) FROM leads WHERE closing_amount > 0) AS total_closings,\n    (SELECT COALESCE(SUM(closing_amount), 0) FROM leads WHERE closing_amount > 0) AS total_closing_amount,\n    (SELECT COALESCE(SUM(agent_appointment_amount), 0) FROM leads) AS total_appointment_amount,\n    (SELECT COUNT(*) FROM leads WHERE lead_passed = TRUE) AS total_leads_passed,\n    (SELECT COUNT(*) FROM leads WHERE deal_closed = '\u05db\u05df') AS total_deals_closed,\n    (SELECT COUNT(*) FROM leads WHERE main_status = '\u05e0\u05d5\u05d9\u05d3') AS total_ported,\n    (SELECT COALESCE(SUM(total_amount), 0) FROM leads WHERE main_status = '\u05e0\u05d5\u05d9\u05d3') AS total_ported_amount" },
    { name: 'chart_by_source', body: "SELECT p.name AS source,\n    COUNT(*) AS total,\n    COUNT(CASE WHEN l.lead_passed = TRUE THEN 1 END) AS passed,\n    COUNT(CASE WHEN l.deal_closed = '\u05db\u05df' THEN 1 END) AS closed,\n    COALESCE(SUM(l.closing_amount), 0) AS revenue\nFROM leads l LEFT JOIN partners p ON l.partner_id = p.id\nGROUP BY p.name ORDER BY total DESC" },
    { name: 'chart_by_agent', body: "SELECT COALESCE(assigned_agent, '\u05dc\u05d0 \u05de\u05d5\u05e7\u05e6\u05d4') AS agent,\n    COUNT(CASE WHEN lead_passed = TRUE THEN 1 END) AS passed,\n    COUNT(CASE WHEN deal_closed = '\u05db\u05df' THEN 1 END) AS closed,\n    CASE WHEN COUNT(CASE WHEN lead_passed = TRUE THEN 1 END) > 0\n        THEN ROUND(COUNT(CASE WHEN deal_closed = '\u05db\u05df' THEN 1 END)::numeric / COUNT(CASE WHEN lead_passed = TRUE THEN 1 END)::numeric * 100)\n        ELSE 0 END AS close_rate\nFROM leads GROUP BY assigned_agent ORDER BY passed DESC" },
    { name: 'chart_monthly_trend', body: "SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'MM/YYYY') AS month,\n    COUNT(*) AS new_leads,\n    COUNT(CASE WHEN closing_amount > 0 THEN 1 END) AS closings,\n    COUNT(CASE WHEN main_status = '\u05e0\u05d5\u05d9\u05d3' THEN 1 END) AS ported\nFROM leads WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'\nGROUP BY DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)" },
    { name: 'chart_asaf_statuses', body: "SELECT main_status AS status, COUNT(*) AS count\nFROM leads WHERE main_status IN ('\u05e0\u05d5\u05d9\u05d3','\u05de\u05e2\u05e7\u05d1','\u05d1\u05d9\u05e7\u05e9 \u05de\u05d5\u05e2\u05d3 \u05d0\u05d7\u05e8','\u05dc\u05d0 \u05e8\u05dc\u05d5\u05d5\u05e0\u05d8\u05d9','\u05dc\u05d0 \u05de\u05e2\u05d5\u05e0\u05d9\u05d9\u05df','\u05d0\u05d9\u05df \u05de\u05e2\u05e0\u05d4','\u05e1\u05d5\u05db\u05df','\u05e0\u05d9\u05ea\u05e0\u05d4 \u05d4\u05e6\u05e2\u05d4','\u05dc\u05d0 \u05e0\u05d9\u05ea\u05df \u05dc\u05e9\u05e4\u05e8','\u05d1\u05ea\u05d4\u05dc\u05d9\u05da \u05d4\u05db\u05e0\u05ea \u05de\u05e1\u05de\u05db\u05d9\u05dd')\nGROUP BY main_status ORDER BY count DESC" },
    { name: 'chart_insurance_company', body: "SELECT '\u05d4\u05e8\u05d0\u05dc' AS company,\n    COUNT(CASE WHEN harel_agent IS NOT NULL AND harel_agent != '' THEN 1 END) AS leads,\n    COUNT(CASE WHEN harel_agent IS NOT NULL AND closing_amount > 0 THEN 1 END) AS closings,\n    COALESCE(SUM(CASE WHEN harel_agent IS NOT NULL AND closing_amount > 0 THEN closing_amount END), 0) AS amount\nFROM leads\nUNION ALL\nSELECT '\u05d4\u05e4\u05e0\u05d9\u05e7\u05e1',\n    COUNT(CASE WHEN phoenix_agent IS NOT NULL AND phoenix_agent != '' THEN 1 END),\n    COUNT(CASE WHEN phoenix_agent IS NOT NULL AND closing_amount > 0 THEN 1 END),\n    COALESCE(SUM(CASE WHEN phoenix_agent IS NOT NULL AND closing_amount > 0 THEN closing_amount END), 0)\nFROM leads" },
    { name: 'attention_needed', body: "SELECT c.full_name AS \u05e9\u05dd, c.phone AS \u05d8\u05dc\u05e4\u05d5\u05df, p.name AS \u05de\u05e7\u05d5\u05e8,\n    l.main_status AS \u05e1\u05d8\u05d8\u05d5\u05e1, l.assigned_agent AS \u05de\u05d8\u05e4\u05dc,\n    TO_CHAR(l.updated_at, 'DD/MM/YYYY') AS \u05e2\u05d3\u05db\u05d5\u05df_\u05d0\u05d7\u05e8\u05d5\u05df,\n    EXTRACT(DAY FROM NOW() - l.updated_at)::integer AS \u05d9\u05de\u05d9\u05dd_\u05dc\u05dc\u05d0_\u05e2\u05d3\u05db\u05d5\u05df\nFROM leads l LEFT JOIN customers c ON l.customer_id = c.id LEFT JOIN partners p ON l.partner_id = p.id\nWHERE l.main_status NOT IN ('\u05e0\u05d5\u05d9\u05d3','\u05dc\u05d0 \u05e8\u05dc\u05d5\u05d5\u05e0\u05d8\u05d9','\u05dc\u05d0 \u05de\u05e2\u05d5\u05e0\u05d9\u05d9\u05df','\u05dc\u05d0 \u05e0\u05d9\u05ea\u05df \u05dc\u05e9\u05e4\u05e8','\u05e1\u05d5\u05db\u05df')\n    AND l.main_status NOT LIKE '\u05e1\u05d2\u05d5\u05e8%'\n    AND l.updated_at < NOW() - INTERVAL '7 days'\nORDER BY l.updated_at ASC LIMIT 20" }
  ]
};

let total = 0;
for (const [pageFolder, queries] of Object.entries(pages)) {
  for (const q of queries) {
    const qDir = path.join('pages', pageFolder, 'queries', q.name);
    fs.mkdirSync(qDir, { recursive: true });

    fs.writeFileSync(path.join(qDir, q.name + '.txt'), q.body);

    const meta = {
      gitSyncId: PREFIX + crypto.randomUUID(),
      id: pageFolder + '_' + q.name,
      pluginId: 'postgres-plugin',
      pluginType: 'DB',
      unpublishedAction: {
        actionConfiguration: {
          body: q.body,
          encodeParamsToggle: true,
          paginationType: 'NONE',
          pluginSpecifiedTemplates: [{ value: false }],
          timeoutInMillisecond: 10000
        },
        confirmBeforeExecute: false,
        datasource: {
          name: 'Supabase',
          pluginId: 'postgres-plugin'
        },
        dynamicBindingPathList: [{ key: 'body' }],
        name: q.name,
        pageId: pageFolder,
        runBehaviour: 'AUTOMATIC',
        userSetOnLoad: false
      }
    };

    fs.writeFileSync(path.join(qDir, 'metadata.json'), JSON.stringify(meta, null, 2));
    total++;
  }
}
console.log('Total queries created:', total);
