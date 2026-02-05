/**
 * Configuration constants for Frontlines Map
 * All magic numbers and strings centralized here
 */

var CONFIG = {
  // Map dimensions
  map: {
    rows: 9,
    cols: 14,
    cellWidth: 50,
    cellHeight: 50
  },

  // Visual settings
  display: {
    highlightRecentCount: 3,
    poiSymbol: '⌘',
    neutralColor: '#CCCCCC',
    poiTextColor: '#FFFFFF',
    recentClaimBorderColor: '#000000'
  },

  // Sheet names - single source of truth
  sheets: {
    TGA_MAP: 'TGA Map',
    WESTGATE_MAP: 'Westgate Map',
    GAME_RESULTS: 'Game Results',
    PLAYER_ROSTER: 'Player Roster',
    POI_DEFINITIONS: 'POI Definitions',
    STARTING_TERRITORIES: 'Starting Territories',
    README: 'README'
  },

  // Map location identifiers
  locations: {
    TGA: 'TGA',
    WESTGATE: 'Westgate',
    BOTH: 'Both'
  },

  // Game result types
  results: {
    P1_WIN: 'P1 Win',
    P2_WIN: 'P2 Win',
    DRAW: 'Draw'
  },

  // Column indices for Game Results sheet (0-based)
  resultsColumns: {
    DATE: 0,
    PLAYER_1: 1,
    PLAYER_2: 2,
    RESULT: 3,
    LOCATION: 4,
    CLAIMED_TERRITORY: 5,
    GLORY_P1: 6,
    GLORY_P2: 7,
    EXPLORATION: 8,
    MISSION: 9
  }
};

// Freeze config to prevent accidental modification
if (typeof Object.freeze === 'function') {
  Object.freeze(CONFIG);
  Object.freeze(CONFIG.map);
  Object.freeze(CONFIG.display);
  Object.freeze(CONFIG.sheets);
  Object.freeze(CONFIG.locations);
  Object.freeze(CONFIG.results);
  Object.freeze(CONFIG.resultsColumns);
}
