const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function readJSON(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function listDirEntries(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

/**
 * For a given page's widgets directory, read all widget JSON files
 * and return them organized for nesting.
 *
 * Structure on disk:
 *   widgets/
 *     Input_Search.json          <- top-level widget (parentId: "0")
 *     Table_Adi.json             <- top-level widget (parentId: "0")
 *     Stat_TotalLeads/           <- subdirectory = STATBOX_WIDGET group
 *       Stat_TotalLeads.json     <- the parent STATBOX_WIDGET container
 *       Txt_TotalLeads_Label.json <- child TEXT_WIDGET (parentId = canvas widgetId)
 *       Txt_TotalLeads_Value.json <- child TEXT_WIDGET (parentId = canvas widgetId)
 */
function loadWidgetsForPage(widgetsDir) {
  const topLevelWidgets = [];
  const entries = listDirEntries(widgetsDir);

  for (const entry of entries) {
    const fullPath = path.join(widgetsDir, entry.name);

    if (!entry.isDirectory()) {
      // Top-level widget file (e.g., Input_Search.json, Table_Adi.json)
      if (entry.name.endsWith('.json')) {
        const widget = readJSON(fullPath);
        topLevelWidgets.push(widget);
      }
    } else {
      // Subdirectory => STATBOX_WIDGET group
      const subDir = fullPath;
      const subEntries = listDirEntries(subDir);

      let containerWidget = null;
      const childWidgets = [];

      for (const subEntry of subEntries) {
        if (!subEntry.name.endsWith('.json')) continue;
        const subFilePath = path.join(subDir, subEntry.name);
        const widgetData = readJSON(subFilePath);

        // The container file has the same name as the directory
        // e.g., Stat_TotalLeads/Stat_TotalLeads.json
        const expectedContainerName = entry.name + '.json';
        if (subEntry.name === expectedContainerName) {
          containerWidget = widgetData;
        } else {
          childWidgets.push(widgetData);
        }
      }

      if (containerWidget) {
        // The container has a children array with one CANVAS_WIDGET.
        // Put the Label and Value TEXT_WIDGETs inside that CANVAS_WIDGET's children.
        if (containerWidget.children && containerWidget.children.length > 0) {
          const canvasWidget = containerWidget.children[0];
          if (!canvasWidget.children) {
            canvasWidget.children = [];
          }
          // Sort child widgets by topRow for consistent ordering
          childWidgets.sort((a, b) => (a.topRow || 0) - (b.topRow || 0));
          canvasWidget.children = childWidgets;
        }
        topLevelWidgets.push(containerWidget);
      } else {
        // Fallback: if no container found, just add all widgets as top-level
        console.warn(`Warning: No container widget found in subdirectory ${entry.name}`);
        topLevelWidgets.push(...childWidgets);
      }
    }
  }

  return topLevelWidgets;
}

/**
 * Read all query metadata.json files for a page and return as action list entries.
 */
function loadQueriesForPage(queriesDir) {
  const actions = [];
  const entries = listDirEntries(queriesDir);

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const metadataPath = path.join(queriesDir, entry.name, 'metadata.json');
    if (!fs.existsSync(metadataPath)) continue;

    const metadata = readJSON(metadataPath);

    // Build the action list entry from the metadata
    const action = {
      id: metadata.id,
      gitSyncId: metadata.gitSyncId,
      pluginId: metadata.pluginId,
      pluginType: metadata.pluginType,
      unpublishedAction: metadata.unpublishedAction
    };

    actions.push(action);
  }

  return actions;
}

function buildExport() {
  // 1. Read top-level files
  const applicationJson = readJSON(path.join(ROOT, 'application.json'));
  const metadataJson = readJSON(path.join(ROOT, 'metadata.json'));
  const themeJson = readJSON(path.join(ROOT, 'theme.json'));

  // 2. Process each page
  const pageNames = ['Page1', 'Page2', 'Page3', 'Page4'];
  const pageList = [];
  const allActions = [];

  for (const pageName of pageNames) {
    const pageDir = path.join(ROOT, 'pages', pageName);
    const pageJsonPath = path.join(pageDir, `${pageName}.json`);
    const widgetsDir = path.join(pageDir, 'widgets');
    const queriesDir = path.join(pageDir, 'queries');

    // Read the page JSON
    const pageJson = readJSON(pageJsonPath);

    // Load and nest widgets into the DSL
    const widgets = loadWidgetsForPage(widgetsDir);

    // Sort widgets by topRow for consistent layout ordering
    widgets.sort((a, b) => (a.topRow || 0) - (b.topRow || 0));

    // The DSL's MainContainer (widgetId "0") gets children
    const dsl = pageJson.unpublishedPage.layouts[0].dsl;
    dsl.children = widgets;

    // Build the page object for the export (include both published and unpublished)
    const pageObj = {
      ...pageJson,
      publishedPage: JSON.parse(JSON.stringify(pageJson.unpublishedPage))
    };

    pageList.push(pageObj);

    // Load queries for this page
    const queries = loadQueriesForPage(queriesDir);
    allActions.push(...queries);
  }

  // 3. Build the full theme structure
  const fullTheme = {
    ...themeJson,
    config: {
      colors: {
        primaryColor: "#1976D2",
        backgroundColor: "#F8FAFC"
      },
      borderRadius: {
        appBorderRadius: {
          none: "0px",
          M: "0.375rem",
          L: "1.5rem"
        }
      },
      boxShadow: {
        appBoxShadow: {
          none: "none",
          S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
        }
      },
      fontFamily: {
        appFont: "System Default"
      }
    },
    properties: {
      colors: {
        primaryColor: "#1976D2",
        backgroundColor: "#F8FAFC"
      },
      borderRadius: {
        appBorderRadius: "0.375rem"
      },
      boxShadow: {
        appBoxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
      },
      fontFamily: {
        appFont: "System Default"
      }
    },
    stylesheet: {
      BUTTON_WIDGET: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "none"
      },
      TEXT_WIDGET: {
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}"
      },
      TABLE_WIDGET_V2: {
        accentColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
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
        }
      },
      INPUT_WIDGET_V2: {
        accentColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "none"
      },
      SELECT_WIDGET: {
        accentColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "none"
      },
      CHART_WIDGET: {
        accentColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}"
      },
      STATBOX_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}"
      },
      CONTAINER_WIDGET: {
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}"
      }
    }
  };

  // 4. Assemble the export
  const exportObj = {
    artifactJsonType: metadataJson.artifactJsonType,
    clientSchemaVersion: metadataJson.clientSchemaVersion,
    serverSchemaVersion: metadataJson.serverSchemaVersion,
    fileFormatVersion: metadataJson.fileFormatVersion,
    exportedApplication: {
      ...applicationJson,
      name: "Marvihim CRM",
      gitApplicationMetadata: null
    },
    datasourceList: [
      {
        name: "Supabase",
        pluginId: "postgres-plugin",
        datasourceConfiguration: {
          url: ""
        }
      }
    ],
    pageList: pageList,
    actionList: allActions,
    actionCollectionList: [],
    customJSLibList: [],
    theme: fullTheme,
    editModeTheme: fullTheme
  };

  return exportObj;
}

// Run
try {
  console.log('Starting Appsmith export generation...');
  const exportData = buildExport();

  const outputPath = path.join(ROOT, 'appsmith-export.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');

  // Verify
  const stats = fs.statSync(outputPath);
  const verifyData = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));

  console.log(`Export written to: ${outputPath}`);
  console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`Pages: ${verifyData.pageList.length}`);
  console.log(`Actions (queries): ${verifyData.actionList.length}`);

  // Print per-page stats
  for (const page of verifyData.pageList) {
    const pageName = page.unpublishedPage.name;
    const dsl = page.unpublishedPage.layouts[0].dsl;
    const widgetCount = dsl.children ? dsl.children.length : 0;

    // Count nested widgets (inside statboxes)
    let nestedCount = 0;
    if (dsl.children) {
      for (const w of dsl.children) {
        if (w.children) {
          for (const canvas of w.children) {
            if (canvas.children) {
              nestedCount += canvas.children.length;
            }
          }
        }
      }
    }

    const pageActions = verifyData.actionList.filter(a => a.unpublishedAction.pageId === page.unpublishedPage.layouts[0].dsl.widgetId ? false : true);
    console.log(`  Page "${pageName}": ${widgetCount} top-level widgets, ${nestedCount} nested widgets`);
  }

  // Verify JSON validity
  console.log('\nJSON validation: PASSED');
  console.log('Export generation complete!');

} catch (err) {
  console.error('Error generating export:', err);
  process.exit(1);
}
