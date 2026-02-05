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
 * 30 distinguishable colors for player territories
 * Based on colorblind-friendly palettes from mk.bcgsc.ca and additional high-contrast colors
 * Excludes grey, white, black (reserved for UI elements)
 */
var PLAYER_COLORS = [
  '#E6194B',  // Red
  '#3CB44B',  // Green
  '#FFE119',  // Yellow
  '#4363D8',  // Blue
  '#F58231',  // Orange
  '#911EB4',  // Purple
  '#42D4F4',  // Cyan
  '#F032E6',  // Magenta
  '#BFEF45',  // Lime
  '#FABED4',  // Pink
  '#469990',  // Teal
  '#DCBEFF',  // Lavender
  '#9A6324',  // Brown
  '#FFFAC8',  // Beige
  '#800000',  // Maroon
  '#AAFFC3',  // Mint
  '#808000',  // Olive
  '#FFD8B1',  // Apricot
  '#000075',  // Navy
  '#A9A9A9',  // Dark Gray (exception - distinct enough)
  '#E6BEFF',  // Light Purple
  '#9F0162',  // Deep Magenta
  '#009F81',  // Sea Green
  '#00C2F9',  // Sky Blue
  '#FF6E3A',  // Coral
  '#FFC33B',  // Gold
  '#008DF9',  // Azure
  '#8400CD',  // Violet
  '#00FCCF',  // Turquoise
  '#FF5AAF'   // Hot Pink
];

/**
 * Populate the Player Roster sheet with initial data
 */
function populatePlayerRoster(ss) {
  var sheet = DataService.getSheet(ss, CONFIG.sheets.PLAYER_ROSTER);
  sheet.clear();

  // Assign colors from the palette to each player
  var data = [
    ['Player Name', 'Color', 'Maps'],
    ['Oracle', PLAYER_COLORS[0], 'TGA'],
    ['Kori', PLAYER_COLORS[1], 'Both'],
    ['Koen', PLAYER_COLORS[2], 'TGA'],
    ['Justin', PLAYER_COLORS[3], 'Both'],
    ['Dr_Punchwhack', PLAYER_COLORS[4], 'TGA'],
    ['K', PLAYER_COLORS[5], 'TGA'],
    ['VirtualChess64!', PLAYER_COLORS[6], 'TGA'],
    ['Roly', PLAYER_COLORS[7], 'TGA'],
    ['Sarah', PLAYER_COLORS[8], 'Both'],
    ['JlIM', PLAYER_COLORS[9], 'TGA'],
    ['Addsey', PLAYER_COLORS[10], 'Both'],
    ['Sammy', PLAYER_COLORS[11], 'Westgate'],
    ['Scotty', PLAYER_COLORS[12], 'Westgate'],
    ['Laurie', PLAYER_COLORS[13], 'Westgate']
  ];

  DataService.writeData(sheet, data);

  // Format header
  sheet.getRange(1, 1, 1, 3)
    .setFontWeight('bold')
    .setBackground('#2C3E50')
    .setFontColor('#FFFFFF');

  // Add color dropdown validation (column B, starting row 2)
  var colorRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(PLAYER_COLORS, true)
    .setAllowInvalid(true)  // Allow custom hex codes too
    .build();
  sheet.getRange(2, 2, 50, 1).setDataValidation(colorRule);

  // Format color cells with their background colors
  for (var i = 1; i < data.length; i++) {
    var colorValue = data[i][1];
    var cell = sheet.getRange(i + 1, 2);
    cell.setBackground(colorValue);
    cell.setFontColor(getContrastingTextColor(colorValue));
  }

  // Auto-resize columns
  sheet.autoResizeColumns(1, 3);
}

/**
 * Populate Starting Territories sheet
 * Each player gets a 2x2 block from their corner squares
 */
function populateStartingTerritories(ss) {
  var sheet = DataService.getSheet(ss, CONFIG.sheets.STARTING_TERRITORIES);
  sheet.clear();

  var data = [
    ['Territory', 'Owner', 'Map'],
    // TGA territories (2x2 blocks from corner squares)
    // Oracle: A1,B2
    ['A1', 'Oracle', 'TGA'], ['A2', 'Oracle', 'TGA'], ['B1', 'Oracle', 'TGA'], ['B2', 'Oracle', 'TGA'],
    // Kori: E1,F2
    ['E1', 'Kori', 'TGA'], ['E2', 'Kori', 'TGA'], ['F1', 'Kori', 'TGA'], ['F2', 'Kori', 'TGA'],
    // Koen: C3,D4
    ['C3', 'Koen', 'TGA'], ['C4', 'Koen', 'TGA'], ['D3', 'Koen', 'TGA'], ['D4', 'Koen', 'TGA'],
    // Justin: A5,B6
    ['A5', 'Justin', 'TGA'], ['A6', 'Justin', 'TGA'], ['B5', 'Justin', 'TGA'], ['B6', 'Justin', 'TGA'],
    // Dr_Punchwhack: D6,E7
    ['D6', 'Dr_Punchwhack', 'TGA'], ['D7', 'Dr_Punchwhack', 'TGA'], ['E6', 'Dr_Punchwhack', 'TGA'], ['E7', 'Dr_Punchwhack', 'TGA'],
    // K: F8,G9
    ['F8', 'K', 'TGA'], ['F9', 'K', 'TGA'], ['G8', 'K', 'TGA'], ['G9', 'K', 'TGA'],
    // VirtualChess64!: G5,H6
    ['G5', 'VirtualChess64!', 'TGA'], ['G6', 'VirtualChess64!', 'TGA'], ['H5', 'VirtualChess64!', 'TGA'], ['H6', 'VirtualChess64!', 'TGA'],
    // Roly: I2,J3
    ['I2', 'Roly', 'TGA'], ['I3', 'Roly', 'TGA'], ['J2', 'Roly', 'TGA'], ['J3', 'Roly', 'TGA'],
    // Sarah: I7,J8
    ['I7', 'Sarah', 'TGA'], ['I8', 'Sarah', 'TGA'], ['J7', 'Sarah', 'TGA'], ['J8', 'Sarah', 'TGA'],
    // JlIM: K5,L6
    ['K5', 'JlIM', 'TGA'], ['K6', 'JlIM', 'TGA'], ['L5', 'JlIM', 'TGA'], ['L6', 'JlIM', 'TGA'],
    // Addsey: M4,N5
    ['M4', 'Addsey', 'TGA'], ['M5', 'Addsey', 'TGA'], ['N4', 'Addsey', 'TGA'], ['N5', 'Addsey', 'TGA'],

    // Westgate territories (2x2 blocks from corner squares)
    // Sammy: C3,D4
    ['C3', 'Sammy', 'Westgate'], ['C4', 'Sammy', 'Westgate'], ['D3', 'Sammy', 'Westgate'], ['D4', 'Sammy', 'Westgate'],
    // Justin: D6,E7
    ['D6', 'Justin', 'Westgate'], ['D7', 'Justin', 'Westgate'], ['E6', 'Justin', 'Westgate'], ['E7', 'Justin', 'Westgate'],
    // Scotty: F8,G9
    ['F8', 'Scotty', 'Westgate'], ['F9', 'Scotty', 'Westgate'], ['G8', 'Scotty', 'Westgate'], ['G9', 'Scotty', 'Westgate'],
    // Sarah: G5,H6
    ['G5', 'Sarah', 'Westgate'], ['G6', 'Sarah', 'Westgate'], ['H5', 'Sarah', 'Westgate'], ['H6', 'Sarah', 'Westgate'],
    // Kori: I2,J3
    ['I2', 'Kori', 'Westgate'], ['I3', 'Kori', 'Westgate'], ['J2', 'Kori', 'Westgate'], ['J3', 'Kori', 'Westgate'],
    // Laurie: I7,J8
    ['I7', 'Laurie', 'Westgate'], ['I8', 'Laurie', 'Westgate'], ['J7', 'Laurie', 'Westgate'], ['J8', 'Laurie', 'Westgate'],
    // Addsey: K5,L6
    ['K5', 'Addsey', 'Westgate'], ['K6', 'Addsey', 'Westgate'], ['L5', 'Addsey', 'Westgate'], ['L6', 'Addsey', 'Westgate']
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
 * Same POIs for both maps: A2,B8,C4,C6,D1,E6,F1,F3,F5,F9,G4,H6,I3,J6,K8,L3,M2,M4,N8
 */
function populatePOIDefinitions(ss) {
  var sheet = DataService.getSheet(ss, CONFIG.sheets.POI_DEFINITIONS);
  sheet.clear();

  // POI locations (same for both maps)
  var poiLocations = ['A2', 'B8', 'C4', 'C6', 'D1', 'E6', 'F1', 'F3', 'F5', 'F9', 'G4', 'H6', 'I3', 'J6', 'K8', 'L3', 'M2', 'M4', 'N8'];

  var data = [['Territory', 'Map', 'Name']];

  // Add POIs for TGA
  for (var i = 0; i < poiLocations.length; i++) {
    data.push([poiLocations[i], 'TGA', 'POI ' + poiLocations[i]]);
  }

  // Add POIs for Westgate
  for (var i = 0; i < poiLocations.length; i++) {
    data.push([poiLocations[i], 'Westgate', 'POI ' + poiLocations[i]]);
  }

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
