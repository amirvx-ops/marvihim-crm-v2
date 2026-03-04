# Surense Sync via Zapier MCP - Setup Guide

## Available Zapier/Surense Actions
Based on the connected Zapier MCP, these Surense actions are available:
- `surense_3_27_0_create_lead` / `update_lead` / `get_lead` / `search_leads` / `delete_lead`
- `surense_3_27_0_create_customer` / `update_customer` / `get_customer` / `search_customers` / `delete_customer`
- `surense_3_27_0_create_meeting` / `update_meeting` / `get_meeting` / `search_meetings` / `delete_meeting`
- `surense_3_27_0_create_workflow` / `update_workflow` / `get_workflow` / `search_workflows` / `delete_workflow`
- `surense_3_27_0_create_activity`
- `surense_3_27_0_create_report` / `send_report`
- `surense_3_27_0_create_meeting_summary` / `send_meeting_summary`
- `surense_3_27_0_add_related_customer`
- Various download/upload actions for documents and reports

## Sync Strategy

### Direction: Supabase → Surense (primary)
Workers update data in Appsmith/Supabase. Changes flow to Surense via n8n → Zapier.

### Direction: Surense → Supabase (on initial creation)
New leads/customers from Surense arrive via n8n webhook and create records in Supabase.

## n8n Workflow Definitions

### Workflow 1: Sync Lead Status Changes
```
Trigger: Supabase Webhook (on leads UPDATE where main_status changed)
↓
Filter: surense_lead_id IS NOT NULL (only sync leads that exist in Surense)
↓
HTTP Request → Zapier MCP: surense_3_27_0_update_lead
  - Lead ID: {{$json.surense_lead_id}}
  - Status: {{$json.main_status}} (map to Surense status codes)
  - Notes: {{$json.notes}}
↓
On Error: Log to activity_log with performed_by = 'sync_error'
```

### Workflow 2: Sync Meeting Creation
```
Trigger: Supabase Webhook (on leads UPDATE where meeting_scheduled_date changed from NULL)
↓
Filter: surense_lead_id IS NOT NULL
↓
HTTP Request → Zapier MCP: surense_3_27_0_create_meeting
  - Customer ID: {{lookup surens_customer_id from customers table}}
  - Date: {{$json.meeting_scheduled_date}}
  - Type: {{$json.meeting_type}}
  - Agent: "אסף"
↓
Store returned meeting ID in leads.surense_meeting_id (add column if needed)
```

### Workflow 3: Sync Meeting Results
```
Trigger: Supabase Webhook (on leads UPDATE where meeting_result changed from NULL)
↓
HTTP Request → Zapier MCP: surense_3_27_0_create_meeting_summary
  - Meeting ID: {{lookup from meetings table or lead}}
  - Summary: {{$json.meeting_result}}
  - Products: {{$json.products_sold}}
↓
If main_status = 'נסגרה עסקה':
  HTTP Request → Zapier MCP: surense_3_27_0_create_activity
    - Type: "sale"
    - Customer ID: {{surens_customer_id}}
    - Details: products + premium
```

### Workflow 4: Sync Customer Updates
```
Trigger: Supabase Webhook (on customers UPDATE)
↓
Filter: surens_customer_id IS NOT NULL
↓
HTTP Request → Zapier MCP: surense_3_27_0_update_customer
  - Customer ID: {{$json.surens_customer_id}}
  - Phone: {{$json.phone}}
  - Email: {{$json.email}}
  - Address: {{$json.city}}
```

### Workflow 5: Incoming from Surense (new leads)
```
Trigger: Webhook from n8n (called by Surense/external)
↓
Check if customer exists: SELECT * FROM customers WHERE identity_number = {{$json.identity_number}}
↓
If not exists: INSERT INTO customers (...)
If exists: UPDATE customers SET ... (merge new data)
↓
INSERT INTO leads (customer_id, partner_id, surense_lead_id, main_status)
↓
Notify Appsmith users (optional: pg_notify or Supabase Realtime)
```

## Status Mapping: Supabase ↔ Surense

| Supabase Status | Surense Status (verify exact values) |
|-----------------|--------------------------------------|
| New | חדש |
| בטיפול | בטיפול |
| ממתין למסלקה | ממתין למסלקה |
| ממתין להר ביטוח | ממתין להר ביטוח |
| מוכן לפגישה | מוכן לפגישה |
| תואמה פגישה | תואמה פגישה |
| בוצעה פגישה | בוצעה פגישה |
| הצעה נשלחה | הצעה נשלחה |
| נסגרה עסקה | נסגרה עסקה |
| סגור (לא זכאי) | סגור - לא זכאי |
| סגור (לא מעוניין) | סגור - לא מעוניין |
| סגור (אחר) | סגור - אחר |

**IMPORTANT**: You need to verify the exact Surense status field names by running:
```
Zapier MCP → surense_3_27_0_get_lead with a known lead ID
```
Then map the response fields to understand Surense's data structure.

## Setup Steps for Claude Code

1. First, explore the Zapier MCP to understand Surense field names:
```
Use tool_search to find Zapier Surense tools
Then call surense_3_27_0_get_lead or surense_3_27_0_search_leads to see field structure
```

2. Create the n8n workflows (n8n JSON exports or manual setup)

3. Configure Supabase webhooks:
   - Go to Supabase Dashboard → Database → Webhooks
   - Create webhook for leads table (INSERT, UPDATE)
   - Point to your n8n webhook URL

4. Test the sync:
   - Update a lead status in Appsmith
   - Verify it appears in Surense
   - Create a lead in Surense
   - Verify it appears in Supabase/Appsmith
