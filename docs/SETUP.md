# Frontlines Map - Setup Guide

## Prerequisites

- A Google account
- Access to Google Sheets
- About 10 minutes for setup

## Installation Methods

### Method 1: Manual Copy (Easiest)

This method works for anyone and requires no special tools.

#### Step 1: Create the Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **+ Blank** to create a new spreadsheet
3. Name it "Frontlines Map" (or your preferred name)

#### Step 2: Open the Script Editor

1. In your new spreadsheet, click **Extensions** → **Apps Script**
2. This opens the script editor in a new tab
3. Delete any existing code in the editor

#### Step 3: Copy the Code Files

You need to create multiple script files. In the Apps Script editor:

1. **Rename the default file**:
   - Click on `Code.gs` in the left sidebar
   - Rename it to `Config.gs`
   - Paste the contents of `src/Config.js`

2. **Add remaining files** (click the **+** next to Files):
   - Create `Helpers.gs` → paste `src/Helpers.js`
   - Create `DataService.gs` → paste `src/DataService.js`
   - Create `MapCore.gs` → paste `src/MapCore.js`
   - Create `Menu.gs` → paste `src/Menu.js`
   - Create `Setup.gs` → paste `src/Setup.js`

3. **Update the manifest**:
   - Click **Project Settings** (gear icon)
   - Check "Show 'appsscript.json' manifest file"
   - Click **Editor** to go back
   - Click on `appsscript.json` in the sidebar
   - Replace contents with the `appsscript.json` from this repo

#### Step 4: Run Setup

1. In the script editor, select `Setup.gs` from the sidebar
2. From the function dropdown (next to Run button), select `setupTerritoryControl`
3. Click **Run**
4. When prompted, click **Review Permissions**
5. Choose your Google account
6. Click **Advanced** → **Go to Frontlines Map (unsafe)**
7. Click **Allow**
8. Wait for the setup to complete (you'll see a success message)

#### Step 5: Verify Installation

1. Go back to your spreadsheet tab
2. Refresh the page (F5 or Cmd+R)
3. You should see a **🗺️ Territory Control** menu
4. Check that all sheets were created:
   - TGA Map
   - Westgate Map
   - Game Results
   - Player Roster
   - POI Definitions
   - Starting Territories
   - README

---

### Method 2: Using clasp (For Developers)

[clasp](https://github.com/google/clasp) is Google's command-line tool for Apps Script development.

#### Prerequisites

- Node.js installed
- npm (comes with Node.js)

#### Step 1: Install clasp

```bash
npm install -g @google/clasp
```

#### Step 2: Login to Google

```bash
clasp login
```

This opens a browser window. Authorize clasp to access your Google account.

#### Step 3: Enable Apps Script API

1. Go to [Apps Script Settings](https://script.google.com/home/usersettings)
2. Turn on "Google Apps Script API"

#### Step 4: Clone This Repository

```bash
git clone <repository-url>
cd FRONTLINES_MAP
```

#### Step 5: Create the Project

```bash
# Create a new spreadsheet-bound script
clasp create --type sheets --title "Frontlines Map"
```

This creates a new Google Spreadsheet with an attached script.

#### Step 6: Push the Code

```bash
clasp push
```

When prompted about overwriting manifest, type `y`.

#### Step 7: Run Setup

```bash
# Open the script editor in browser
clasp open

# Then manually run setupTerritoryControl() from the editor
```

Or run setup from command line (requires additional configuration):

```bash
clasp run setupTerritoryControl
```

---

## Post-Installation

### First Time for Each User

When a user clicks any menu option for the first time, they'll need to authorize the script. This is a one-time process per user.

### Customizing Players

The setup creates 14 default players. To modify:

1. Open **Player Roster** sheet
2. Edit player names, colors, or map assignments
3. Run **🗺️ Territory Control → Refresh Dropdowns**

### Customizing POIs

1. Open **POI Definitions** sheet
2. Add, edit, or remove POI entries
3. Run **🗺️ Territory Control → Update Maps**

### Customizing Starting Territories

1. Open **Starting Territories** sheet
2. Modify ownership as needed
3. Run **🗺️ Territory Control → Update Maps**

**Note**: Changes to starting territories only affect new map renders. They don't override battle results.

---

## Troubleshooting

### "Script function not found" Error

Make sure you've created all 6 script files with the correct names and content.

### Menu Doesn't Appear

1. Refresh the spreadsheet page
2. Wait 5-10 seconds
3. If still missing, run `onOpen()` manually from the script editor

### Dropdowns Not Working

Click **🗺️ Territory Control → Refresh Dropdowns**

### Maps Not Rendering Correctly

1. Check that Player Roster has valid hex colors (e.g., `#FF6B6B`)
2. Check that territory coordinates are valid (A1-N9)
3. Look for errors in Apps Script execution log

### Permission Errors

Each user needs to authorize once. Have them:
1. Open the spreadsheet
2. Click any menu option
3. Complete the authorization flow

### "Authorization required" Keeps Appearing

Clear your browser cache and cookies, then try again.

---

## File Reference

| File | Purpose |
|------|---------|
| `Config.js` | All configuration constants |
| `Helpers.js` | Pure utility functions |
| `DataService.js` | Sheet read/write operations |
| `MapCore.js` | Territory state and rendering |
| `Menu.js` | UI menu handlers |
| `Setup.js` | Initial setup functions |
| `appsscript.json` | Project manifest (timezone, runtime) |

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the execution log in Apps Script editor
3. Ensure all file contents were copied correctly
