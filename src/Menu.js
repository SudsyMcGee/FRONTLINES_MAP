/**
 * Menu - UI triggers and user-facing functions
 * These are the entry points called by Google Sheets
 */

/**
 * Creates the custom menu when the spreadsheet opens
 * This is a reserved function name in Apps Script
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🗺️ Territory Control')
    .addItem('Update Maps', 'menuUpdateMaps')
    .addItem('Show Player Roster', 'menuShowRoster')
    .addSeparator()
    .addItem('Refresh Dropdowns', 'menuRefreshDropdowns')
    .addItem('Format Player Colors', 'menuFormatPlayerColors')
    .addSeparator()
    .addItem('Help', 'menuShowHelp')
    .addToUi();
}

/**
 * Trigger that runs when a cell is edited
 * Auto-formats color cells in Player Roster
 */
function onEdit(e) {
  if (!e || !e.range) return;

  var sheet = e.range.getSheet();
  var sheetName = sheet.getName();

  // Only process Player Roster sheet, column B (color column)
  if (sheetName !== CONFIG.sheets.PLAYER_ROSTER) return;
  if (e.range.getColumn() !== 2) return;
  if (e.range.getRow() === 1) return; // Skip header

  var value = e.range.getValue();
  if (value && typeof value === 'string' && value.match(/^#[0-9A-Fa-f]{6}$/)) {
    // Valid hex color - set background and contrasting text
    e.range.setBackground(value);
    e.range.setFontColor(getContrastingTextColor(value));
  }
}

/**
 * Get black or white text color based on background brightness
 */
function getContrastingTextColor(hexColor) {
  var r = parseInt(hexColor.slice(1, 3), 16);
  var g = parseInt(hexColor.slice(3, 5), 16);
  var b = parseInt(hexColor.slice(5, 7), 16);

  // Calculate perceived brightness
  var brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? '#000000' : '#FFFFFF';
}

/**
 * Menu action: Update both maps
 */
function menuUpdateMaps() {
  var ui = SpreadsheetApp.getUi();

  try {
    var ss = SpreadsheetApp.getActive();
    MapCore.updateAllMaps(ss);
    SpreadsheetApp.flush(); // Ensure all changes are written

    ui.alert('✅ Maps Updated', 'Both TGA and Westgate maps have been updated.', ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('❌ Error', 'Failed to update maps: ' + error.message, ui.ButtonSet.OK);
    console.error('Map update error:', error);
  }
}

/**
 * Menu action: Show player roster summary
 */
function menuShowRoster() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();

  try {
    var playerMaps = DataService.loadPlayerMaps(ss);
    var playerColors = DataService.loadPlayerColors(ss);

    var tgaPlayers = [];
    var westgatePlayers = [];
    var bothPlayers = [];

    for (var name in playerMaps) {
      if (playerMaps.hasOwnProperty(name)) {
        var maps = playerMaps[name];
        if (maps === CONFIG.locations.TGA) {
          tgaPlayers.push(name);
        } else if (maps === CONFIG.locations.WESTGATE) {
          westgatePlayers.push(name);
        } else if (maps === CONFIG.locations.BOTH) {
          bothPlayers.push(name);
        }
      }
    }

    var message = '🗺️ PLAYER ROSTER\n\n';
    message += '📍 TGA Only (' + tgaPlayers.length + '):\n';
    message += tgaPlayers.length > 0 ? tgaPlayers.join(', ') : '(none)';
    message += '\n\n';
    message += '📍 Westgate Only (' + westgatePlayers.length + '):\n';
    message += westgatePlayers.length > 0 ? westgatePlayers.join(', ') : '(none)';
    message += '\n\n';
    message += '📍 Both Maps (' + bothPlayers.length + '):\n';
    message += bothPlayers.length > 0 ? bothPlayers.join(', ') : '(none)';

    ui.alert('Player Roster', message, ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('❌ Error', 'Failed to load roster: ' + error.message, ui.ButtonSet.OK);
    console.error('Roster error:', error);
  }
}

/**
 * Menu action: Refresh dropdown validations on Game Results sheet
 */
function menuRefreshDropdowns() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();

  try {
    var resultsSheet = DataService.getSheet(ss, CONFIG.sheets.GAME_RESULTS);
    if (!resultsSheet) {
      ui.alert('❌ Error', 'Game Results sheet not found.', ui.ButtonSet.OK);
      return;
    }

    // Get player names
    var playerNames = DataService.loadPlayerNames(ss);

    // Set up dropdowns
    // Player 1 (column B = 2)
    DataService.setDropdownValidation(resultsSheet, 2, playerNames);

    // Player 2 (column C = 3)
    DataService.setDropdownValidation(resultsSheet, 3, playerNames);

    // Result (column D = 4)
    var resultOptions = [CONFIG.results.P1_WIN, CONFIG.results.P2_WIN, CONFIG.results.DRAW];
    DataService.setDropdownValidation(resultsSheet, 4, resultOptions);

    // Location (column E = 5)
    var locationOptions = [CONFIG.locations.TGA, CONFIG.locations.WESTGATE];
    DataService.setDropdownValidation(resultsSheet, 5, locationOptions);

    ui.alert('✅ Dropdowns Refreshed', 'Data validation dropdowns have been updated.', ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('❌ Error', 'Failed to refresh dropdowns: ' + error.message, ui.ButtonSet.OK);
    console.error('Dropdown error:', error);
  }
}

/**
 * Menu action: Format all player color cells
 */
function menuFormatPlayerColors() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActive();

  try {
    var rosterSheet = DataService.getSheet(ss, CONFIG.sheets.PLAYER_ROSTER);
    if (!rosterSheet) {
      ui.alert('❌ Error', 'Player Roster sheet not found.', ui.ButtonSet.OK);
      return;
    }

    var data = rosterSheet.getDataRange().getValues();
    var colorColumn = 2; // Column B

    var formatted = 0;
    for (var i = 1; i < data.length; i++) {
      var colorValue = data[i][1]; // Column B (0-indexed = 1)
      if (colorValue && typeof colorValue === 'string' && colorValue.match(/^#[0-9A-Fa-f]{6}$/)) {
        var cell = rosterSheet.getRange(i + 1, colorColumn);
        cell.setBackground(colorValue);
        cell.setFontColor(getContrastingTextColor(colorValue));
        formatted++;
      }
    }

    ui.alert('✅ Colors Formatted', 'Applied background colors to ' + formatted + ' player(s).', ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('❌ Error', 'Failed to format colors: ' + error.message, ui.ButtonSet.OK);
    console.error('Format colors error:', error);
  }
}

/**
 * Menu action: Show help information
 */
function menuShowHelp() {
  var ui = SpreadsheetApp.getUi();

  var helpText = '🗺️ FRONTLINES MAP - HELP\n\n';
  helpText += '📝 ADDING BATTLES:\n';
  helpText += '1. Go to the "Game Results" sheet\n';
  helpText += '2. Fill in: Date, Players, Result, Location, Territory\n';
  helpText += '3. Use dropdowns for Player, Result, and Location\n\n';
  helpText += '🔄 UPDATING MAPS:\n';
  helpText += 'Click "Update Maps" to refresh both maps\n';
  helpText += 'Recent claims (last 3) get thick black borders\n\n';
  helpText += '📍 POINTS OF INTEREST:\n';
  helpText += 'POIs show the ⌘ symbol\n';
  helpText += 'Hover over cells to see territory info\n\n';
  helpText += '⚙️ TROUBLESHOOTING:\n';
  helpText += '- Use "Refresh Dropdowns" if player list changes\n';
  helpText += '- Draws do not change territory ownership\n';
  helpText += '- Territory format: Column + Row (e.g., "D4", "M8")';

  ui.alert('Help', helpText, ui.ButtonSet.OK);
}
