/**
 * Map Core - Territory state management and rendering logic
 */

var MapCore = (function() {

  /**
   * Process game results to determine current territory ownership
   * @param {Array[]} resultsData - Raw game results (includes header row)
   * @param {Object} startingOwners - Initial territory ownership map
   * @param {string} mapLocation - Filter to this map location
   * @returns {{owners: Object, recentChanges: string[]}} Current owners and recent changes
   */
  function processGameResults(resultsData, startingOwners, mapLocation) {
    // Clone starting owners
    var owners = {};
    for (var key in startingOwners) {
      if (startingOwners.hasOwnProperty(key)) {
        owners[key] = startingOwners[key];
      }
    }

    var recentChanges = [];
    var cols = CONFIG.resultsColumns;

    // Process each game result (skip header row)
    for (var i = 1; i < resultsData.length; i++) {
      var row = resultsData[i];

      // Filter by map location
      var location = row[cols.LOCATION];
      if (location !== mapLocation) {
        continue;
      }

      // Skip draws - no territory change
      var result = row[cols.RESULT];
      if (result === CONFIG.results.DRAW) {
        continue;
      }

      // Determine winner
      var winner = null;
      if (result === CONFIG.results.P1_WIN) {
        winner = row[cols.PLAYER_1];
      } else if (result === CONFIG.results.P2_WIN) {
        winner = row[cols.PLAYER_2];
      }

      // Update territory ownership
      var territory = row[cols.CLAIMED_TERRITORY];
      if (winner && territory) {
        territory = String(territory).trim().toUpperCase();
        owners[territory] = winner;
        recentChanges.push(territory);
      }
    }

    // Keep only last N changes for highlighting
    var highlightCount = CONFIG.display.highlightRecentCount;
    if (recentChanges.length > highlightCount) {
      recentChanges = recentChanges.slice(-highlightCount);
    }

    return {
      owners: owners,
      recentChanges: recentChanges
    };
  }

  /**
   * Build cell render data for the entire map grid
   * @param {Object} owners - Territory to owner mapping
   * @param {Object} pois - Territory to POI name mapping
   * @param {Object} playerColors - Player name to color mapping
   * @param {string[]} recentChanges - Recently changed territories
   * @returns {Array[]} 2D array of cell render objects
   */
  function buildRenderData(owners, pois, playerColors, recentChanges) {
    var grid = [];

    for (var row = 0; row < CONFIG.map.rows; row++) {
      var rowData = [];

      for (var col = 0; col < CONFIG.map.cols; col++) {
        var territory = getCoordinate(col, row);
        var owner = owners[territory];
        var poiName = pois[territory];
        var isRecent = recentChanges.indexOf(territory) !== -1;

        var cellData = {
          territory: territory,
          owner: owner,
          poiName: poiName,
          isPOI: !!poiName,
          isRecent: isRecent,
          color: owner ? (playerColors[owner] || CONFIG.display.neutralColor) : CONFIG.display.neutralColor
        };

        rowData.push(cellData);
      }

      grid.push(rowData);
    }

    return grid;
  }

  /**
   * Render the map grid to a sheet
   * @param {Sheet} sheet - Map sheet to render to
   * @param {Array[]} renderData - Grid of cell render objects
   * @param {string} mapTitle - Title to display above map
   * @param {Object} playerColors - Player name to color mapping
   * @param {string} mapLocation - Map identifier for filtering players
   * @param {Object} playerMaps - Player name to map assignment
   */
  function renderMap(sheet, renderData, mapTitle, playerColors, mapLocation, playerMaps) {
    // Define grid area (starts at row 3, col 2 to leave room for title and labels)
    var gridStartRow = 3;
    var gridStartCol = 2;
    var numRows = CONFIG.map.rows;
    var numCols = CONFIG.map.cols;

    // Build batch arrays for values, backgrounds, and notes
    var values = [];
    var backgrounds = [];
    var notes = [];

    for (var row = 0; row < numRows; row++) {
      var valueRow = [];
      var bgRow = [];
      var noteRow = [];

      for (var col = 0; col < numCols; col++) {
        var cellData = renderData[row][col];

        // Set background color
        bgRow.push(cellData.color);

        // Set cell value and note based on state
        if (cellData.isPOI) {
          valueRow.push(CONFIG.display.poiSymbol);
          if (cellData.owner) {
            noteRow.push('📍 ' + cellData.poiName + '\nOwned by: ' + cellData.owner);
          } else {
            noteRow.push('📍 ' + cellData.poiName + '\nNeutral (unclaimed)');
          }
        } else if (cellData.owner) {
          valueRow.push('');
          noteRow.push('Territory: ' + cellData.territory + '\nOwned by: ' + cellData.owner);
        } else {
          valueRow.push('');
          noteRow.push('');
        }
      }

      values.push(valueRow);
      backgrounds.push(bgRow);
      notes.push(noteRow);
    }

    // Clear and set up the title row
    sheet.getRange(1, 1, 1, numCols + 1).clear();
    sheet.getRange(1, 1, 1, numCols + 1).merge();
    sheet.getRange(1, 1)
      .setValue(mapTitle)
      .setFontSize(18)
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setBackground('#2C3E50')
      .setFontColor('#FFFFFF');

    // Set up column headers (A-N in row 2)
    var colHeaders = [''];
    var letters = 'ABCDEFGHIJKLMN';
    for (var i = 0; i < letters.length; i++) {
      colHeaders.push(letters[i]);
    }
    sheet.getRange(2, 1, 1, colHeaders.length).setValues([colHeaders]);
    sheet.getRange(2, 1, 1, colHeaders.length)
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setBackground('#34495E')
      .setFontColor('#FFFFFF');

    // Set up row headers (1-9 in column 1)
    for (var r = 0; r < numRows; r++) {
      sheet.getRange(gridStartRow + r, 1)
        .setValue(r + 1)
        .setFontWeight('bold')
        .setHorizontalAlignment('center')
        .setBackground('#34495E')
        .setFontColor('#FFFFFF');
    }

    // Get the entire grid range
    var gridRange = sheet.getRange(gridStartRow, gridStartCol, numRows, numCols);

    // Clear first, then flush to ensure it completes
    gridRange.clear();
    SpreadsheetApp.flush();

    // Apply all batch operations
    gridRange.setValues(values);
    gridRange.setBackgrounds(backgrounds);
    gridRange.setNotes(notes);

    // Set formatting
    gridRange.setFontSize(28)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle')
      .setFontColor(CONFIG.display.poiTextColor);

    // Flush to ensure values are written before borders
    SpreadsheetApp.flush();

    // Apply borders (must be done per-cell for varied styles)
    for (var row = 0; row < numRows; row++) {
      for (var col = 0; col < numCols; col++) {
        var cellData = renderData[row][col];
        var cell = sheet.getRange(gridStartRow + row, gridStartCol + col);

        if (cellData.isRecent) {
          cell.setBorder(
            true, true, true, true, false, false,
            CONFIG.display.recentClaimBorderColor,
            SpreadsheetApp.BorderStyle.SOLID_THICK
          );
        } else if (cellData.owner) {
          var borderColor = darkenColor(cellData.color);
          cell.setBorder(
            true, true, true, true, false, false,
            borderColor,
            SpreadsheetApp.BorderStyle.SOLID
          );
        } else {
          cell.setBorder(
            true, true, true, true, false, false,
            '#AAAAAA',
            SpreadsheetApp.BorderStyle.SOLID
          );
        }
      }
    }

    // Set column widths
    sheet.setColumnWidth(1, 30);
    for (var c = 2; c <= numCols + 1; c++) {
      sheet.setColumnWidth(c, CONFIG.map.cellWidth);
    }

    // Set row heights
    sheet.setRowHeight(1, 35);
    sheet.setRowHeight(2, 25);
    for (var r = gridStartRow; r < gridStartRow + numRows; r++) {
      sheet.setRowHeight(r, CONFIG.map.cellHeight);
    }

    // Render legend on the right side
    if (playerColors && playerMaps) {
      renderLegend(sheet, playerColors, playerMaps, mapLocation, gridStartRow, numCols);
    }
  }

  /**
   * Render a legend with player colors on the right side of the map
   * @param {Sheet} sheet - Map sheet
   * @param {Object} playerColors - Player name to color mapping
   * @param {Object} playerMaps - Player name to map assignment
   * @param {string} mapLocation - Current map (TGA or Westgate)
   * @param {number} gridStartRow - Starting row of the grid
   * @param {number} numCols - Number of columns in the grid
   */
  function renderLegend(sheet, playerColors, playerMaps, mapLocation, gridStartRow, numCols) {
    // Legend starts 2 columns after the map grid
    var legendStartCol = numCols + 4; // col 2 (grid start) + 14 (grid) + 2 (gap) = 18
    var legendRow = 2;

    // Get players for this map
    var playersForMap = [];
    for (var name in playerMaps) {
      if (playerMaps.hasOwnProperty(name)) {
        var maps = playerMaps[name];
        // Include player if they're on this map or both maps
        if (maps === mapLocation || maps === CONFIG.locations.BOTH) {
          playersForMap.push({
            name: name,
            color: playerColors[name] || CONFIG.display.neutralColor
          });
        }
      }
    }

    // Sort players alphabetically
    playersForMap.sort(function(a, b) {
      return a.name.localeCompare(b.name);
    });

    // Clear old legend area (allow for up to 30 players)
    var clearRange = sheet.getRange(legendRow, legendStartCol, 32, 2);
    clearRange.clear();

    // Legend title
    sheet.getRange(legendRow, legendStartCol, 1, 2).merge();
    sheet.getRange(legendRow, legendStartCol)
      .setValue('🎮 PLAYERS')
      .setFontSize(12)
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setBackground('#2C3E50')
      .setFontColor('#FFFFFF');

    // Set column widths for legend
    sheet.setColumnWidth(legendStartCol, 30);      // Color swatch column
    sheet.setColumnWidth(legendStartCol + 1, 120); // Name column

    // Render each player
    for (var i = 0; i < playersForMap.length; i++) {
      var player = playersForMap[i];
      var rowNum = legendRow + 1 + i;

      // Color swatch (column 1)
      var swatchCell = sheet.getRange(rowNum, legendStartCol);
      swatchCell.setBackground(player.color);
      swatchCell.setBorder(
        true, true, true, true, false, false,
        darkenColor(player.color),
        SpreadsheetApp.BorderStyle.SOLID
      );

      // Player name (column 2)
      var nameCell = sheet.getRange(rowNum, legendStartCol + 1);
      nameCell.setValue(player.name);
      nameCell.setFontSize(10);
      nameCell.setHorizontalAlignment('left');
      nameCell.setVerticalAlignment('middle');
      nameCell.setBackground('#F8F9FA');
      nameCell.setBorder(
        true, true, true, true, false, false,
        '#CCCCCC',
        SpreadsheetApp.BorderStyle.SOLID
      );

      // Set row height for legend rows
      sheet.setRowHeight(rowNum, 22);
    }
  }

  /**
   * Update a single map (TGA or Westgate)
   * @param {Spreadsheet} ss - Spreadsheet object
   * @param {string} mapLocation - Map identifier
   */
  function updateMap(ss, mapLocation) {
    // Load all required data (batch reads)
    var playerColors = DataService.loadPlayerColors(ss);
    var playerMaps = DataService.loadPlayerMaps(ss);
    var pois = DataService.loadPOIs(ss, mapLocation);
    var startingOwners = DataService.loadStartingTerritories(ss, mapLocation);
    var resultsData = DataService.loadGameResults(ss);

    // Process game results
    var processed = processGameResults(resultsData, startingOwners, mapLocation);

    // Build render data
    var renderData = buildRenderData(
      processed.owners,
      pois,
      playerColors,
      processed.recentChanges
    );

    // Get map sheet and render
    var mapSheet = DataService.getMapSheet(ss, mapLocation);
    if (mapSheet) {
      var title = mapLocation === CONFIG.locations.TGA ? 'TGA Map' : 'Westgate Map';
      renderMap(mapSheet, renderData, title, playerColors, mapLocation, playerMaps);
    }
  }

  /**
   * Update both maps
   * @param {Spreadsheet} ss - Spreadsheet object
   */
  function updateAllMaps(ss) {
    updateMap(ss, CONFIG.locations.TGA);
    updateMap(ss, CONFIG.locations.WESTGATE);
  }

  // Public API
  return {
    processGameResults: processGameResults,
    buildRenderData: buildRenderData,
    renderMap: renderMap,
    updateMap: updateMap,
    updateAllMaps: updateAllMaps
  };
})();
