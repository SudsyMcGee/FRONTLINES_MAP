/**
 * Setup - Bootstrap functions for initial configuration
 * Run setupTerritoryControl() once to initialize the spreadsheet
 */

/**
 * Main setup function - run this once to initialize everything
 */
function setupTerritoryControl() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();

  try {
    // Create all required sheets
    createAllSheets(ss);

    // Populate reference data
    populatePlayerRoster(ss);
    populateStartingTerritories(ss);
    populatePOIDefinitions(ss);

    // Set up Game Results sheet
    setupGameResultsSheet(ss);

    // Set up map sheets
    setupMapSheet(ss, CONFIG.sheets.TGA_MAP, 'TGA Map');
    setupMapSheet(ss, CONFIG.sheets.WESTGATE_MAP, 'Westgate Map');

    // Create README
    createReadme(ss);

    // Initial map render
    MapCore.updateAllMaps(ss);

    // Refresh dropdowns
    menuRefreshDropdowns();

    SpreadsheetApp.flush();

    ui.alert(
      '✅ Setup Complete',
      'Frontlines Map has been initialized!\n\n' +
      'Refresh the page to see the Territory Control menu.\n\n' +
      'You can now add battles to the Game Results sheet and click "Update Maps" to see changes.',
      ui.ButtonSet.OK
    );
  } catch (error) {
    ui.alert('❌ Setup Failed', 'Error: ' + error.message, ui.ButtonSet.OK);
    console.error('Setup error:', error);
  }
}

/**
 * Create all required sheets
 */
function createAllSheets(ss) {
  var sheetNames = [
    CONFIG.sheets.TGA_MAP,
    CONFIG.sheets.WESTGATE_MAP,
    CONFIG.sheets.GAME_RESULTS,
    CONFIG.sheets.PLAYER_ROSTER,
    CONFIG.sheets.POI_DEFINITIONS,
    CONFIG.sheets.STARTING_TERRITORIES,
    CONFIG.sheets.README
  ];

  for (var i = 0; i < sheetNames.length; i++) {
    DataService.getOrCreateSheet(ss, sheetNames[i]);
  }
}

/**
 * Populate the Player Roster sheet with initial data
 */
function populatePlayerRoster(ss) {
  var sheet = DataService.getSheet(ss, CONFIG.sheets.PLAYER_ROSTER);
  sheet.clear();

  var data = [
    ['Player Name', 'Color', 'Maps'],
    ['Oracle', '#FF6B6B', 'TGA'],
    ['Kori', '#4ECDC4', 'Both'],
    ['Koen', '#FFE66D', 'TGA'],
    ['Roly', '#95E1D3', 'TGA'],
    ['Addsey', '#F38181', 'Both'],
    ['Justin', '#45B7D1', 'Both'],
    ['Dr_Punchwhack', '#FFA07A', 'TGA'],
    ['ViRtUaL cHeSs 64!', '#98D8C8', 'TGA'],
    ['JlIM', '#FF9AA2', 'TGA'],
    ['Sarah', '#C7CEEA', 'Both'],
    ['K', '#FFB7B2', 'TGA'],
    ['Sammy', '#B4F8C8', 'Westgate'],
    ['Laurie', '#FBE7C6', 'Westgate'],
    ['Scotty', '#A0E7E5', 'Westgate']
  ];

  DataService.writeData(sheet, data);

  // Format header
  sheet.getRange(1, 1, 1, 3)
    .setFontWeight('bold')
    .setBackground('#2C3E50')
    .setFontColor('#FFFFFF');

  // Auto-resize columns
  sheet.autoResizeColumns(1, 3);
}

/**
 * Populate Starting Territories sheet
 */
function populateStartingTerritories(ss) {
  var sheet = DataService.getSheet(ss, CONFIG.sheets.STARTING_TERRITORIES);
  sheet.clear();

  var data = [
    ['Territory', 'Owner', 'Map'],
    // TGA territories
    ['A1', 'Oracle', 'TGA'], ['B1', 'Oracle', 'TGA'], ['A2', 'Oracle', 'TGA'], ['B2', 'Oracle', 'TGA'],
    ['E1', 'Kori', 'TGA'], ['F1', 'Kori', 'TGA'], ['E2', 'Kori', 'TGA'], ['F2', 'Kori', 'TGA'],
    ['C3', 'Koen', 'TGA'], ['D3', 'Koen', 'TGA'], ['C4', 'Koen', 'TGA'], ['D4', 'Koen', 'TGA'],
    ['I2', 'Roly', 'TGA'], ['J2', 'Roly', 'TGA'], ['I3', 'Roly', 'TGA'], ['J3', 'Roly', 'TGA'],
    ['M4', 'Addsey', 'TGA'], ['N4', 'Addsey', 'TGA'], ['M5', 'Addsey', 'TGA'], ['N5', 'Addsey', 'TGA'],
    ['A5', 'Justin', 'TGA'], ['B5', 'Justin', 'TGA'], ['A6', 'Justin', 'TGA'], ['B6', 'Justin', 'TGA'],
    ['D6', 'Dr_Punchwhack', 'TGA'], ['E6', 'Dr_Punchwhack', 'TGA'], ['D7', 'Dr_Punchwhack', 'TGA'], ['E7', 'Dr_Punchwhack', 'TGA'],
    ['F5', 'ViRtUaL cHeSs 64!', 'TGA'], ['G5', 'ViRtUaL cHeSs 64!', 'TGA'], ['F6', 'ViRtUaL cHeSs 64!', 'TGA'], ['G6', 'ViRtUaL cHeSs 64!', 'TGA'],
    ['J5', 'JlIM', 'TGA'], ['K5', 'JlIM', 'TGA'], ['J6', 'JlIM', 'TGA'], ['K6', 'JlIM', 'TGA'],
    ['I7', 'Sarah', 'TGA'], ['J7', 'Sarah', 'TGA'], ['I8', 'Sarah', 'TGA'], ['J8', 'Sarah', 'TGA'],
    ['E8', 'K', 'TGA'], ['F8', 'K', 'TGA'], ['E9', 'K', 'TGA'], ['F9', 'K', 'TGA'],
    // Westgate territories
    ['C3', 'Sammy', 'Westgate'], ['D3', 'Sammy', 'Westgate'], ['C4', 'Sammy', 'Westgate'], ['D4', 'Sammy', 'Westgate'],
    ['I2', 'Kori', 'Westgate'], ['J2', 'Kori', 'Westgate'], ['I3', 'Kori', 'Westgate'], ['J3', 'Kori', 'Westgate'],
    ['D6', 'Justin', 'Westgate'], ['E6', 'Justin', 'Westgate'], ['D7', 'Justin', 'Westgate'], ['E7', 'Justin', 'Westgate'],
    ['F5', 'Sarah', 'Westgate'], ['G5', 'Sarah', 'Westgate'], ['F6', 'Sarah', 'Westgate'], ['G6', 'Sarah', 'Westgate'],
    ['J5', 'Addsey', 'Westgate'], ['K5', 'Addsey', 'Westgate'], ['J6', 'Addsey', 'Westgate'], ['K6', 'Addsey', 'Westgate'],
    ['I7', 'Laurie', 'Westgate'], ['J7', 'Laurie', 'Westgate'], ['I8', 'Laurie', 'Westgate'], ['J8', 'Laurie', 'Westgate'],
    ['E8', 'Scotty', 'Westgate'], ['F8', 'Scotty', 'Westgate'], ['E9', 'Scotty', 'Westgate'], ['F9', 'Scotty', 'Westgate']
  ];

  DataService.writeData(sheet, data);

  // Format header
  sheet.getRange(1, 1, 1, 3)
    .setFontWeight('bold')
    .setBackground('#2C3E50')
    .setFontColor('#FFFFFF');

  sheet.autoResizeColumns(1, 3);
}

/**
 * Populate POI Definitions sheet
 */
function populatePOIDefinitions(ss) {
  var sheet = DataService.getSheet(ss, CONFIG.sheets.POI_DEFINITIONS);
  sheet.clear();

  var data = [
    ['Territory', 'Map', 'Name'],
    // TGA POIs
    ['D1', 'TGA', 'Northern Outpost'],
    ['F3', 'TGA', 'Central Market'],
    ['F4', 'TGA', 'Old Fortress'],
    ['C6', 'TGA', 'Western Shrine'],
    ['H6', 'TGA', 'Eastern Temple'],
    ['L2', 'TGA', 'Mountain Pass'],
    ['L8', 'TGA', 'Southern Ruins'],
    ['M8', 'TGA', 'Coastal Watch'],
    // Westgate POIs
    ['A2', 'Westgate', 'Harbor Gate'],
    ['D1', 'Westgate', 'Trade District'],
    ['F1', 'Westgate', 'Royal Palace'],
    ['F3', 'Westgate', 'Grand Plaza'],
    ['F4', 'Westgate', 'Merchants Guild'],
    ['C6', 'Westgate', 'Artisan Quarter'],
    ['H3', 'Westgate', 'Garrison'],
    ['H6', 'Westgate', 'Temple District'],
    ['L2', 'Westgate', 'Eastern Gate'],
    ['L4', 'Westgate', 'Warehouse Row'],
    ['L8', 'Westgate', 'Shipyard'],
    ['M8', 'Westgate', 'Lighthouse']
  ];

  DataService.writeData(sheet, data);

  // Format header
  sheet.getRange(1, 1, 1, 3)
    .setFontWeight('bold')
    .setBackground('#2C3E50')
    .setFontColor('#FFFFFF');

  sheet.autoResizeColumns(1, 3);
}

/**
 * Set up Game Results sheet with headers
 */
function setupGameResultsSheet(ss) {
  var sheet = DataService.getSheet(ss, CONFIG.sheets.GAME_RESULTS);

  // Only set header if sheet is empty
  if (sheet.getLastRow() === 0) {
    var headers = [[
      'Date',
      'Player 1',
      'Player 2',
      'Result',
      'Location',
      'Claimed Territory',
      'Glory P1',
      'Glory P2',
      'Exploration',
      'Mission Played'
    ]];

    DataService.writeData(sheet, headers);
  }

  // Format header row
  sheet.getRange(1, 1, 1, 10)
    .setFontWeight('bold')
    .setBackground('#2C3E50')
    .setFontColor('#FFFFFF');

  // Freeze header row
  sheet.setFrozenRows(1);

  // Auto-resize columns
  sheet.autoResizeColumns(1, 10);
}

/**
 * Set up a map sheet with basic structure
 */
function setupMapSheet(ss, sheetName, title) {
  var sheet = DataService.getSheet(ss, sheetName);
  sheet.clear();

  // The actual rendering is done by MapCore.renderMap()
  // This just ensures the sheet exists and has proper dimensions

  // Set reasonable dimensions
  var totalCols = CONFIG.map.cols + 1; // +1 for row labels
  var totalRows = CONFIG.map.rows + 2; // +2 for title and column headers

  // Ensure sheet has enough rows and columns
  if (sheet.getMaxColumns() < totalCols) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), totalCols - sheet.getMaxColumns());
  }
  if (sheet.getMaxRows() < totalRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), totalRows - sheet.getMaxRows());
  }
}

/**
 * Create README sheet with instructions
 */
function createReadme(ss) {
  var sheet = DataService.getSheet(ss, CONFIG.sheets.README);
  sheet.clear();

  var content = [
    ['FRONTLINES MAP - TERRITORY CONTROL SYSTEM'],
    [''],
    ['Version 1.0 | Trench Crusade Campaign Tracker'],
    [''],
    ['═══════════════════════════════════════════════════════════════'],
    [''],
    ['📋 ADDING BATTLES'],
    [''],
    ['1. Open the "Game Results" sheet'],
    ['2. Fill in each column:'],
    ['   • Date: When the battle occurred'],
    ['   • Player 1 & 2: Use the dropdown to select players'],
    ['   • Result: P1 Win, P2 Win, or Draw'],
    ['   • Location: TGA or Westgate (which map)'],
    ['   • Claimed Territory: Grid coordinate (e.g., "D4", "M8")'],
    ['   • Glory/Exploration/Mission: Optional tracking fields'],
    [''],
    ['═══════════════════════════════════════════════════════════════'],
    [''],
    ['🗺️ UPDATING MAPS'],
    [''],
    ['• Click: 🗺️ Territory Control → Update Maps'],
    ['• Both TGA and Westgate maps will refresh'],
    ['• The last 3 territory changes get thick black borders'],
    ['• Hover over cells to see ownership details'],
    [''],
    ['═══════════════════════════════════════════════════════════════'],
    [''],
    ['📍 POINTS OF INTEREST (POIs)'],
    [''],
    ['• POIs are marked with the ⌘ symbol'],
    ['• They appear even when unclaimed (neutral)'],
    ['• Hover over them to see the POI name'],
    ['• POI definitions can be edited in "POI Definitions" sheet'],
    [''],
    ['═══════════════════════════════════════════════════════════════'],
    [''],
    ['⚙️ TROUBLESHOOTING'],
    [''],
    ['• Dropdowns not working? Use "Refresh Dropdowns" from the menu'],
    ['• New player? Add them to the "Player Roster" sheet first'],
    ['• Draw results do NOT change territory ownership'],
    ['• Territory format must be: Letter + Number (e.g., A1, N9)'],
    [''],
    ['═══════════════════════════════════════════════════════════════'],
    [''],
    ['🔐 PERMISSIONS'],
    [''],
    ['Each user needs to authorize the script once.'],
    ['After that, it works automatically.'],
    [''],
    ['═══════════════════════════════════════════════════════════════']
  ];

  // Convert to 2D array format
  var data = content.map(function(line) { return [line]; });
  DataService.writeData(sheet, data);

  // Format title
  sheet.getRange(1, 1)
    .setFontSize(16)
    .setFontWeight('bold')
    .setBackground('#2C3E50')
    .setFontColor('#FFFFFF');

  // Set column width
  sheet.setColumnWidth(1, 500);
}
