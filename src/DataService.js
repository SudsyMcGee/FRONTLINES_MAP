/**
 * Data Service - All Google Sheets read/write operations
 * Centralized to enable batch operations and caching
 */

var DataService = (function() {

  /**
   * Get or create a sheet by name
   * @param {Spreadsheet} ss - Spreadsheet object
   * @param {string} name - Sheet name
   * @returns {Sheet} Sheet object
   */
  function getOrCreateSheet(ss, name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    return sheet;
  }

  /**
   * Get sheet by name, returns null if not found
   * @param {Spreadsheet} ss - Spreadsheet object
   * @param {string} name - Sheet name
   * @returns {Sheet|null} Sheet object or null
   */
  function getSheet(ss, name) {
    return ss.getSheetByName(name);
  }

  /**
   * Read all data from a sheet (batch read)
   * @param {Sheet} sheet - Sheet object
   * @returns {Array[]} 2D array of values
   */
  function readAllData(sheet) {
    if (!sheet) {
      return [];
    }
    var range = sheet.getDataRange();
    if (range.getNumRows() === 0) {
      return [];
    }
    return range.getValues();
  }

  /**
   * Write data to a sheet starting at a position (batch write)
   * @param {Sheet} sheet - Sheet object
   * @param {Array[]} data - 2D array of values
   * @param {number} [startRow=1] - Starting row (1-based)
   * @param {number} [startCol=1] - Starting column (1-based)
   */
  function writeData(sheet, data, startRow, startCol) {
    if (!sheet || !data || data.length === 0) {
      return;
    }
    startRow = startRow || 1;
    startCol = startCol || 1;

    var numRows = data.length;
    var numCols = data[0].length;

    sheet.getRange(startRow, startCol, numRows, numCols).setValues(data);
  }

  /**
   * Load player roster as a name-to-color lookup
   * @param {Spreadsheet} ss - Spreadsheet object
   * @returns {Object} Map of player name to hex color
   */
  function loadPlayerColors(ss) {
    var sheet = getSheet(ss, CONFIG.sheets.PLAYER_ROSTER);
    var data = readAllData(sheet);
    return createLookup(data, 0, 1); // name -> color
  }

  /**
   * Load player roster as a name-to-maps lookup
   * @param {Spreadsheet} ss - Spreadsheet object
   * @returns {Object} Map of player name to maps (TGA/Westgate/Both)
   */
  function loadPlayerMaps(ss) {
    var sheet = getSheet(ss, CONFIG.sheets.PLAYER_ROSTER);
    var data = readAllData(sheet);
    return createLookup(data, 0, 2); // name -> maps
  }

  /**
   * Load all player names
   * @param {Spreadsheet} ss - Spreadsheet object
   * @returns {string[]} Array of player names
   */
  function loadPlayerNames(ss) {
    var sheet = getSheet(ss, CONFIG.sheets.PLAYER_ROSTER);
    var data = readAllData(sheet);
    var names = [];

    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        names.push(data[i][0]);
      }
    }

    return names;
  }

  /**
   * Load POI definitions for a specific map
   * @param {Spreadsheet} ss - Spreadsheet object
   * @param {string} mapLocation - Map identifier (TGA or Westgate)
   * @returns {Object} Map of territory to POI name
   */
  function loadPOIs(ss, mapLocation) {
    var sheet = getSheet(ss, CONFIG.sheets.POI_DEFINITIONS);
    var data = readAllData(sheet);
    // Use territory lookup to normalize keys (uppercase, trimmed)
    return createTerritoryLookup(data, 0, 2, 1, mapLocation); // territory -> name, filtered by map
  }

  /**
   * Load starting territories for a specific map
   * @param {Spreadsheet} ss - Spreadsheet object
   * @param {string} mapLocation - Map identifier (TGA or Westgate)
   * @returns {Object} Map of territory to owner name
   */
  function loadStartingTerritories(ss, mapLocation) {
    var sheet = getSheet(ss, CONFIG.sheets.STARTING_TERRITORIES);
    var data = readAllData(sheet);
    // Use territory lookup to normalize keys (uppercase, trimmed)
    return createTerritoryLookup(data, 0, 1, 2, mapLocation); // territory -> owner, filtered by map
  }

  /**
   * Load game results
   * @param {Spreadsheet} ss - Spreadsheet object
   * @returns {Array[]} Raw game results data (includes header)
   */
  function loadGameResults(ss) {
    var sheet = getSheet(ss, CONFIG.sheets.GAME_RESULTS);
    return readAllData(sheet);
  }

  /**
   * Get the map sheet for a location
   * @param {Spreadsheet} ss - Spreadsheet object
   * @param {string} mapLocation - Map identifier (TGA or Westgate)
   * @returns {Sheet|null} Map sheet
   */
  function getMapSheet(ss, mapLocation) {
    var sheetName = mapLocation === CONFIG.locations.TGA
      ? CONFIG.sheets.TGA_MAP
      : CONFIG.sheets.WESTGATE_MAP;
    return getSheet(ss, sheetName);
  }

  /**
   * Set up data validation (dropdown) for a column
   * @param {Sheet} sheet - Sheet object
   * @param {number} col - Column number (1-based)
   * @param {string[]} values - Allowed values
   * @param {number} [startRow=2] - Starting row
   * @param {number} [numRows=100] - Number of rows to apply validation
   */
  function setDropdownValidation(sheet, col, values, startRow, numRows) {
    startRow = startRow || 2;
    numRows = numRows || 100;

    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(values, true)
      .setAllowInvalid(false)
      .build();

    sheet.getRange(startRow, col, numRows, 1).setDataValidation(rule);
  }

  // Public API
  return {
    getOrCreateSheet: getOrCreateSheet,
    getSheet: getSheet,
    readAllData: readAllData,
    writeData: writeData,
    loadPlayerColors: loadPlayerColors,
    loadPlayerMaps: loadPlayerMaps,
    loadPlayerNames: loadPlayerNames,
    loadPOIs: loadPOIs,
    loadStartingTerritories: loadStartingTerritories,
    loadGameResults: loadGameResults,
    getMapSheet: getMapSheet,
    setDropdownValidation: setDropdownValidation
  };
})();
