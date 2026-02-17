# Pull Server Changes to Windows Machine

## Current Situation
- Server has all the Capacitor mobile fixes (7 files modified)
- Your Windows machine still has old code trying to connect to localhost
- Need to sync Windows with server repository

## Steps to Fix

### Option 1: Pull from Git (RECOMMENDED if you have no important local changes)

```bash
# On Windows, in your project folder: C:\Users\teudo\AndroidStudioProjects\virtual-translator-studio

# Check what files would be affected
git status

# If you see unstaged changes and don't need them, discard them:
git checkout .

# Pull latest changes from server
git pull origin main

# Install any new dependencies
npm install

# Rebuild React app with fixes
npm run build

# Sync to Android
npx cap sync android

# Build in Android Studio
# Build > Rebuild Project
# Then: Build > Build Bundle(s) / APK(s) > Build APK(s)
```

### Option 2: If Git is Blocked or You Have Local Changes to Keep

```bash
# Stash your local changes first
git stash

# Pull server changes
git pull origin main

# Apply your stashed changes back (if needed)
git stash pop

# Continue with build steps above
```

## What These Fixes Do

The server changes detect when app runs on mobile device and force it to use:
- API: `https://ministryprogs.tniglobal.org` 
- WebSocket: `wss://ministryprogs.tniglobal.org`

Instead of:
- API: `http://localhost:3001`
- WebSocket: `ws://localhost:3001`

## Files That Were Fixed on Server
1. src/services/api.ts
2. src/services/webrtcService.ts
3. src/services/oneSignalService.ts
4. src/components/TranslationStudio.tsx
5. src/components/card-translation/CardScriptsList.tsx
6. src/components/card-translation/CepInstallation.tsx
7. src/components/card-translation/OnlineDesigners.tsx

## Verification After Pull

After pulling, check one of the files to verify you have the fix:

```bash
# Check if api.ts has Capacitor import
grep "Capacitor" src/services/api.ts
```

Should show:
```typescript
import { Capacitor } from '@capacitor/core';
```

And the getApiUrl function should check `Capacitor.isNativePlatform()` first.
