# Frontlines Map

A Google Apps Script-based territory control system for tabletop wargaming campaigns.

## Features

- **Dual Maps**: TGA and Westgate, each 14×9 grid
- **14 Players**: Support for players on one or both maps
- **Battle Processing**: Parse game results to update territory ownership
- **POI Tracking**: Points of Interest marked with ⌘ symbol
- **Visual Rendering**: Color-coded territories with player ownership
- **Recent Claims**: Last 3 claims highlighted with thick black borders

## Quick Start

### Option 1: Manual Setup (Recommended for first-time users)

1. Create a new Google Sheets document
2. Go to **Extensions → Apps Script**
3. Delete any existing code
4. Copy the contents of each file from `src/` into the script editor:
   - `Config.js`
   - `Helpers.js`
   - `DataService.js`
   - `MapCore.js`
   - `Menu.js`
   - `Setup.js`
5. Also copy `appsscript.json` content (View → Show manifest file)
6. Save the project
7. Run `setupTerritoryControl()` from the script editor
8. Refresh the spreadsheet to see the menu

### Option 2: Using clasp (For developers)

```bash
# Install clasp globally
npm install -g @google/clasp

# Login to your Google account
clasp login

# Create a new Apps Script project attached to a spreadsheet
clasp create --type sheets --title "Frontlines Map"

# Push the code
clasp push

# Open in browser and run setup
clasp open
```

## Usage

### Adding Battles

1. Open the **Game Results** sheet
2. Fill in the columns:
   - **Date**: When the battle occurred
   - **Player 1 & 2**: Select from dropdown
   - **Result**: P1 Win, P2 Win, or Draw
   - **Location**: TGA or Westgate
   - **Claimed Territory**: Grid coordinate (e.g., "D4", "M8")

### Updating Maps

Click **🗺️ Territory Control → Update Maps** to refresh both maps.

### Understanding the Map

| Element | Meaning |
|---------|---------|
| Colored cell | Owned by player (color = player color) |
| Grey cell | Unclaimed territory |
| ⌘ symbol | Point of Interest |
| Thick black border | Recently claimed (last 3) |

Hover over any cell to see ownership details.

## Project Structure

```
FRONTLINES_MAP/
├── src/
│   ├── Config.js          # Configuration constants
│   ├── Helpers.js         # Utility functions
│   ├── DataService.js     # Sheet operations
│   ├── MapCore.js         # Map rendering logic
│   ├── Menu.js            # UI menu handlers
│   └── Setup.js           # Bootstrap functions
├── docs/
│   ├── ARCHITECTURE.md    # Technical architecture
│   └── SETUP.md           # Detailed setup guide
├── appsscript.json        # Apps Script manifest
└── README.md
```

## Documentation

- [Architecture Documentation](docs/ARCHITECTURE.md) - Technical details and design decisions
- [Setup Guide](docs/SETUP.md) - Detailed installation instructions

## Players

### TGA Map (11 players)
Oracle, Kori, Koen, Roly, Addsey, Justin, Dr_Punchwhack, ViRtUaL cHeSs 64!, JlIM, Sarah, K

### Westgate Map (7 players)
Sammy, Kori, Justin, Sarah, Addsey, Laurie, Scotty

### Both Maps
Kori, Addsey, Justin, Sarah

## Customization

### Adding Players

1. Open the **Player Roster** sheet
2. Add a new row with: Name, Color (hex code), Maps (TGA/Westgate/Both)
3. Use **🗺️ Territory Control → Refresh Dropdowns** to update forms

### Adding POIs

1. Open the **POI Definitions** sheet
2. Add a new row with: Territory (e.g., "E5"), Map (TGA/Westgate), Name
3. Run **Update Maps** to see changes

### Changing Starting Territories

Edit the **Starting Territories** sheet before any battles are recorded.

## Technical Notes

- Built on V8 runtime (modern JavaScript)
- Follows Apps Script best practices for batch operations
- Timezone: Australia/Melbourne
- No external dependencies

## License

MIT License - Feel free to adapt for your own campaigns!

## Credits

Built for tracking Trench Crusade campaign territories.
