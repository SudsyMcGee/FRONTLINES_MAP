# Frontlines Map - Architecture Documentation

## Overview

Frontlines Map is a Google Apps Script-based territory control system for tabletop wargaming campaigns. It provides dual-map tracking (TGA and Westgate), battle result processing, and visual territory rendering directly within Google Sheets.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Google Sheets Workbook                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   TGA Map    │  │ Westgate Map │  │    Game Results      │  │
│  │   (14×9)     │  │    (14×9)    │  │   (Battle Log)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │Player Roster │  │     POIs     │  │ Starting Territories │  │
│  │  (14 players)│  │ (Definitions)│  │   (Initial State)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Apps Script Engine                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Config    │  │   MapCore   │  │      DataService        │ │
│  │  (Settings) │  │  (Renderer) │  │  (Sheet Operations)     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │    Menu     │  │   Setup     │  │        Helpers          │ │
│  │    (UI)     │  │ (Bootstrap) │  │   (Utilities)           │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Battle Processing Pipeline

```
Game Results Sheet
        │
        ▼
┌───────────────────┐
│ 1. Read all rows  │  ← Single batch read (performance)
│    in one call    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ 2. Filter by map  │  ← TGA or Westgate
│    location       │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ 3. Skip draws,    │  ← Only process wins
│    process wins   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ 4. Update owner   │  ← In-memory territory map
│    lookup table   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ 5. Track recent   │  ← Last N changes for highlighting
│    changes        │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ 6. Batch render   │  ← Single range write (performance)
│    to map sheet   │
└───────────────────┘
```

## Sheet Specifications

### Map Sheets (TGA Map, Westgate Map)

| Row | Content |
|-----|---------|
| 1 | Map title (merged cells) |
| 2 | Column headers: A-N |
| 3-11 | Grid rows 1-9 with row labels in column 1 |

- Grid dimensions: 14 columns (A-N) × 9 rows (1-9)
- Cell size: 50×50 pixels for visual clarity
- Territory notation: Column letter + Row number (e.g., "D4", "M8")

### Game Results Sheet

| Column | Content | Validation |
|--------|---------|------------|
| A | Date | Date format |
| B | Player 1 | Dropdown from roster |
| C | Player 2 | Dropdown from roster |
| D | Result | P1 Win / P2 Win / Draw |
| E | Location | TGA / Westgate |
| F | Claimed Territory | Territory notation |
| G | Glory P1 | Number |
| H | Glory P2 | Number |
| I | Exploration | Free text |
| J | Mission Played | Free text |

### Player Roster Sheet

| Column | Content | Notes |
|--------|---------|-------|
| A | Player Name | Unique identifier |
| B | Color | Hex code (e.g., #FF6B6B) |
| C | Maps | TGA / Westgate / Both |

### POI Definitions Sheet

| Column | Content |
|--------|---------|
| A | Territory | Grid coordinate |
| B | Map | TGA / Westgate |
| C | Name | POI display name |

### Starting Territories Sheet

| Column | Content |
|--------|---------|
| A | Territory | Grid coordinate |
| B | Owner | Player name |
| C | Map | TGA / Westgate |

## Design Principles

### 1. Batch Operations Over Iteration

**Bad:**
```javascript
// DON'T: Individual cell operations
for (var i = 0; i < 100; i++) {
  sheet.getRange(i, 1).setValue(data[i]);
}
```

**Good:**
```javascript
// DO: Single batch operation
sheet.getRange(1, 1, data.length, 1).setValues(data);
```

Apps Script has significant latency per API call. Batch operations reduce a 100-cell update from ~100 API calls to 1.

### 2. Read Once, Process In-Memory, Write Once

```javascript
// Read all data upfront
var allData = sheet.getDataRange().getValues();

// Process in JavaScript (fast)
var processed = allData.map(transform);

// Write results in one call
outputSheet.getRange(1, 1, processed.length, processed[0].length)
           .setValues(processed);
```

### 3. Separation of Concerns

| Module | Responsibility |
|--------|---------------|
| Config | Constants and settings |
| DataService | All sheet read/write operations |
| MapCore | Territory state and rendering logic |
| Menu | UI triggers and user feedback |
| Setup | Initial bootstrap and data population |
| Helpers | Pure utility functions |

### 4. Defensive Data Handling

- Always validate sheet existence before operations
- Trim and normalize player names for matching
- Handle missing/empty cells gracefully
- Log errors for debugging without crashing

## Rendering Logic

### Territory Cell States

| State | Background | Symbol | Border | Note |
|-------|------------|--------|--------|------|
| Unclaimed | Grey (#CCCCCC) | (empty) | None | (empty) |
| Unclaimed POI | Grey (#CCCCCC) | ⌘ (white) | None | POI name + "Neutral" |
| Owned | Player color | (empty) | Darkened color | Territory + Owner |
| Owned POI | Player color | ⌘ (white) | Darkened color | POI name + Owner |
| Recent claim | Player color | (varies) | Black thick | (varies) |

### Color Processing

Player colors are stored as hex codes. Border colors are computed by darkening the base color by 30% for visual contrast.

```javascript
function darkenColor(hex) {
  // Parse RGB components
  // Multiply each by 0.7
  // Return as hex
}
```

## Performance Considerations

### Apps Script Limitations (2026)

- **6-minute maximum runtime** - Scripts timeout after 6 minutes
- **Single-threaded execution** - No parallel processing within a script
- **Daily quotas** - Limited API calls per day
- **Stateless execution** - No persistent variables between runs

### Optimization Strategies

1. **Minimize service calls** - Read sheets once, cache results
2. **Batch all writes** - Never write cell-by-cell
3. **Use Cache Service** - For data that doesn't change often
4. **Avoid libraries in UI scripts** - They add cold-start latency

## File Structure (clasp-compatible)

```
FRONTLINES_MAP/
├── src/
│   ├── Config.js          # Configuration constants
│   ├── DataService.js     # Sheet operations
│   ├── MapCore.js         # Map rendering logic
│   ├── Menu.js            # UI menu handlers
│   ├── Setup.js           # Bootstrap functions
│   └── Helpers.js         # Utility functions
├── docs/
│   ├── ARCHITECTURE.md    # This document
│   └── SETUP.md           # User setup guide
├── appsscript.json        # Apps Script manifest
├── .clasp.json            # clasp configuration (local only)
├── .gitignore
└── README.md
```

## Deployment

### Using clasp (Recommended)

1. Install clasp: `npm install -g @google/clasp`
2. Login: `clasp login`
3. Clone or create project: `clasp clone <scriptId>` or `clasp create`
4. Push changes: `clasp push`
5. Deploy: `clasp deploy`

### Manual Deployment

1. Open Google Sheets
2. Extensions → Apps Script
3. Copy/paste each .js file content
4. Save and run `setupTerritoryControl()`

## Security Notes

- Script runs with user's permissions
- Each user must authorize on first run
- No external API calls or data exfiltration
- All data stays within the Google Sheets document

## References

- [Google Apps Script Best Practices](https://developers.google.com/apps-script/guides/support/best-practices)
- [clasp CLI Documentation](https://developers.google.com/apps-script/guides/clasp)
- [Apps Script Quotas](https://developers.google.com/apps-script/guides/services/quotas)
