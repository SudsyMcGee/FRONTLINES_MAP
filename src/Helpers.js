/**
 * Utility functions for Frontlines Map
 * Pure functions with no side effects
 */

/**
 * Convert column index and row index to territory coordinate
 * @param {number} col - Column index (0-based, 0=A, 13=N)
 * @param {number} row - Row index (0-based)
 * @returns {string} Territory coordinate (e.g., "D4", "M8")
 */
function getCoordinate(col, row) {
  var letters = 'ABCDEFGHIJKLMN';
  if (col < 0 || col >= letters.length) {
    return null;
  }
  return letters[col] + (row + 1);
}

/**
 * Parse territory coordinate to column and row indices
 * @param {string} coord - Territory coordinate (e.g., "D4")
 * @returns {{col: number, row: number}|null} Indices or null if invalid
 */
function parseCoordinate(coord) {
  if (!coord || typeof coord !== 'string' || coord.length < 2) {
    return null;
  }

  var letters = 'ABCDEFGHIJKLMN';
  var colLetter = coord.charAt(0).toUpperCase();
  var rowNum = parseInt(coord.substring(1), 10);

  var col = letters.indexOf(colLetter);
  if (col === -1 || isNaN(rowNum) || rowNum < 1 || rowNum > CONFIG.map.rows) {
    return null;
  }

  return { col: col, row: rowNum - 1 };
}

/**
 * Darken a hex color by a percentage
 * @param {string} hex - Hex color code (e.g., "#FF6B6B")
 * @param {number} [factor=0.7] - Darkening factor (0-1, lower = darker)
 * @returns {string} Darkened hex color
 */
function darkenColor(hex, factor) {
  factor = factor || 0.7;

  // Handle invalid input
  if (!hex || typeof hex !== 'string' || hex.charAt(0) !== '#') {
    return '#888888';
  }

  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);

  // Handle parse errors
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return '#888888';
  }

  r = Math.floor(r * factor);
  g = Math.floor(g * factor);
  b = Math.floor(b * factor);

  return '#' +
    ('0' + r.toString(16)).slice(-2) +
    ('0' + g.toString(16)).slice(-2) +
    ('0' + b.toString(16)).slice(-2);
}

/**
 * Lighten a hex color by a percentage
 * @param {string} hex - Hex color code
 * @param {number} [factor=0.3] - Lightening factor (0-1)
 * @returns {string} Lightened hex color
 */
function lightenColor(hex, factor) {
  factor = factor || 0.3;

  if (!hex || typeof hex !== 'string' || hex.charAt(0) !== '#') {
    return '#CCCCCC';
  }

  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return '#CCCCCC';
  }

  r = Math.floor(r + (255 - r) * factor);
  g = Math.floor(g + (255 - g) * factor);
  b = Math.floor(b + (255 - b) * factor);

  return '#' +
    ('0' + r.toString(16)).slice(-2) +
    ('0' + g.toString(16)).slice(-2) +
    ('0' + b.toString(16)).slice(-2);
}

/**
 * Normalize a string for comparison (trim, lowercase)
 * @param {string} str - Input string
 * @returns {string} Normalized string
 */
function normalizeString(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.trim().toLowerCase();
}

/**
 * Check if two strings match (case-insensitive, trimmed)
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if strings match
 */
function stringsMatch(a, b) {
  return normalizeString(a) === normalizeString(b);
}

/**
 * Create a lookup map from a 2D array
 * @param {Array[]} data - 2D array with headers in first row
 * @param {number} keyCol - Column index for keys
 * @param {number} valueCol - Column index for values
 * @param {number} [filterCol] - Optional column to filter by
 * @param {string} [filterValue] - Value to filter on
 * @returns {Object} Lookup map
 */
function createLookup(data, keyCol, valueCol, filterCol, filterValue) {
  var lookup = {};

  for (var i = 1; i < data.length; i++) {
    var row = data[i];

    // Skip if filter doesn't match
    if (filterCol !== undefined && filterValue !== undefined) {
      if (row[filterCol] !== filterValue) {
        continue;
      }
    }

    var key = row[keyCol];
    if (key !== undefined && key !== null && key !== '') {
      lookup[key] = row[valueCol];
    }
  }

  return lookup;
}
