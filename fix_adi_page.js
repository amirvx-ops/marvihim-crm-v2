const fs = require('fs');
const path = require('path');

const jsonFile = path.join(__dirname, 'pages', 'מעקב לידים', 'מעקב לידים.json');
const page = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
const dsl = page.unpublishedPage.layouts[0].dsl;
const children = dsl.children;

// ─── 1. Check for duplicate Input_Search ────────────────
const searchInputs = children.filter(w => w.widgetName === 'Input_Search');
console.log(`Input_Search count: ${searchInputs.length}`);
// Only 1 exists, no duplicates to remove

// ─── 2. Find Table_Adi and fix it ──────────────────────
const tableIdx = children.findIndex(w => w.widgetName === 'Table_Adi');
const tbl = children[tableIdx];

// Hidden columns that should exist but be invisible
const HIDDEN_COLS = ['lead_id', 'customer_id', 'main_status', 'updated_at', 'surense_lead_id', 'surens_customer_id', 'טלפון'];

// Desired column order (visible, RTL - right to left means first in list = rightmost)
const VISIBLE_ORDER = ['תאריך', 'שם_לקוח', 'תעודת_זהות', 'מקור_ליד', 'ליד_לפניקס', 'ליד_פנימי', 'ליד_הראל', 'מינוי_סוכן', 'סכום_סגירה', 'סטטוס_סגירה', 'הערות'];

// Build the correct columnOrder
const newColumnOrder = [...VISIBLE_ORDER, ...HIDDEN_COLS];

// Ensure all hidden columns exist in primaryColumns (add if missing)
HIDDEN_COLS.forEach(colKey => {
  if (!tbl.primaryColumns[colKey]) {
    const idx = newColumnOrder.indexOf(colKey);
    tbl.primaryColumns[colKey] = {
      index: idx,
      width: 150,
      id: colKey,
      originalId: colKey,
      alias: colKey,
      label: colKey,
      columnType: "text",
      horizontalAlignment: "RIGHT",
      verticalAlignment: "CENTER",
      textSize: "0.875rem",
      textColor: "",
      fontStyle: "",
      enableFilter: true,
      enableSort: true,
      isVisible: false,
      isDisabled: false,
      isCellEditable: false,
      isEditable: false,
      isCellVisible: true,
      isDerived: false,
      isSaveVisible: true,
      isDiscardVisible: true,
      computedValue: `{{Table_Adi.processedTableData.map((currentRow, currentIndex) => ( currentRow["${colKey}"]))}}`,
      sticky: "",
      validation: {},
      cellBackground: "",
      allowCellWrapping: false,
      allowSameOptionsInNewRow: true,
    };
    // Add to dynamicBindingPathList
    tbl.dynamicBindingPathList.push({ key: `primaryColumns.${colKey}.computedValue` });
  }
});

// Update column order
tbl.columnOrder = newColumnOrder;

// Update indexes and visibility
newColumnOrder.forEach((colKey, i) => {
  if (tbl.primaryColumns[colKey]) {
    tbl.primaryColumns[colKey].index = i;
    tbl.primaryColumns[colKey].isVisible = !HIDDEN_COLS.includes(colKey);
  }
});

// ─── 3. Fix date column format ──────────────────────────
if (tbl.primaryColumns['תאריך']) {
  tbl.primaryColumns['תאריך'].columnType = "date";
  tbl.primaryColumns['תאריך'].inputFormat = "yyyy-MM-dd'T'HH:mm:ss";
  tbl.primaryColumns['תאריך'].outputFormat = "DD/MM/YYYY";
}

// ─── 4. Fix all visible columns alignment to RIGHT (RTL) ─
Object.keys(tbl.primaryColumns).forEach(colKey => {
  tbl.primaryColumns[colKey].horizontalAlignment = "RIGHT";
});

// Also set table-level alignment
tbl.horizontalAlignment = "RIGHT";

// ─── 5. Verify stats are connected to count_adi_stats ───
const statWidgets = children.filter(w => w.widgetName.startsWith('Stat_') && w.widgetName.endsWith('Val'));
console.log('\nStat widgets and their bindings:');
statWidgets.forEach(w => {
  const hasBinding = w.text && w.text.includes('count_adi_stats');
  console.log(`  ${w.widgetName}: ${hasBinding ? '✓ connected' : '✗ NOT connected'} → ${w.text}`);
});

// ─── 6. Fix all TEXT_WIDGET alignment to RIGHT ──────────
children.forEach(w => {
  if (w.type === 'TEXT_WIDGET') {
    w.textAlign = "RIGHT";
  }
});

// ─── Summary ────────────────────────────────────────────
console.log('\nColumn order:', tbl.columnOrder);
console.log('\nHidden columns:');
HIDDEN_COLS.forEach(c => {
  const col = tbl.primaryColumns[c];
  console.log(`  ${c}: isVisible=${col?.isVisible}`);
});
console.log('\nVisible columns:');
VISIBLE_ORDER.forEach(c => {
  const col = tbl.primaryColumns[c];
  console.log(`  ${c}: isVisible=${col?.isVisible}, index=${col?.index}, align=${col?.horizontalAlignment}`);
});
console.log(`\nDate column type: ${tbl.primaryColumns['תאריך']?.columnType}, format: ${tbl.primaryColumns['תאריך']?.outputFormat}`);

// ─── Write back ─────────────────────────────────────────
fs.writeFileSync(jsonFile, JSON.stringify(page, null, 2), 'utf8');
console.log('\n✓ File saved');
