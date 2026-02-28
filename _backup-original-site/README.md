# Backup – Original portfolio (before revamp)

**Date:** Feb 27, 2026

This folder contains the original `index.html` and `style.css` before the Jon-inspired revamp.

## To restore the original site

1. Copy these files back to the repo root, overwriting the current ones:
   - `index.html` → root `index.html`
   - `style.css` → root `style.css`

2. Or use PowerShell (run from repo root):
   ```powershell
   Copy-Item _backup-original-site\index.html index.html -Force
   Copy-Item _backup-original-site\style.css style.css -Force
   ```

3. Or use git (if you committed before the revamp):
   ```bash
   git checkout HEAD -- index.html style.css
   ```
