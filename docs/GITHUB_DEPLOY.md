# GitHub Actions Auto-Deployment Setup

This guide explains how to set up automatic deployment from GitHub to Google Apps Script.

## How It Works

```
Git Push → GitHub Actions → clasp push → Google Apps Script
```

Every time you push changes to `src/` or `appsscript.json`, GitHub Actions will automatically deploy to your Google Sheets script.

## One-Time Setup

### Step 1: Install clasp locally

```bash
npm install -g @google/clasp
```

### Step 2: Enable the Apps Script API

1. Go to [Apps Script Settings](https://script.google.com/home/usersettings)
2. Turn **ON** "Google Apps Script API"

### Step 3: Login to clasp

```bash
clasp login
```

This opens a browser. Authorize with your Google account.

After authorization, clasp creates a credentials file at:
- **Windows**: `%USERPROFILE%\.clasprc.json`
- **Mac/Linux**: `~/.clasprc.json`

### Step 4: Create or clone the Apps Script project

**Option A: Create new project (attached to a new spreadsheet)**
```bash
cd FRONTLINES_MAP
clasp create --type sheets --title "Frontlines Map" --rootDir src
```

**Option B: Clone existing project**
```bash
# Get the script ID from your spreadsheet:
# Extensions → Apps Script → Project Settings → Script ID
clasp clone <SCRIPT_ID> --rootDir src
```

This creates a `.clasp.json` file with your script ID.

### Step 5: Push to GitHub as secrets

You need to add two secrets to your GitHub repository:

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

**Secret 1: CLASPRC_JSON**
- Name: `CLASPRC_JSON`
- Value: Contents of your `~/.clasprc.json` file

**Secret 2: CLASP_JSON**
- Name: `CLASP_JSON`
- Value: Contents of your `.clasp.json` file (contains your script ID)

Example `.clasp.json`:
```json
{
  "scriptId": "1ABC123...",
  "rootDir": "src"
}
```

### Step 6: Push your repo to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/FRONTLINES_MAP.git
git push -u origin master
```

## Testing the Deployment

1. Make a small change to any file in `src/`
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test auto-deploy"
   git push
   ```
3. Go to your GitHub repo → **Actions** tab
4. Watch the workflow run
5. Check your Google Sheets script to verify the changes

## Workflow File

The workflow is defined in `.github/workflows/deploy.yml`:

- **Triggers**: Push to `master` or `main` branches
- **Only runs when**: Files in `src/` or `appsscript.json` change
- **Actions**:
  1. Checkout code
  2. Install clasp
  3. Push code to Apps Script
  4. Create a new deployment version

## Troubleshooting

### "Script not found" error
- Verify the script ID in `CLASP_JSON` secret is correct
- Make sure you have edit access to the spreadsheet

### "Unauthorized" error
- Re-run `clasp login` and update the `CLASPRC_JSON` secret
- Tokens expire; you may need to refresh periodically

### "API not enabled" error
- Go to [Apps Script Settings](https://script.google.com/home/usersettings)
- Enable "Google Apps Script API"

### Changes not appearing
- Check the Actions tab for errors
- Verify the workflow triggered (check paths filter)
- Manually run `clasp push` locally to test

## Security Notes

- **Never commit** `.clasprc.json` or `.clasp.json` to your repo
- These contain OAuth tokens with access to your Google account
- Always use GitHub Secrets for sensitive credentials
- The `.gitignore` already excludes `.clasp.json`

## Alternative: Manual clasp workflow

If you prefer not to use GitHub Actions:

```bash
# After making changes
clasp push

# To create a versioned deployment
clasp deploy --description "v1.0 - Initial release"

# To update existing deployment
clasp deploy --deploymentId <ID> --description "v1.1 - Bug fixes"
```
