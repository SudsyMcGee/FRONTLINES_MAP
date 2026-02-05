// ============================================================================
// CONFIGURATION
// ============================================================================

var CONFIG = {
  mapRows: 9,
  mapCols: 14,
  highlightRecent: 3,
  sheetNames: {
    tgaMap: 'TGA Map',
    westgateMap: 'Westgate Map',
    gameResults: 'Game Results',
    playerRoster: 'Player Roster',
    poiDefs: 'POI Definitions',
    startingTerritories: 'Starting Territories',
    readme: 'README'
  }
};

// ============================================================================
// MENU - Simple direct calls
// ============================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🗺️ Territory Control')
    .addItem('Update Maps', 'updateAllMaps')
    .addItem('Show Player Roster', 'showRoster')
    .addToUi();
}

function updateAllMaps() {
  var ss = SpreadsheetApp.getActive();
  updateSingleMap(ss, 'TGA');
  updateSingleMap(ss, 'Westgate');
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('✅ Maps updated successfully!');
}

function showRoster() {
  var ss = SpreadsheetApp.getActive();
  var rosterSheet = ss.getSheetByName(CONFIG.sheetNames.playerRoster);
  var data = rosterSheet.getDataRange().getValues();
  
  var tgaPlayers = [];
  var westgatePlayers = [];
  var bothPlayers = [];
  
  for (var i = 1; i < data.length; i++) {
    var name = data[i][0];
    var maps = data[i][2];
    
    if (maps === 'TGA') tgaPlayers.push(name);
    else if (maps === 'Westgate') westgatePlayers.push(name);
    else if (maps === 'Both') bothPlayers.push(name);
  }
  
  var message = '🗺️ PLAYER ROSTER\n\n';
  message += '📍 TGA Only (' + tgaPlayers.length + '):\n' + tgaPlayers.join(', ') + '\n\n';
  message += '📍 Westgate Only (' + westgatePlayers.length + '):\n' + westgatePlayers.join(', ') + '\n\n';
  message += '📍 Both Maps (' + bothPlayers.length + '):\n' + bothPlayers.join(', ');
  
  SpreadsheetApp.getUi().alert(message);
}

// ============================================================================
// CORE MAP UPDATE LOGIC
// ============================================================================

function updateSingleMap(ss, mapLocation) {
  var mapSheet = ss.getSheetByName(
    mapLocation === 'TGA' ? CONFIG.sheetNames.tgaMap : CONFIG.sheetNames.westgateMap
  );
  var rosterSheet = ss.getSheetByName(CONFIG.sheetNames.playerRoster);
  var poiSheet = ss.getSheetByName(CONFIG.sheetNames.poiDefs);
  var startSheet = ss.getSheetByName(CONFIG.sheetNames.startingTerritories);
  var resultsSheet = ss.getSheetByName(CONFIG.sheetNames.gameResults);
  
  // Build color lookup
  var rosterData = rosterSheet.getDataRange().getValues();
  var nameToColor = {};
  for (var i = 1; i < rosterData.length; i++) {
    nameToColor[rosterData[i][0]] = rosterData[i][1];
  }
  
  // Build POI lookup for this map
  var poiData = poiSheet.getDataRange().getValues();
  var poiSymbols = {};
  for (var i = 1; i < poiData.length; i++) {
    if (poiData[i][1] === mapLocation) {
      poiSymbols[poiData[i][0]] = poiData[i][2];
    }
  }
  
  // Load starting territories for this map
  var startData = startSheet.getDataRange().getValues();
  var territoryOwners = {};
  for (var i = 1; i < startData.length; i++) {
    if (startData[i][2] === mapLocation) {
      territoryOwners[startData[i][0]] = startData[i][1];
    }
  }
  
  // Process game results for this map
  var resultsData = resultsSheet.getDataRange().getValues();
  var recentChanges = [];
  
  for (var i = 1; i < resultsData.length; i++) {
    var location = resultsData[i][4];
    if (location !== mapLocation) continue;
    
    var result = resultsData[i][3];
    if (result === 'Draw') continue;
    
    var territory = resultsData[i][5];
    var winner;
    
    if (result === 'P1 Win') {
      winner = resultsData[i][1];
    } else if (result === 'P2 Win') {
      winner = resultsData[i][2];
    }
    
    if (winner && territory) {
      territoryOwners[territory] = winner;
      recentChanges.push(territory);
    }
  }
  
  // Keep only last N changes
  if (recentChanges.length > CONFIG.highlightRecent) {
    recentChanges = recentChanges.slice(-CONFIG.highlightRecent);
  }
  
  // Clear and render map
  var range = mapSheet.getRange(2, 2, CONFIG.mapRows, CONFIG.mapCols);
  range.clear();
  range.setBackground('#CCCCCC');
  range.setFontColor('white');
  range.setFontSize(28);
  range.setHorizontalAlignment('center');
  range.setVerticalAlignment('middle');
  
  // Render each cell
  for (var row = 0; row < CONFIG.mapRows; row++) {
    for (var col = 0; col < CONFIG.mapCols; col++) {
      var territory = getCoord(col, row);
      var owner = territoryOwners[territory];
      var cell = mapSheet.getRange(row + 2, col + 2);
      
      if (owner) {
        var color = nameToColor[owner] || '#CCCCCC';
        cell.setBackground(color);
        
        if (poiSymbols[territory]) {
          cell.setValue('⌘');
          cell.setNote('📍 ' + poiSymbols[territory] + '\nOwned by: ' + owner);
        } else {
          cell.setValue('');
          cell.setNote('Territory: ' + territory + '\nOwned by: ' + owner);
        }
        
        // Border
        var borderColor = darkenColor(color);
        cell.setBorder(true, true, true, true, true, true, borderColor, SpreadsheetApp.BorderStyle.SOLID);
        
        // Recent claim highlight
        if (recentChanges.indexOf(territory) !== -1) {
          cell.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID_THICK);
        }
      } else {
        cell.setBackground('#CCCCCC');
        cell.setValue('');
        cell.setNote('');
      }
    }
  }
}

// ============================================================================
// SETUP FUNCTION (Run once manually from script editor)
// ============================================================================

function setupTerritoryControl() {
  var ss = SpreadsheetApp.getActive();
  
  // Create sheets
  createSheet(ss, CONFIG.sheetNames.tgaMap);
  createSheet(ss, CONFIG.sheetNames.westgateMap);
  createSheet(ss, CONFIG.sheetNames.gameResults);
  createSheet(ss, CONFIG.sheetNames.playerRoster);
  createSheet(ss, CONFIG.sheetNames.poiDefs);
  createSheet(ss, CONFIG.sheetNames.startingTerritories);
  createSheet(ss, CONFIG.sheetNames.readme);
  
  // Populate Player Roster
  var rosterSheet = ss.getSheetByName(CONFIG.sheetNames.playerRoster);
  var rosterData = [
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
  rosterSheet.getRange(1, 1, rosterData.length, 3).setValues(rosterData);
  
  // Populate Starting Territories
  var startSheet = ss.getSheetByName(CONFIG.sheetNames.startingTerritories);
  var startData = [
    ['Territory', 'Owner', 'Map'],
    // TGA
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
    // Westgate
    ['C3', 'Sammy', 'Westgate'], ['D3', 'Sammy', 'Westgate'], ['C4', 'Sammy', 'Westgate'], ['D4', 'Sammy', 'Westgate'],
    ['I2', 'Kori', 'Westgate'], ['J2', 'Kori', 'Westgate'], ['I3', 'Kori', 'Westgate'], ['J3', 'Kori', 'Westgate'],
    ['D6', 'Justin', 'Westgate'], ['E6', 'Justin', 'Westgate'], ['D7', 'Justin', 'Westgate'], ['E7', 'Justin', 'Westgate'],
    ['F5', 'Sarah', 'Westgate'], ['G5', 'Sarah', 'Westgate'], ['F6', 'Sarah', 'Westgate'], ['G6', 'Sarah', 'Westgate'],
    ['J5', 'Addsey', 'Westgate'], ['K5', 'Addsey', 'Westgate'], ['J6', 'Addsey', 'Westgate'], ['K6', 'Addsey', 'Westgate'],
    ['I7', 'Laurie', 'Westgate'], ['J7', 'Laurie', 'Westgate'], ['I8', 'Laurie', 'Westgate'], ['J8', 'Laurie', 'Westgate'],
    ['E8', 'Scotty', 'Westgate'], ['F8', 'Scotty', 'Westgate'], ['E9', 'Scotty', 'Westgate'], ['F9', 'Scotty', 'Westgate']
  ];
  startSheet.getRange(1, 1, startData.length, 3).setValues(startData);
  
  // Populate POI Definitions
  var poiSheet = ss.getSheetByName(CONFIG.sheetNames.poiDefs);
  var poiData = [
    ['Territory', 'Map', 'Name'],
    ['D1', 'TGA', 'POI 1'], ['F3', 'TGA', 'POI 2'], ['F4', 'TGA', 'POI 3'],
    ['C6', 'TGA', 'POI 4'], ['H6', 'TGA', 'POI 5'], ['L2', 'TGA', 'POI 6'],
    ['L8', 'TGA', 'POI 7'], ['M8', 'TGA', 'POI 8'],
    ['A2', 'Westgate', 'POI 1'], ['D1', 'Westgate', 'POI 2'], ['F1', 'Westgate', 'POI 3'],
    ['F3', 'Westgate', 'POI 4'], ['F4', 'Westgate', 'POI 5'], ['C6', 'Westgate', 'POI 6'],
    ['H3', 'Westgate', 'POI 7'], ['H6', 'Westgate', 'POI 8'], ['L2', 'Westgate', 'POI 9'],
    ['L4', 'Westgate', 'POI 10'], ['L8', 'Westgate', 'POI 11'], ['M8', 'Westgate', 'POI 12']
  ];
  poiSheet.getRange(1, 1, poiData.length, 3).setValues(poiData);
  
  // Setup Game Results
  var resultsSheet = ss.getSheetByName(CONFIG.sheetNames.gameResults);
  var resultsHeader = [['Date', 'Player 1', 'Player 2', 'Result', 'Location', 'Claimed Territory', 'Glory P1', 'Glory P2', 'Exploration', 'Mission Played']];
  resultsSheet.getRange(1, 1, 1, 10).setValues(resultsHeader);
  
  // Setup map grids
  setupMapGrid(ss, CONFIG.sheetNames.tgaMap);
  setupMapGrid(ss, CONFIG.sheetNames.westgateMap);
  
  // README
  var readmeSheet = ss.getSheetByName(CONFIG.sheetNames.readme);
  var readme = [
    ['DUAL TERRITORY CONTROL SYSTEM - INSTRUCTIONS'],
    [''],
    ['1. ADDING BATTLES:'],
    ['   - Copy your battle data into the "Game Results" sheet'],
    ['   - Format: Date, Player 1, Player 2, Result, Location, Claimed Territory, ...'],
    ['   - Location must be "TGA" or "Westgate"'],
    ['   - Result must be "P1 Win", "P2 Win", or "Draw"'],
    [''],
    ['2. UPDATING MAPS:'],
    ['   - Click: 🗺️ Territory Control → Update Maps'],
    ['   - Both maps will update based on Location column'],
    ['   - Recent claims (last 3) get thick black borders'],
    [''],
    ['3. VIEWING ROSTER:'],
    ['   - Click: 🗺️ Territory Control → Show Player Roster'],
    [''],
    ['4. IMPORTANT NOTES:'],
    ['   - POIs show ⌘ symbol regardless of owner'],
    ['   - Unclaimed territories are grey'],
    ['   - Player names preserved exactly (including dashes)'],
    ['   - Draw results skip territorial changes'],
    [''],
    ['5. FIRST TIME USERS:'],
    ['   - Each person needs to authorize once when clicking Update Maps'],
    ['   - After that it will work automatically']
  ];
  readmeSheet.getRange(1, 1, readme.length, 1).setValues(readme);
  
  SpreadsheetApp.getUi().alert('Setup complete! Refresh the page to see the menu.');
}

function setupMapGrid(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  
  // Column headers (A-N)
  var colHeaders = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
  sheet.getRange(1, 1, 1, 15).setValues([colHeaders]);
  
  // Row headers (1-9)
  for (var i = 1; i <= CONFIG.mapRows; i++) {
    sheet.getRange(i + 1, 1).setValue(i);
  }
  
  // Format
  sheet.getRange(1, 1, 1, 15).setFontWeight('bold').setHorizontalAlignment('center');
  sheet.getRange(2, 1, CONFIG.mapRows, 1).setFontWeight('bold').setHorizontalAlignment('center');
  sheet.setColumnWidth(1, 30);
  for (var i = 2; i <= 15; i++) {
    sheet.setColumnWidth(i, 50);
  }
  for (var i = 2; i <= CONFIG.mapRows + 1; i++) {
    sheet.setRowHeight(i, 50);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createSheet(ss, name) {
  if (!ss.getSheetByName(name)) {
    ss.insertSheet(name);
  }
}

function getCoord(col, row) {
  var letters = 'ABCDEFGHIJKLMN';
  return letters[col] + (row + 1);
}

function darkenColor(hex) {
  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);
  
  r = Math.floor(r * 0.7);
  g = Math.floor(g * 0.7);
  b = Math.floor(b * 0.7);
  
  return '#' + 
    ('0' + r.toString(16)).slice(-2) +
    ('0' + g.toString(16)).slice(-2) +
    ('0' + b.toString(16)).slice(-2);
}