/**
 * Build complete widget DSL for all 4 Appsmith pages.
 * Generates TEXT, INPUT, SELECT, TABLE, and CHART widgets
 * and writes them into the page JSON DSL children array.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PAGES_DIR = path.join(__dirname, 'pages');
const GITSYNC_PREFIX = '69a83c7ea57cda66ecff91bb_';

// ─── Helpers ────────────────────────────────────────────
function genId(len = 10) {
  return crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
}

let widgetCounter = 0;
function uniqueId() {
  widgetCounter++;
  return genId(10);
}

// ─── Base Widget ────────────────────────────────────────
function base(name, type, top, bottom, left, right) {
  return {
    widgetName: name,
    type,
    widgetId: uniqueId(),
    parentId: "0",
    isVisible: true,
    version: 1,
    topRow: top,
    bottomRow: bottom,
    leftColumn: left,
    rightColumn: right,
    parentRowSpace: 10,
    parentColumnSpace: 1,
    renderMode: "CANVAS",
    isLoading: false,
    animateLoading: true,
    key: genId(5),
    isDeprecated: false,
    dynamicBindingPathList: [],
    dynamicTriggerPathList: [],
    dynamicPropertyPathList: [],
  };
}

// ─── TEXT Widget ────────────────────────────────────────
function text(name, textVal, top, bottom, left, right, opts = {}) {
  const dynBindings = [
    { key: "fontFamily" },
    { key: "borderRadius" },
    { key: "truncateButtonColor" },
  ];
  const dynProps = [];
  if (textVal.includes('{{')) {
    dynBindings.push({ key: "text" });
    dynProps.push({ key: "text" });
  }

  return {
    ...base(name, "TEXT_WIDGET", top, bottom, left, right),
    text: textVal,
    fontSize: opts.fontSize || "1rem",
    fontStyle: opts.fontStyle || "",
    textAlign: opts.textAlign || "RIGHT",
    textColor: opts.textColor || "#231F20",
    overflow: "NONE",
    fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
    disableLink: false,
    dynamicBindingPathList: dynBindings,
    dynamicPropertyPathList: dynProps,
  };
}

// ─── INPUT Widget ───────────────────────────────────────
function input(name, placeholder, top, bottom, left, right) {
  return {
    ...base(name, "INPUT_WIDGET_V2", top, bottom, left, right),
    placeholderText: placeholder,
    inputType: "TEXT",
    defaultText: "",
    isRequired: false,
    isDisabled: false,
    isSpellCheck: false,
    resetOnSubmit: false,
    label: "",
    labelPosition: "Top",
    labelAlignment: "right",
    iconSVG: "/static/media/icon.2bdb82e4c714c1ecdf91eb62b2ef5e7f.svg",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    version: 2,
    dynamicBindingPathList: [
      { key: "accentColor" },
      { key: "borderRadius" },
    ],
  };
}

// ─── SELECT Widget ──────────────────────────────────────
function select(name, placeholder, options, top, bottom, left, right, opts = {}) {
  const dynBindings = [
    { key: "accentColor" },
    { key: "borderRadius" },
  ];
  const dynProps = [];

  // If options is a string with {{ }}, it's a dynamic binding
  let optionsVal = options;
  if (typeof options === 'string' && options.includes('{{')) {
    dynBindings.push({ key: "sourceData" });
    dynProps.push({ key: "sourceData" });
  }

  const w = {
    ...base(name, "SELECT_WIDGET", top, bottom, left, right),
    placeholderText: placeholder,
    isFilterable: true,
    serverSideFiltering: false,
    defaultOptionValue: "",
    label: opts.label || "",
    labelPosition: "Top",
    labelAlignment: "right",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "none",
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    dynamicBindingPathList: dynBindings,
    dynamicPropertyPathList: dynProps,
  };

  if (Array.isArray(options)) {
    w.options = options;
  } else {
    w.sourceData = options;
    w.optionLabel = "label";
    w.optionValue = "value";
  }

  return w;
}

// ─── TABLE Widget ───────────────────────────────────────
function table(name, dataBinding, columns, top, bottom, left, right, opts = {}) {
  const dynBindings = [
    { key: "accentColor" },
    { key: "borderRadius" },
    { key: "boxShadow" },
    { key: "tableData" },
  ];
  const dynProps = [{ key: "tableData" }];
  const dynTriggers = [];

  const primaryColumns = {};
  const columnOrder = [];

  columns.forEach((col, i) => {
    columnOrder.push(col.key);
    primaryColumns[col.key] = {
      index: i,
      width: col.width || 150,
      id: col.key,
      originalId: col.key,
      alias: col.key,
      label: col.label,
      columnType: col.columnType || "text",
      horizontalAlignment: "RIGHT",
      verticalAlignment: "CENTER",
      textSize: "0.875rem",
      textColor: "",
      fontStyle: "",
      enableFilter: true,
      enableSort: true,
      isVisible: col.isVisible !== false,
      isDisabled: false,
      isCellEditable: col.editable || false,
      isEditable: col.editable || false,
      isCellVisible: true,
      isDerived: false,
      isSaveVisible: true,
      isDiscardVisible: true,
      computedValue: `{{${name}.processedTableData.map((currentRow, currentIndex) => ( currentRow["${col.key}"]))}}`,
      sticky: "",
      validation: {},
      cellBackground: "",
      allowCellWrapping: false,
      allowSameOptionsInNewRow: true,
    };
    dynBindings.push({ key: `primaryColumns.${col.key}.computedValue` });
  });

  if (opts.serverSidePagination) {
    dynTriggers.push({ key: "onPageChange" });
    dynTriggers.push({ key: "onPageSizeChange" });
  }
  if (opts.onSubmitSuccess) {
    dynTriggers.push({ key: "onSubmitSuccess" });
  }

  return {
    ...base(name, "TABLE_WIDGET_V2", top, bottom, left, right),
    version: 2,
    tableData: dataBinding,
    primaryColumns,
    columnOrder,
    isVisibleSearch: opts.isVisibleSearch !== false,
    isVisibleFilters: true,
    isVisiblePagination: true,
    isVisibleDownload: true,
    isSortable: true,
    enableClientSideSearch: !opts.serverSidePagination,
    serverSidePaginationEnabled: opts.serverSidePagination || false,
    defaultPageSize: opts.pageSize || 20,
    totalRecordsCount: 0,
    defaultSelectedRowIndex: 0,
    defaultSelectedRowIndices: [0],
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
    borderColor: "#E0DEDE",
    borderWidth: "1",
    textSize: "0.875rem",
    horizontalAlignment: "RIGHT",
    verticalAlignment: "CENTER",
    delimiter: ",",
    label: "Data",
    searchKey: "",
    inlineEditingSaveOption: opts.onSubmitSuccess ? "ROW_LEVEL" : "CUSTOM",
    onPageChange: opts.serverSidePagination ? `{{${opts.fetchQuery}.run()}}` : "",
    onPageSizeChange: opts.serverSidePagination ? `{{${opts.fetchQuery}.run()}}` : "",
    onSubmitSuccess: opts.onSubmitSuccess || "",
    canFreezeColumn: true,
    columnWidthMap: {},
    columnUpdatedAt: Date.now(),
    needsHeightForContent: true,
    childStylesheet: {
      button: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "none"
      },
      menuButton: {
        menuColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "none"
      },
      iconButton: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "none"
      },
      editActions: {
        saveButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        saveBorderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        discardBorderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}"
      }
    },
    dynamicBindingPathList: dynBindings,
    dynamicTriggerPathList: dynTriggers,
    dynamicPropertyPathList: dynProps,
  };
}

// ─── CHART Widget ───────────────────────────────────────
function chart(name, chartType, chartName, seriesConfig, top, bottom, left, right, opts = {}) {
  const dynBindings = [
    { key: "accentColor" },
    { key: "fontFamily" },
    { key: "borderRadius" },
    { key: "boxShadow" },
  ];
  const dynProps = [];
  const chartData = {};

  seriesConfig.forEach(s => {
    const seriesId = genId(8);
    chartData[seriesId] = {
      seriesName: s.name,
      data: s.data,
      color: s.color || "",
    };
    dynBindings.push({ key: `chartData.${seriesId}.data` });
    dynProps.push({ key: `chartData.${seriesId}.data` });
  });

  return {
    ...base(name, "CHART_WIDGET", top, bottom, left, right),
    chartType,
    chartName,
    chartData,
    xAxisName: opts.xAxisName || "",
    yAxisName: opts.yAxisName || "",
    allowScroll: false,
    showDataPointLabel: false,
    setAdaptiveYMin: false,
    labelOrientation: "auto",
    customFusionChartConfig: { type: "", dataSource: { chart: {}, data: [] } },
    accentColor: "{{appsmith.theme.colors.primaryColor}}",
    fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
    borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
    dynamicBindingPathList: dynBindings,
    dynamicPropertyPathList: dynProps,
  };
}


// ═══════════════════════════════════════════════════════════
// PAGE BUILDERS
// ═══════════════════════════════════════════════════════════

// ─── Month options generator ────────────────────────────
function monthOptions() {
  const opts = [{ label: "הכל", value: "" }];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const y = d.getFullYear();
    opts.push({ label: `${m}/${y}`, value: `${m}/${y}` });
  }
  return opts;
}

const PARTNER_OPTIONS = [
  { label: "הכל", value: "" },
  { label: "MARVIHIM", value: "MARVIHIM" },
  { label: "FIBO", value: "FIBO" },
  { label: "TaxPro", value: "TaxPro" },
  { label: "ALLJOBS", value: "ALLJOBS" },
  { label: "HIGHTAX", value: "HIGHTAX" },
  { label: "TAXUP", value: "TAXUP" },
  { label: "אקסלנס", value: "אקסלנס" },
  { label: "החזר-טק", value: "החזר-טק" },
  { label: "יש לי זכות", value: "יש לי זכות" },
  { label: "קבוצת פתרון", value: "קבוצת פתרון" },
  { label: "קו זכות", value: "קו זכות" },
  { label: "plus-finance", value: "plus-finance" },
];

const AGENT_OPTIONS = [
  { label: "הכל", value: "" },
  { label: "גאמביז", value: "גאמביז" },
  { label: "נופר", value: "נופר" },
  { label: "רמי", value: "רמי" },
  { label: "אסף", value: "אסף" },
];

const ASAF_STATUS_OPTIONS = [
  { label: "הכל", value: "" },
  { label: "נויד", value: "נויד" },
  { label: "מעקב", value: "מעקב" },
  { label: "ביקש מועד אחר", value: "ביקש מועד אחר" },
  { label: "לא רלוונטי", value: "לא רלוונטי" },
  { label: "לא מעוניין", value: "לא מעוניין" },
  { label: "אין מענה", value: "אין מענה" },
  { label: "סוכן", value: "סוכן" },
  { label: "ניתנה הצעה", value: "ניתנה הצעה" },
  { label: "לא ניתן לשפר", value: "לא ניתן לשפר" },
  { label: "בתהליך הכנת מסמכים", value: "בתהליך הכנת מסמכים" },
];

const ASAF_SOURCE_OPTIONS = [
  { label: "הכל", value: "" },
  { label: "תיאום פגישות לידור", value: "תיאום פגישות לידור" },
  { label: "תיק קיים", value: "תיק קיים" },
  { label: "בדיקת מסלקה", value: "בדיקת מסלקה" },
  { label: "תיק קיים / אמיר", value: "תיק קיים / אמיר" },
];

// ═══════════════════════════════════════════════════════════
// PAGE 1: ADI - מעקב לידים
// ═══════════════════════════════════════════════════════════
function buildAdiPage() {
  const children = [];

  // Header
  children.push(text("Text_Title", "מעקב לידים", 0, 5, 0, 64, {
    fontSize: "1.875rem", fontStyle: "BOLD", textAlign: "RIGHT"
  }));

  // Stats row
  children.push(text("Stat_Total", "{{count_adi_stats.data[0]?.total_leads || 0}}", 6, 10, 53, 64, {
    fontSize: "1.5rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#1976D2"
  }));
  children.push(text("Stat_Total_Label", "סה״כ לידים", 6, 10, 53, 64, { // Overlapping - move label below
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));
  // Actually, let me adjust layout - stats side by side
  // Row 6-8: stat values, Row 8-10: stat labels
  children.pop(); children.pop(); // Remove last 2

  // Stats - Value row (row 5-8)
  children.push(text("Stat_TotalVal", "{{count_adi_stats.data[0]?.total_leads || 0}}", 5, 8, 54, 64, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#1976D2"
  }));
  children.push(text("Stat_ClosingsVal", "{{count_adi_stats.data[0]?.closings || 0}}", 5, 8, 44, 54, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#4CAF50"
  }));
  children.push(text("Stat_ClosingAmtVal", "₪{{count_adi_stats.data[0]?.total_closing || 0}}", 5, 8, 33, 44, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#4CAF50"
  }));
  children.push(text("Stat_AppointVal", "₪{{count_adi_stats.data[0]?.total_appointment || 0}}", 5, 8, 22, 33, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#FF9800"
  }));
  children.push(text("Stat_HarelVal", "{{count_adi_stats.data[0]?.harel_leads || 0}}", 5, 8, 11, 22, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#9C27B0"
  }));
  children.push(text("Stat_PhoenixVal", "{{count_adi_stats.data[0]?.phoenix_leads || 0}}", 5, 8, 0, 11, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#F44336"
  }));

  // Stats - Label row (row 8-10)
  children.push(text("Stat_TotalLbl", "סה״כ לידים", 8, 10, 54, 64, {
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("Stat_ClosingsLbl", "סגירות", 8, 10, 44, 54, {
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("Stat_ClosingAmtLbl", "סכום סגירות", 8, 10, 33, 44, {
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("Stat_AppointLbl", "מינוי סוכן", 8, 10, 22, 33, {
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("Stat_HarelLbl", "לידים הראל", 8, 10, 11, 22, {
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("Stat_PhoenixLbl", "לידים פניקס", 8, 10, 0, 11, {
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));

  // Filters row (row 11-15)
  children.push(input("Input_Search", "חיפוש שם / ת.ז...", 11, 15, 48, 64));
  children.push(select("Select_Month", "בחר חודש", monthOptions(), 11, 15, 32, 48));
  children.push(select("Select_Partner", "מקור ליד", PARTNER_OPTIONS, 11, 15, 16, 32));

  // Main table (row 16-68)
  children.push(table("Table_Adi", "{{fetch_adi_leads.data}}", [
    { key: "תאריך", label: "תאריך", width: 110 },
    { key: "שם_לקוח", label: "שם לקוח", width: 140 },
    { key: "תעודת_זהות", label: "ת.ז.", width: 110 },
    { key: "מקור_ליד", label: "מקור ליד", width: 120 },
    { key: "ליד_לפניקס", label: "ליד לפניקס", width: 130, editable: true },
    { key: "ליד_פנימי", label: "ליד פנימי", width: 90, editable: true },
    { key: "ליד_הראל", label: "ליד הראל", width: 130, editable: true },
    { key: "מינוי_סוכן", label: "מינוי סוכן", width: 110, editable: true },
    { key: "סכום_סגירה", label: "סכום סגירה", width: 120, editable: true },
    { key: "סטטוס_סגירה", label: "סטטוס", width: 110, editable: true },
    { key: "הערות", label: "הערות", width: 200, editable: true },
    { key: "lead_id", label: "lead_id", isVisible: false },
    { key: "customer_id", label: "customer_id", isVisible: false },
  ], 16, 68, 0, 64, {
    serverSidePagination: true,
    fetchQuery: "fetch_adi_leads",
    pageSize: 20,
    onSubmitSuccess: "{{update_adi_lead.run().then(() => fetch_adi_leads.run())}}",
  }));

  return children;
}

// ═══════════════════════════════════════════════════════════
// PAGE 2: LIDOR - תיאום פגישות
// ═══════════════════════════════════════════════════════════
function buildLidorPage() {
  const children = [];

  // Header
  children.push(text("Text_Title", "תיאום פגישות", 0, 5, 0, 64, {
    fontSize: "1.875rem", fontStyle: "BOLD", textAlign: "RIGHT"
  }));

  // Stats row (row 5-8 values, 8-10 labels)
  children.push(text("Stat_PassedVal", "{{lidor_performance_stats.data?.reduce((s,r) => s + (r.leads_passed || 0), 0) || 0}}", 5, 8, 48, 64, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#1976D2"
  }));
  children.push(text("Stat_DealsVal", "{{lidor_performance_stats.data?.reduce((s,r) => s + (r.deals_closed || 0), 0) || 0}}", 5, 8, 32, 48, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#4CAF50"
  }));
  children.push(text("Stat_RateVal", "{{(() => { const d = lidor_performance_stats.data || []; const p = d.reduce((s,r) => s + (r.leads_passed||0), 0); const c = d.reduce((s,r) => s + (r.deals_closed||0), 0); return p > 0 ? Math.round(c/p*100) + '%' : '0%'; })()}}", 5, 8, 16, 32, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#FF9800"
  }));
  children.push(text("Stat_CommissionVal", "{{(() => { const d = lidor_performance_stats.data || []; const p = d.reduce((s,r) => s + (r.leads_passed||0), 0)*20; const c = d.reduce((s,r) => s + (r.deals_closed||0), 0)*50; return '₪' + (p+c); })()}}", 5, 8, 0, 16, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#4CAF50"
  }));

  // Labels
  children.push(text("Stat_PassedLbl", "לידים שעברו", 8, 10, 48, 64, {
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("Stat_DealsLbl", "עסקאות", 8, 10, 32, 48, {
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("Stat_RateLbl", "אחוז סגירה", 8, 10, 16, 32, {
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("Stat_CommissionLbl", "עמלה", 8, 10, 0, 16, {
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));

  // Filters (row 11-15)
  children.push(input("Input_Search", "חיפוש שם / ת.ז...", 11, 15, 48, 64));
  children.push(select("Select_Month", "חודש", monthOptions(), 11, 15, 36, 48));
  children.push(select("Select_Source", "מקור", PARTNER_OPTIONS, 11, 15, 22, 36));
  children.push(select("Select_Agent", "מטפל", AGENT_OPTIONS, 11, 15, 8, 22));

  // Main table (row 16-52)
  children.push(table("Table_Lidor", "{{fetch_lidor_leads.data}}", [
    { key: "תאריך", label: "תאריך", width: 100 },
    { key: "שם", label: "שם", width: 130 },
    { key: "תז", label: "ת.ז.", width: 100 },
    { key: "כולל_הר_ביטוח", label: "כולל הר ביטוח?", width: 120, editable: true },
    { key: "מקור", label: "מקור", width: 110 },
    { key: "מטפל", label: "מטפל", width: 100, editable: true },
    { key: "תאריך_פגישה", label: "תאריך פגישה", width: 120, editable: true },
    { key: "שעה", label: "שעה", width: 70, editable: true },
    { key: "הליד_עבר", label: "הליד עבר?", width: 90, editable: true },
    { key: "נסגרה_עסקה", label: "נסגרה עסקה", width: 120, editable: true },
    { key: "הערות", label: "הערות", width: 180, editable: true },
    { key: "lead_id", label: "lead_id", isVisible: false },
  ], 16, 52, 0, 64, {
    serverSidePagination: true,
    fetchQuery: "fetch_lidor_leads",
    pageSize: 20,
    onSubmitSuccess: "{{update_lidor_lead.run().then(() => fetch_lidor_leads.run())}}",
  }));

  // Side table: Agent performance (row 53-68)
  children.push(text("Text_AgentPerf", "ביצועים לפי מטפל", 53, 56, 32, 64, {
    fontSize: "1rem", fontStyle: "BOLD", textAlign: "RIGHT"
  }));
  children.push(table("Table_AgentPerf", "{{lidor_performance_stats.data}}", [
    { key: "agent", label: "מטפל", width: 100 },
    { key: "leads_passed", label: "לידים שעברו", width: 100 },
    { key: "deals_closed", label: "עסקאות", width: 80 },
    { key: "close_rate", label: "אחוז סגירה %", width: 100 },
  ], 56, 68, 32, 64, {
    isVisibleSearch: false,
    pageSize: 5,
  }));

  // Side table: Source performance (row 53-68)
  children.push(text("Text_SourcePerf", "ביצועים לפי מקור", 53, 56, 0, 32, {
    fontSize: "1rem", fontStyle: "BOLD", textAlign: "RIGHT"
  }));
  children.push(table("Table_SourcePerf", "{{lidor_source_stats.data}}", [
    { key: "source", label: "מקור", width: 130 },
    { key: "leads_passed", label: "לידים שעברו", width: 100 },
    { key: "deals_closed", label: "עסקאות", width: 80 },
  ], 56, 68, 0, 32, {
    isVisibleSearch: false,
    pageSize: 10,
  }));

  return children;
}

// ═══════════════════════════════════════════════════════════
// PAGE 3: ASAF - תיעוד לקוחות
// ═══════════════════════════════════════════════════════════
function buildAsafPage() {
  const children = [];

  // Header
  children.push(text("Text_Title", "תיעוד לקוחות - אסף", 0, 5, 0, 64, {
    fontSize: "1.875rem", fontStyle: "BOLD", textAlign: "RIGHT"
  }));

  // Stats (row 5-8 values, 8-10 labels)
  children.push(text("Stat_TotalVal", "{{asaf_stats.data[0]?.total || 0}}", 5, 8, 54, 64, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#1976D2"
  }));
  children.push(text("Stat_PortedVal", "{{asaf_stats.data[0]?.ported || 0}}", 5, 8, 44, 54, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#4CAF50"
  }));
  children.push(text("Stat_FollowVal", "{{asaf_stats.data[0]?.follow_up || 0}}", 5, 8, 33, 44, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#FF9800"
  }));
  children.push(text("Stat_ProposalVal", "{{asaf_stats.data[0]?.proposal_given || 0}}", 5, 8, 22, 33, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#2196F3"
  }));
  children.push(text("Stat_ClosedVal", "{{asaf_stats.data[0]?.closed_no_deal || 0}}", 5, 8, 11, 22, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#F44336"
  }));
  children.push(text("Stat_AmountVal", "₪{{asaf_stats.data[0]?.total_ported_amount || 0}}", 5, 8, 0, 11, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#4CAF50"
  }));

  // Labels
  children.push(text("Stat_TotalLbl", "סה״כ", 8, 10, 54, 64, {
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("Stat_PortedLbl", "נויד", 8, 10, 44, 54, {
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("Stat_FollowLbl", "מעקב", 8, 10, 33, 44, {
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("Stat_ProposalLbl", "ניתנה הצעה", 8, 10, 22, 33, {
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("Stat_ClosedLbl", "סגור ללא עסקה", 8, 10, 11, 22, {
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("Stat_AmountLbl", "סכום נויד", 8, 10, 0, 11, {
    fontSize: "0.75rem", textAlign: "CENTER", textColor: "#666"
  }));

  // Filters (row 11-15)
  children.push(input("Input_Search", "חיפוש שם / ת.ז. / נייד...", 11, 15, 44, 64));
  children.push(select("Select_Status", "סטטוס", ASAF_STATUS_OPTIONS, 11, 15, 24, 44));
  children.push(select("Select_Source", "מקור הגעה", ASAF_SOURCE_OPTIONS, 11, 15, 4, 24));

  // Main table (row 16-68)
  children.push(table("Table_Asaf", "{{fetch_asaf_leads.data}}", [
    { key: "תאריך", label: "תאריך", width: 100 },
    { key: "שם_לקוח", label: "שם לקוח", width: 130 },
    { key: "תעודת_זהות", label: "תעודת זהות", width: 110 },
    { key: "נייד", label: "נייד", width: 110, editable: true },
    { key: "מקור_הגעה", label: "מקור הגעה", width: 130 },
    { key: "סכום_כולל", label: "סכום כולל", width: 110, editable: true },
    { key: "סטטוס", label: "סטטוס", width: 130, editable: true },
    { key: "הערות", label: "הערות", width: 250, editable: true },
    { key: "פרמיה_פנסיה", label: "פרמיה פנסיה", width: 110, editable: true },
    { key: "צבירה_פנסיה", label: "צבירה פנסיה", width: 110, editable: true },
    { key: "צבירה_גמל_השתלמות", label: "צבירה גמל/השתלמות", width: 140, editable: true },
    { key: "lead_id", label: "lead_id", isVisible: false },
    { key: "customer_id", label: "customer_id", isVisible: false },
  ], 16, 68, 0, 64, {
    serverSidePagination: true,
    fetchQuery: "fetch_asaf_leads",
    pageSize: 20,
    onSubmitSuccess: "{{update_asaf_lead.run().then(() => { update_asaf_customer.run(); fetch_asaf_leads.run(); })}}",
  }));

  return children;
}

// ═══════════════════════════════════════════════════════════
// PAGE 4: DASHBOARD - Page1
// ═══════════════════════════════════════════════════════════
function buildDashboardPage() {
  const children = [];

  // Header
  children.push(text("Text_Title", "דשבורד ניהול - מרוויחים", 0, 5, 0, 64, {
    fontSize: "1.875rem", fontStyle: "BOLD", textAlign: "RIGHT"
  }));

  // KPI Row 1 - Values (row 5-9)
  children.push(text("KPI_LeadsVal", "{{dashboard_kpis.data[0]?.total_leads || 0}}", 5, 9, 57, 64, {
    fontSize: "1.5rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#1976D2"
  }));
  children.push(text("KPI_NewVal", "{{dashboard_kpis.data[0]?.new_leads || 0}}", 5, 9, 50, 57, {
    fontSize: "1.5rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#2196F3"
  }));
  children.push(text("KPI_ClosingsVal", "{{dashboard_kpis.data[0]?.total_closings || 0}}", 5, 9, 43, 50, {
    fontSize: "1.5rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#4CAF50"
  }));
  children.push(text("KPI_ClosingAmtVal", "₪{{dashboard_kpis.data[0]?.total_closing_amount || 0}}", 5, 9, 36, 43, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#4CAF50"
  }));
  children.push(text("KPI_AppointVal", "₪{{dashboard_kpis.data[0]?.total_appointment_amount || 0}}", 5, 9, 29, 36, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#FF9800"
  }));
  children.push(text("KPI_PassedVal", "{{dashboard_kpis.data[0]?.total_leads_passed || 0}}", 5, 9, 22, 29, {
    fontSize: "1.5rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#9C27B0"
  }));
  children.push(text("KPI_DealsVal", "{{dashboard_kpis.data[0]?.total_deals_closed || 0}}", 5, 9, 15, 22, {
    fontSize: "1.5rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#E91E63"
  }));
  children.push(text("KPI_PortedVal", "{{dashboard_kpis.data[0]?.total_ported || 0}}", 5, 9, 8, 15, {
    fontSize: "1.5rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#00BCD4"
  }));
  children.push(text("KPI_PortedAmtVal", "₪{{dashboard_kpis.data[0]?.total_ported_amount || 0}}", 5, 9, 0, 8, {
    fontSize: "1.25rem", fontStyle: "BOLD", textAlign: "CENTER", textColor: "#00BCD4"
  }));

  // KPI Row 1 - Labels (row 9-11)
  children.push(text("KPI_LeadsLbl", "סה״כ לידים", 9, 11, 57, 64, {
    fontSize: "0.625rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("KPI_NewLbl", "חדשים", 9, 11, 50, 57, {
    fontSize: "0.625rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("KPI_ClosingsLbl", "סגירות", 9, 11, 43, 50, {
    fontSize: "0.625rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("KPI_ClosingAmtLbl", "סכום סגירות", 9, 11, 36, 43, {
    fontSize: "0.625rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("KPI_AppointLbl", "מינוי סוכן", 9, 11, 29, 36, {
    fontSize: "0.625rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("KPI_PassedLbl", "לידים שעברו", 9, 11, 22, 29, {
    fontSize: "0.625rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("KPI_DealsLbl", "עסקאות", 9, 11, 15, 22, {
    fontSize: "0.625rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("KPI_PortedLbl", "נוידו", 9, 11, 8, 15, {
    fontSize: "0.625rem", textAlign: "CENTER", textColor: "#666"
  }));
  children.push(text("KPI_PortedAmtLbl", "סכום נויד", 9, 11, 0, 8, {
    fontSize: "0.625rem", textAlign: "CENTER", textColor: "#666"
  }));

  // Charts Row 1 (row 12-32): Source bar + Agent bar
  children.push(chart("Chart_BySource", "BAR_CHART", "לידים לפי מקור", [
    {
      name: "סה״כ",
      data: "{{chart_by_source.data?.map(r => ({x: r.source || 'לא ידוע', y: r.total})) || []}}",
    },
    {
      name: "נסגרו",
      data: "{{chart_by_source.data?.map(r => ({x: r.source || 'לא ידוע', y: r.closed})) || []}}",
    },
  ], 12, 32, 32, 64, { xAxisName: "מקור", yAxisName: "כמות" }));

  children.push(chart("Chart_ByAgent", "BAR_CHART", "ביצועים לפי מטפל", [
    {
      name: "עברו",
      data: "{{chart_by_agent.data?.map(r => ({x: r.agent, y: r.passed})) || []}}",
    },
    {
      name: "נסגרו",
      data: "{{chart_by_agent.data?.map(r => ({x: r.agent, y: r.closed})) || []}}",
    },
  ], 12, 32, 0, 32, { xAxisName: "מטפל", yAxisName: "כמות" }));

  // Charts Row 2 (row 33-53): Monthly trend (full width)
  children.push(chart("Chart_Monthly", "LINE_CHART", "מגמה חודשית", [
    {
      name: "לידים חדשים",
      data: "{{chart_monthly_trend.data?.map(r => ({x: r.month, y: r.new_leads})) || []}}",
    },
    {
      name: "סגירות",
      data: "{{chart_monthly_trend.data?.map(r => ({x: r.month, y: r.closings})) || []}}",
    },
    {
      name: "נוידו",
      data: "{{chart_monthly_trend.data?.map(r => ({x: r.month, y: r.ported})) || []}}",
    },
  ], 33, 53, 0, 64, { xAxisName: "חודש", yAxisName: "כמות" }));

  // Charts Row 3 (row 54-74): Insurance company + Asaf statuses
  children.push(chart("Chart_Insurance", "BAR_CHART", "הראל vs פניקס", [
    {
      name: "לידים",
      data: "{{chart_insurance_company.data?.map(r => ({x: r.company, y: r.leads})) || []}}",
    },
    {
      name: "סגירות",
      data: "{{chart_insurance_company.data?.map(r => ({x: r.company, y: r.closings})) || []}}",
    },
  ], 54, 74, 32, 64, { xAxisName: "חברה", yAxisName: "כמות" }));

  children.push(chart("Chart_AsafStatus", "PIE_CHART", "התפלגות סטטוסים - אסף", [
    {
      name: "סטטוסים",
      data: "{{chart_asaf_statuses.data?.map(r => ({x: r.status, y: r.count})) || []}}",
    },
  ], 54, 74, 0, 32));

  // Attention table (row 75-100)
  children.push(text("Text_Attention", "לידים שדורשים טיפול (7+ ימים ללא עדכון)", 75, 78, 0, 64, {
    fontSize: "1.125rem", fontStyle: "BOLD", textAlign: "RIGHT", textColor: "#F44336"
  }));

  children.push(table("Table_Attention", "{{attention_needed.data}}", [
    { key: "שם", label: "שם", width: 130 },
    { key: "טלפון", label: "טלפון", width: 110 },
    { key: "מקור", label: "מקור", width: 110 },
    { key: "סטטוס", label: "סטטוס", width: 110 },
    { key: "מטפל", label: "מטפל", width: 100 },
    { key: "עדכון_אחרון", label: "עדכון אחרון", width: 110 },
    { key: "ימים_ללא_עדכון", label: "ימים ללא עדכון", width: 120 },
  ], 78, 100, 0, 64, {
    pageSize: 10,
  }));

  return children;
}


// ═══════════════════════════════════════════════════════════
// MAIN: Update all page JSON files
// ═══════════════════════════════════════════════════════════
const pages = [
  {
    folder: "מעקב לידים",
    builder: buildAdiPage,
    slug: "adi-leads",
    bottomRow: 5000,
    minHeight: 1292,
    rightColumn: 4896,
    snapRows: 124,
  },
  {
    folder: "תיאום פגישות (לידור)",
    builder: buildLidorPage,
    slug: "",
    bottomRow: 5000,
    minHeight: 1292,
    rightColumn: 4896,
    snapRows: 124,
  },
  {
    folder: "תיעוד לקוחות (אסף)",
    builder: buildAsafPage,
    slug: "",
    bottomRow: 5000,
    minHeight: 1292,
    rightColumn: 4896,
    snapRows: 124,
  },
  {
    folder: "Page1",
    builder: buildDashboardPage,
    slug: "page1",
    bottomRow: 5000,
    minHeight: 1292,
    rightColumn: 4896,
    snapRows: 124,
  },
];

let totalWidgets = 0;

pages.forEach(pageConfig => {
  const pageDir = path.join(PAGES_DIR, pageConfig.folder);
  const jsonFile = path.join(pageDir, `${pageConfig.folder}.json`);

  // Read existing page JSON
  const existing = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  const gitSyncId = existing.gitSyncId;

  // Build widgets
  const children = pageConfig.builder();
  totalWidgets += children.length;

  // Collect all dynamic binding/trigger/property paths from children
  const allDynBindings = [];
  const allDynTriggers = [];

  children.forEach(w => {
    if (w.dynamicBindingPathList) {
      w.dynamicBindingPathList.forEach(p => {
        // Don't add to parent - keep on widget
      });
    }
  });

  // Build the updated DSL
  const dsl = {
    backgroundColor: "none",
    bottomRow: pageConfig.bottomRow,
    canExtend: true,
    containerStyle: "none",
    detachFromLayout: true,
    dynamicBindingPathList: [],
    dynamicTriggerPathList: [],
    leftColumn: 0,
    minHeight: pageConfig.minHeight,
    parentColumnSpace: 1,
    parentRowSpace: 1,
    rightColumn: pageConfig.rightColumn,
    snapColumns: 64,
    snapRows: pageConfig.snapRows,
    topRow: 0,
    type: "CANVAS_WIDGET",
    version: 94,
    widgetId: "0",
    widgetName: "MainContainer",
    children: children,
  };

  // Build the full page JSON
  const pageJson = {
    gitSyncId: gitSyncId,
    unpublishedPage: {
      ...existing.unpublishedPage,
      layouts: [{ dsl }],
    },
  };

  fs.writeFileSync(jsonFile, JSON.stringify(pageJson, null, 2), 'utf8');
  console.log(`✓ ${pageConfig.folder}: ${children.length} widgets`);
});

console.log(`\nTotal: ${totalWidgets} widgets across ${pages.length} pages`);
