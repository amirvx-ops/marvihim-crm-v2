const fs = require('fs');
const path = require('path');

const BASE = __dirname;

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(path.join(BASE, filePath), 'utf8'));
}

// Replace any null string values with empty strings recursively
function fixNulls(obj) {
  if (obj === null) return '';
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(fixNulls);
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    result[k] = fixNulls(v);
  }
  return result;
}

// ── Read root configs ──
const appJson = readJSON('application.json');
const metaJson = readJSON('metadata.json');
const themeJson = readJSON('theme.json');

// ── Build page list ──
const pageNames = ['Page1', 'Page2', 'Page3', 'Page4'];
const pageList = [];
const actionList = [];

for (const pageName of pageNames) {
  const pageJson = readJSON(`pages/${pageName}/${pageName}.json`);
  const dsl = JSON.parse(JSON.stringify(pageJson.unpublishedPage.layouts[0].dsl));

  // ── Read widgets ──
  const widgetsDir = path.join(BASE, 'pages', pageName, 'widgets');
  const topLevelWidgets = [];

  if (fs.existsSync(widgetsDir)) {
    const entries = fs.readdirSync(widgetsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        // Top-level widget file (Table, Input, Select, Chart, Text)
        const widget = readJSON(`pages/${pageName}/widgets/${entry.name}`);
        topLevelWidgets.push(fixNulls(widget));
      } else if (entry.isDirectory()) {
        // Subdirectory = STATBOX_WIDGET or KPI group
        const subDir = path.join(widgetsDir, entry.name);
        const subFiles = fs.readdirSync(subDir).filter(f => f.endsWith('.json'));

        // Find the container file (same name as directory)
        const containerFileName = subFiles.find(f =>
          f === entry.name + '.json'
        );

        if (!containerFileName) continue;

        const container = readJSON(`pages/${pageName}/widgets/${entry.name}/${containerFileName}`);
        const childFiles = subFiles.filter(f => f !== containerFileName);

        // Find the CANVAS_WIDGET inside children
        if (container.children && container.children.length > 0) {
          const canvas = container.children[0];
          canvas.children = [];

          for (const cf of childFiles) {
            const childWidget = readJSON(`pages/${pageName}/widgets/${entry.name}/${cf}`);
            canvas.children.push(fixNulls(childWidget));
          }
        }

        topLevelWidgets.push(fixNulls(container));
      }
    }
  }

  // Nest widgets into DSL
  dsl.children = topLevelWidgets;

  // ── Read queries ──
  const queriesDir = path.join(BASE, 'pages', pageName, 'queries');
  if (fs.existsSync(queriesDir)) {
    const queryDirs = fs.readdirSync(queriesDir, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const qDir of queryDirs) {
      const metaPath = `pages/${pageName}/queries/${qDir.name}/metadata.json`;
      if (fs.existsSync(path.join(BASE, metaPath))) {
        const meta = readJSON(metaPath);

        // Build action object - ensure all required string fields exist
        const action = {
          id: meta.id || `${pageName}_${qDir.name}`,
          gitSyncId: meta.gitSyncId || '',
          pluginId: meta.pluginId || 'postgres-plugin',
          pluginType: meta.pluginType || 'DB',
          unpublishedAction: {
            name: meta.unpublishedAction?.name || qDir.name,
            fullyQualifiedName: meta.unpublishedAction?.name || qDir.name,
            pageId: pageName,
            datasource: {
              name: 'Supabase',
              pluginId: 'postgres-plugin'
            },
            actionConfiguration: {
              body: meta.unpublishedAction?.actionConfiguration?.body || '',
              encodeParamsToggle: true,
              paginationType: 'NONE',
              pluginSpecifiedTemplates: [{ value: false }],
              timeoutInMillisecond: 10000
            },
            dynamicBindingPathList: meta.unpublishedAction?.dynamicBindingPathList || [{ key: 'body' }],
            executeOnLoad: true,
            confirmBeforeExecute: false,
            userSetOnLoad: false
          },
          publishedAction: {
            name: meta.unpublishedAction?.name || qDir.name,
            fullyQualifiedName: meta.unpublishedAction?.name || qDir.name,
            pageId: pageName,
            datasource: {
              name: 'Supabase',
              pluginId: 'postgres-plugin'
            },
            actionConfiguration: {
              body: meta.unpublishedAction?.actionConfiguration?.body || '',
              encodeParamsToggle: true,
              paginationType: 'NONE',
              pluginSpecifiedTemplates: [{ value: false }],
              timeoutInMillisecond: 10000
            },
            dynamicBindingPathList: meta.unpublishedAction?.dynamicBindingPathList || [{ key: 'body' }],
            executeOnLoad: true,
            confirmBeforeExecute: false,
            userSetOnLoad: false
          }
        };

        actionList.push(fixNulls(action));
      }
    }
  }

  // ── Build page object ──
  const pageObj = {
    unpublishedPage: {
      name: pageJson.unpublishedPage.name,
      slug: pageJson.unpublishedPage.slug,
      layouts: [{
        viewMode: false,
        dsl: dsl,
        layoutOnLoadActions: [],
        layoutOnLoadActionErrors: [],
        validOnPageLoadActions: true
      }],
      policies: [],
      isHidden: false
    },
    publishedPage: {
      name: pageJson.unpublishedPage.name,
      slug: pageJson.unpublishedPage.slug,
      layouts: [{
        viewMode: false,
        dsl: JSON.parse(JSON.stringify(dsl)),
        layoutOnLoadActions: [],
        layoutOnLoadActionErrors: [],
        validOnPageLoadActions: true
      }],
      policies: [],
      isHidden: false
    },
    gitSyncId: pageJson.gitSyncId || ''
  };

  pageList.push(fixNulls(pageObj));
}

// ── Build full export ──
const exportObj = {
  artifactJsonType: 'APPLICATION',
  clientSchemaVersion: metaJson.clientSchemaVersion || 2,
  serverSchemaVersion: metaJson.serverSchemaVersion || 12,
  fileFormatVersion: metaJson.fileFormatVersion || 5,
  exportedApplication: {
    name: 'Marvihim CRM',
    appIsExample: false,
    appLayout: appJson.appLayout,
    applicationDetail: appJson.applicationDetail,
    applicationVersion: appJson.applicationVersion || 2,
    collapseInvisibleWidgets: true,
    color: appJson.color || '#F4FFDE',
    evaluationVersion: appJson.evaluationVersion || 2,
    icon: appJson.icon || 'bar-chart',
    pages: appJson.pages,
    unpublishedAppLayout: appJson.unpublishedAppLayout,
    unpublishedApplicationDetail: appJson.unpublishedApplicationDetail,
    publishedAppLayout: appJson.appLayout,
    publishedApplicationDetail: appJson.applicationDetail,
    gitApplicationMetadata: null,
    exportWithConfiguration: false,
    forkWithConfiguration: false
  },
  datasourceList: [{
    name: 'Supabase',
    pluginId: 'postgres-plugin',
    datasourceConfiguration: {
      url: ''
    }
  }],
  customJSLibList: [],
  pageList: pageList,
  actionList: actionList,
  actionCollectionList: [],
  decryptedFields: {},
  theme: {
    name: 'Default-New',
    displayName: 'Modern',
    isSystemTheme: true,
    config: {
      colors: {
        primaryColor: '#553DE9',
        backgroundColor: '#F8FAFC'
      },
      borderRadius: {
        appBorderRadius: '0.375rem'
      },
      boxShadow: {
        appBoxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      },
      fontFamily: {
        appFont: 'System Default'
      }
    },
    properties: {
      colors: {
        primaryColor: '#553DE9',
        backgroundColor: '#F8FAFC'
      },
      borderRadius: {
        appBorderRadius: '0.375rem'
      },
      boxShadow: {
        appBoxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      },
      fontFamily: {
        appFont: 'System Default'
      }
    },
    stylesheet: {
      BUTTON_WIDGET: { buttonColor: '{{appsmith.theme.colors.primaryColor}}', borderRadius: '{{appsmith.theme.borderRadius.appBorderRadius}}', boxShadow: 'none' },
      TEXT_WIDGET: { fontFamily: '{{appsmith.theme.fontFamily.appFont}}', borderRadius: '{{appsmith.theme.borderRadius.appBorderRadius}}' },
      INPUT_WIDGET_V2: { accentColor: '{{appsmith.theme.colors.primaryColor}}', borderRadius: '{{appsmith.theme.borderRadius.appBorderRadius}}', boxShadow: 'none' },
      SELECT_WIDGET: { accentColor: '{{appsmith.theme.colors.primaryColor}}', borderRadius: '{{appsmith.theme.borderRadius.appBorderRadius}}', boxShadow: 'none' },
      TABLE_WIDGET_V2: { accentColor: '{{appsmith.theme.colors.primaryColor}}', borderRadius: '{{appsmith.theme.borderRadius.appBorderRadius}}', boxShadow: '{{appsmith.theme.boxShadow.appBoxShadow}}' },
      STATBOX_WIDGET: { borderRadius: '{{appsmith.theme.borderRadius.appBorderRadius}}', boxShadow: '{{appsmith.theme.boxShadow.appBoxShadow}}' },
      CHART_WIDGET: { accentColor: '{{appsmith.theme.colors.primaryColor}}', borderRadius: '{{appsmith.theme.borderRadius.appBorderRadius}}', boxShadow: '{{appsmith.theme.boxShadow.appBoxShadow}}', fontFamily: '{{appsmith.theme.fontFamily.appFont}}' },
      CONTAINER_WIDGET: { borderRadius: '{{appsmith.theme.borderRadius.appBorderRadius}}', boxShadow: '{{appsmith.theme.boxShadow.appBoxShadow}}' }
    }
  },
  editModeTheme: {
    name: 'Default-New',
    displayName: 'Modern',
    isSystemTheme: true,
    config: {
      colors: { primaryColor: '#553DE9', backgroundColor: '#F8FAFC' },
      borderRadius: { appBorderRadius: '0.375rem' },
      boxShadow: { appBoxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' },
      fontFamily: { appFont: 'System Default' }
    },
    properties: {
      colors: { primaryColor: '#553DE9', backgroundColor: '#F8FAFC' },
      borderRadius: { appBorderRadius: '0.375rem' },
      boxShadow: { appBoxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' },
      fontFamily: { appFont: 'System Default' }
    },
    stylesheet: {}
  }
};

// Final null check
const finalJson = JSON.stringify(fixNulls(exportObj), null, 2);

// Write to both locations
fs.writeFileSync(path.join(BASE, 'appsmith-export.json'), finalJson);

const outDir = path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const desktop = path.join(outDir, 'surense_fix.json');
fs.writeFileSync(desktop, finalJson);

// Validate
const parsed = JSON.parse(finalJson);
console.log('=== Export Summary ===');
console.log('File size:', (Buffer.byteLength(finalJson) / 1024).toFixed(1), 'KB');
console.log('Pages:', parsed.pageList.length);
parsed.pageList.forEach((p, i) => {
  const name = p.unpublishedPage.name;
  const widgets = p.unpublishedPage.layouts[0].dsl.children?.length || 0;
  const slug = p.unpublishedPage.slug;
  console.log(`  ${i+1}. ${name} (slug: ${slug}) - ${widgets} widgets`);
});
console.log('Actions:', parsed.actionList.length);
console.log('Datasources:', parsed.datasourceList.length);
console.log('exportedApplication.pages:', parsed.exportedApplication.pages.length);
parsed.exportedApplication.pages.forEach(p => {
  console.log(`  - ${p.id} (default: ${p.isDefault})`);
});

// Check for nulls in string fields
let nullCount = 0;
function checkNulls(obj, path = '') {
  if (obj === null) { nullCount++; console.log('  NULL at:', path); return; }
  if (typeof obj !== 'object') return;
  if (Array.isArray(obj)) { obj.forEach((v, i) => checkNulls(v, `${path}[${i}]`)); return; }
  for (const [k, v] of Object.entries(obj)) checkNulls(v, `${path}.${k}`);
}
checkNulls(parsed);
console.log('Null values found:', nullCount);
console.log('Written to:', path.join(BASE, 'appsmith-export.json'));
console.log('Written to:', desktop);
