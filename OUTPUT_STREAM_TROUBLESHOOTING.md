# Output Stream Troubleshooting Guide

## Issue: "Output stream check: NOT AVAILABLE"

When you start translating, you see the message **"Output stream check: NOT AVAILABLE"** repeatedly in the console. This is **expected behavior** initially, but if it persists for more than 30-60 seconds, there's likely an issue.

---

## Why This Happens

The translation app works in this sequence:

```
1. MediaRecorder captures video → WebM chunks
2. WebSocket sends chunks to backend
3. Backend runs FFmpeg to convert WebM → RTMP
4. RTMP server receives stream
5. RTMP server generates HLS output (.m3u8 playlist + .ts segments)
6. CDN makes HLS available at watchUrl
7. Frontend can now fetch and play the stream
```

**The problem**: Steps 4-6 take **10-30 seconds** (sometimes longer). During this time, the output URL returns **HTTP 404** because the HLS files don't exist yet.

---

## Normal vs. Problem

### ✅ Normal Behavior (Expected)
```
📺 Output stream check: NOT AVAILABLE (HTTP 404)
   URL: https://tni-out.ceflixcdn.com/translations/german/playlist.m3u8
   This is normal - stream takes 10-30 seconds to become available
📺 Output stream check: NOT AVAILABLE (HTTP 404)
📺 Output stream check: NOT AVAILABLE (HTTP 404)
📺 Output stream check: AVAILABLE ✓ (HTTP 200)
✓ Output stream is NOW AVAILABLE!
```
**Timeline**: 3-10 checks (9-30 seconds) before becoming available.

### ❌ Problem Behavior
```
📺 Output stream check: NOT AVAILABLE (HTTP 404)
   URL: https://tni-out.ceflixcdn.com/translations/german/playlist.m3u8
   This is normal - stream takes 10-30 seconds to become available
... (repeats 40 times - 2 minutes) ...
⚠ Output stream check timeout after 120 seconds
⚠ Stream may still become available - check your RTMP settings
```
**Timeline**: Stream never becomes available after 2 minutes.

---

## Diagnostic Steps

### Step 1: Check Backend Logs
```bash
cd /home/tniglobal/public_html/webrtc/browser-based-translation/backend
pm2 logs translation-backend --lines 50
```

**Look for:**
```bash
✓ Good signs:
  - "WebSocket authenticated for user ..."
  - "Starting RTMP stream for user ... to rtmp://..."
  - "Stream active for user ..."
  - "✓ Received chunk #10 for user ..."

✗ Bad signs:
  - "FFmpeg process ... exited with code 1"
  - "FFmpeg error [userId]: Connection refused"
  - "EPIPE" errors
  - No "Received chunk" messages after stream starts
```

### Step 2: Check FFmpeg is Running
```bash
ps aux | grep ffmpeg
```

**Expected output** (if translation is active):
```
/usr/bin/ffmpeg -f webm -i pipe:0 -c:v libx264 -preset medium -b:v 2500k ...
```

**If no FFmpeg process**: FFmpeg failed to start or crashed immediately.

### Step 3: Test RTMP Server Manually
```bash
# Get RTMP credentials from database
cd /home/tniglobal/public_html/webrtc/browser-based-translation/backend
node -e "
const mongoose = require('mongoose');
const StreamingDetails = require('./models').StreamingDetails;
mongoose.connect('mongodb://localhost:27017/translation-app')
  .then(async () => {
    const details = await StreamingDetails.findOne();
    console.log('RTMP Server:', details.rtmpServer);
    console.log('Stream Key:', details.streamKey);
    console.log('Watch URL:', details.watchUrl);
    process.exit(0);
  });
"
```

**Test with FFmpeg directly:**
```bash
# Create a test video (5 seconds of black)
ffmpeg -f lavfi -i testsrc=duration=5:size=640x480:rate=30 -f lavfi -i sine=frequency=1000:duration=5 \
  -c:v libx264 -preset medium -b:v 2500k -c:a aac -b:a 128k -f flv \
  rtmp://tni-ingest.cdn.cscloudws.com/translations/YOUR_STREAM_KEY
```

Replace `YOUR_STREAM_KEY` with the actual stream key from database.

**Expected**: Command runs for 5 seconds, then completes successfully.
**If it fails**: RTMP server is not accessible or credentials are wrong.

### Step 4: Test Output URL Directly
```bash
# Check if output URL exists
curl -I "https://tni-out.ceflixcdn.com/translations/german/playlist.m3u8"
```

**During active translation:**
- **HTTP 200**: Stream is available ✓
- **HTTP 404**: Stream not ready yet or FFmpeg failed
- **HTTP 403**: Access denied (check RTMP credentials)

**After translation stops:**
- Output may stay available for a few minutes (cached)
- Or immediately return 404 (no caching)

### Step 5: Check Browser Console
Open browser console (F12) and look for:

```
✓ Good signs:
  - "✓ WebSocket CONNECTED"
  - "✓ WebSocket AUTHENTICATED"
  - "📹 Chunk #10: ... bytes"
  - "🎬 First chunk sent! Starting RTMP stream on backend..."
  - "✓ RTMP stream started on backend"

✗ Bad signs:
  - "❌ Failed to start RTMP stream: ..."
  - "✗ Cannot send chunk - WebSocket is NULL"
  - No chunk messages after starting
  - CORS errors
```

---

## Common Problems & Solutions

### Problem 1: FFmpeg Exits with Code 1
**Symptom**: Backend logs show `FFmpeg process ... exited with code 1`

**Cause**: FFmpeg can't connect to RTMP server.

**Solution**:
1. Check RTMP server is accessible:
   ```bash
   telnet tni-ingest.cdn.cscloudws.com 1935
   ```
   Should connect successfully.

2. Verify RTMP credentials in database:
   ```bash
   cd backend
   node -e "
   const mongoose = require('mongoose');
   const StreamingDetails = require('./models').StreamingDetails;
   mongoose.connect('mongodb://localhost:27017/translation-app')
     .then(async () => {
       const all = await StreamingDetails.find();
       all.forEach(d => {
         console.log('User:', d.userId);
         console.log('  RTMP Server:', d.rtmpServer);
         console.log('  Stream Key:', d.streamKey);
         console.log('  Watch URL:', d.watchUrl);
       });
       process.exit(0);
     });
   "
   ```

3. Contact RTMP server admin to verify credentials are correct.

### Problem 2: EPIPE Error
**Symptom**: Backend logs show `Error: write EPIPE` or `syscall: 'write'`

**Cause**: FFmpeg closed stdin pipe unexpectedly (usually because it crashed).

**Solution**: Same as Problem 1 - FFmpeg is crashing because it can't connect to RTMP.

### Problem 3: Stream Never Becomes Available (404)
**Symptom**: Output URL returns 404 even after 2 minutes.

**Possible causes**:
1. **FFmpeg not sending to RTMP** - Check backend logs for FFmpeg errors
2. **RTMP server not generating HLS** - Contact RTMP/CDN admin
3. **Wrong output URL** - Verify watchUrl in database matches actual CDN URL
4. **CDN caching issue** - May need to clear CDN cache

**Solution**:
1. Verify RTMP stream is being received:
   - Contact RTMP server admin
   - Check if stream appears in RTMP server dashboard

2. Test if HLS files are being generated:
   ```bash
   curl -I "https://tni-out.ceflixcdn.com/translations/german/playlist.m3u8"
   ```
   Should eventually return 200.

3. If still 404, check CDN logs or contact CDN support.

### Problem 4: No Chunks Being Sent
**Symptom**: Backend logs show "WebSocket authenticated" but no "Received chunk" messages.

**Cause**: WebSocket is connected but MediaRecorder isn't sending data.

**Solution**:
1. Check browser console for MediaRecorder errors
2. Verify microphone permission is granted
3. Check if source video is playing
4. Try different browser (Chrome recommended)

### Problem 5: CORS Errors
**Symptom**: Browser console shows CORS errors when checking output URL.

**Cause**: CDN not configured for CORS.

**Solution**: Output URL should have CORS headers:
```bash
curl -I "https://tni-out.ceflixcdn.com/translations/german/playlist.m3u8"
```
Should include:
```
Access-Control-Allow-Origin: *
```
If missing, contact CDN admin to enable CORS.

---

## Testing Checklist

Before declaring the issue "fixed", verify:

- [ ] Backend starts without errors: `pm2 logs translation-backend`
- [ ] FFmpeg is installed: `ffmpeg -version`
- [ ] MongoDB is running: `mongosh --eval "db.version()"`
- [ ] RTMP server is accessible: `telnet tni-ingest.cdn.cscloudws.com 1935`
- [ ] RTMP credentials are correct (verify with admin)
- [ ] Frontend connects to WebSocket: Check browser console
- [ ] MediaRecorder sends chunks: Look for "Chunk #" messages
- [ ] FFmpeg receives chunks: Backend logs show "Received chunk #"
- [ ] FFmpeg stays running: `ps aux | grep ffmpeg` shows process
- [ ] Output URL eventually returns 200: `curl -I <watchUrl>`
- [ ] Stream plays in browser after ~10-30 seconds

---

## Quick Reference

### Key Files
- Backend: `/home/tniglobal/public_html/webrtc/browser-based-translation/backend/server.js`
- Streaming Service: `/home/tniglobal/public_html/webrtc/browser-based-translation/backend/streamingService.js`
- Frontend: `/home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react/src/components/TranslationStudio.tsx`

### Key Commands
```bash
# Check backend logs
pm2 logs translation-backend

# Restart backend
pm2 restart translation-backend

# Check FFmpeg
ps aux | grep ffmpeg

# Test output URL
curl -I "https://tni-out.ceflixcdn.com/translations/german/playlist.m3u8"

# Check MongoDB
mongosh translation-app --eval "db.streamingdetails.find().pretty()"
```

### Normal Timeline
```
t=0s:    User clicks "Start Translating"
t=1s:    WebSocket authenticates
t=2s:    First chunk sent → RTMP stream starts
t=3-8s:  Chunks flowing, FFmpeg converting
t=10-30s: HLS output becomes available (HTTP 200)
t=30s+:  Stream plays successfully in browser
```

---

## Still Having Issues?

If stream still doesn't work after following this guide:

1. **Collect diagnostic data**:
   ```bash
   # Save backend logs
   pm2 logs translation-backend --lines 100 --nostream > backend-logs.txt
   
   # Save FFmpeg status
   ps aux | grep ffmpeg > ffmpeg-status.txt
   
   # Save streaming details
   cd backend
   node -e "..." > streaming-config.txt
   ```

2. **Check these specific things**:
   - Is RTMP server online? (Contact admin)
   - Are credentials correct? (Verify with admin)
   - Is CDN generating HLS? (Contact CDN support)
   - Are there firewall rules blocking RTMP port 1935?

3. **Last resort**: Use a different RTMP server for testing:
   - Try a free RTMP server like Twitch or YouTube
   - If it works there, problem is with your RTMP server
   - If it fails everywhere, problem is with FFmpeg setup

---

**Expected Behavior**: Stream should become available within 10-30 seconds. Anything longer indicates a problem with RTMP server, credentials, or CDN configuration.
