# Fix: Android Studio Run Button Disabled

## Common Causes & Solutions

### 1. No Device Selected (Most Common)

**Check Device Dropdown:**
- Look at the top toolbar in Android Studio
- Next to the Run button, there should be a device dropdown
- Click it to see if your phone appears

**If no device shows:**

**A. Enable USB Debugging on Phone:**
1. On your Android phone: Settings → About Phone
2. Tap "Build Number" 7 times to enable Developer Options
3. Go back to Settings → Developer Options
4. Enable "USB Debugging"
5. Connect phone to computer via USB
6. Allow USB debugging when prompted on phone

**B. Check ADB Connection:**
```bash
# In Android Studio Terminal or Windows PowerShell
cd android
.\gradlew.bat --version

# Check if device is detected
adb devices
```

Should show:
```
List of devices attached
<device-id>    device
```

If it shows "unauthorized", check phone screen for authorization prompt.

### 2. Gradle Sync Needed

**Sync Project with Gradle Files:**
1. In Android Studio: File → Sync Project with Gradle Files
2. Wait for sync to complete (watch bottom status bar)
3. Look for errors in "Build" panel at bottom

**Or manually sync:**
```bash
cd android
.\gradlew.bat --refresh-dependencies
```

### 3. Invalidate Caches (If sync fails)

1. File → Invalidate Caches / Restart
2. Select "Invalidate and Restart"
3. Wait for Android Studio to restart and re-index

### 4. Check for Build Errors

**Look at the bottom panels:**
- Build tab - any errors?
- Problems tab - any issues?
- Event Log - any failed operations?

If you see errors, share them and I can help fix them.

### 5. Select Correct Run Configuration

**Check Run Configuration:**
1. Top toolbar: click dropdown next to Run button (might say "app" or be empty)
2. Select "app" from the dropdown
3. If no configurations exist: Run → Edit Configurations → Add (+) → Android App

### 6. Build APK Manually (Alternative Method)

If Run button stays disabled, you can build APK manually:

```bash
# In project root (C:\Users\teudo\AndroidStudioProjects\virtual-translator-studio)
cd android
.\gradlew.bat clean
.\gradlew.bat assembleDebug
```

APK will be at: `android\app\build\outputs\apk\debug\app-debug.apk`

Then install manually:
```bash
adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```

## Quick Checklist

✓ Phone connected via USB?
✓ USB Debugging enabled on phone?
✓ Device shows in dropdown next to Run button?
✓ Gradle sync completed (no errors in Build panel)?
✓ "app" configuration selected in run config dropdown?

## Most Likely Solution

**Try this first:**
1. Connect phone via USB if not connected
2. File → Sync Project with Gradle Files
3. Wait 30-60 seconds for sync to complete
4. Check device dropdown (next to Run button)
5. Select your device
6. Run button should become enabled

## Still Not Working?

**Share these details:**
1. What does the device dropdown show? (click it)
2. Any errors in Build panel at bottom?
3. Output of this command:
   ```bash
   cd android
   adb devices
   ```
