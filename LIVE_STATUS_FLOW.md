# Live Status System - Visual Flow

## 🎯 The Problem We Solved

**Before**: Live indicator showed green as soon as "Start Translating" was clicked, even though the RTMP output wasn't available yet (404 error).

**After**: Live indicator only shows green when the RTMP output stream is confirmed available and returning HTTP 200.

---

## 📊 State Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interaction                         │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
            [Start Translating]
                    │
                    ▼
    ┌───────────────────────────────────┐
    │  Status: CONNECTING (🟠 Orange)   │
    │  isTranslating: true              │
    │  outputStreamAvailable: false     │
    └───────────┬───────────────────────┘
                │
                ├──► Connect WebSocket
                │
                ├──► Start MediaRecorder
                │
                ├──► Start RTMP Stream (Backend)
                │
                ▼
    ┌───────────────────────────────────┐
    │    Start Output Monitoring        │
    │  (Check every 3 seconds)          │
    └───────────┬───────────────────────┘
                │
                ▼
        ┌───────────────┐
        │ Is Output     │──── No ───┐
        │ Available?    │            │
        │ (HTTP 200?)   │            │
        └───────┬───────┘            │
                │                    │
               Yes                   │
                │                    │
                ▼                    │
    ┌───────────────────────────┐   │
    │ Status: ONLINE (🟢 Green) │   │
    │ outputStreamAvailable:    │   │
    │              true         │   │
    └───────────────────────────┘   │
                │                    │
                ├──► Refresh Video   │
                │    Player          │
                │                    │
                ├──► Stop Monitoring │
                │                    │
                ▼                    │
        [User sees LIVE]             │
                                     │
                                     ▼
                            ┌────────────────┐
                            │ Keep Checking  │
                            │ (Max 20 times) │
                            └────────────────┘
```

---

## 🔄 Store Data Flow

```
┌─────────────────────────────────────────────┐
│         Zustand Store (useAppStore)         │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │     Persistent Data (localStorage)    │ │
│  │  • user                               │ │
│  │  • token                              │ │
│  │  • streamingDetails                   │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │      Session Data (not persisted)     │ │
│  │  • isTranslating                      │ │
│  │  • liveStatus                         │ │
│  │  • outputStreamAvailable              │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │         Computed Getters              │ │
│  │  • getTranslationLanguage()           │ │
│  │  • getWatchUrl()                      │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
            │                    │
            │                    │
            ▼                    ▼
    [AuthContext]        [TranslationStudio]
    [Components]         [VideoPlayer]
```

---

## 📍 Status Indicator States

### 🔴 Offline (Red)
```
Conditions:
- isTranslating === false
- OR WebSocket closed

User sees:
- "OFFLINE" text
- Red dot (no animation)
- Button: "Start Translating" (enabled)
```

### 🟠 Connecting (Orange)
```
Conditions:
- isTranslating === true
- outputStreamAvailable === false
- WebSocket connected

User sees:
- "CONNECTING" text
- Orange dot with pulse animation
- Button: "Translating..." (disabled)
- Status: "Starting Stream..."

Background process:
- Checking output URL every 3 seconds
- Waiting for HTTP 200 response
```

### 🟢 Online (Green)
```
Conditions:
- isTranslating === true
- outputStreamAvailable === true
- WebSocket connected
- Output URL returns HTTP 200 ✓

User sees:
- "LIVE" text
- Green dot with pulse animation
- Button: "Translating..." (disabled)
- Status: "Translation Active - Stream Live ✓"

Confirmed:
- RTMP stream is processing
- Output is available to viewers
- Video player has refreshed
```

---

## 🎬 Complete Translation Session Timeline

```
Time    Event                          Live Status    Output Check
────────────────────────────────────────────────────────────────────
0:00    Click "Start Translating"      🔴 Offline    Not started
0:01    WebSocket connects             🟠 Connecting Starting...
0:02    RTMP stream starts             🟠 Connecting Checking...
0:03    First check (404)              🟠 Connecting ✗ Not available
0:06    Second check (404)             🟠 Connecting ✗ Not available
0:09    Third check (404)              🟠 Connecting ✗ Not available
0:12    Fourth check (200) ✓           🟢 ONLINE     ✓ AVAILABLE!
0:12    Video player refreshes         🟢 ONLINE     Monitoring stopped
...     User is translating            🟢 ONLINE     -
10:00   Click "Stop Streaming"         🔴 Offline    Not active
```

---

## 🧠 Store Persistence Logic

### What Gets Saved to localStorage:
```javascript
{
  "user": {
    "id": "...",
    "fullname": "John Doe",
    "email": "john@example.com",
    "language": { "value": "german", "label": "German" }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "streamingDetails": {
    "language": "german",
    "streamUrl": "rtmp://...",
    "watchUrl": "https://..."
  }
}
```

### What DOESN'T Get Saved (resets on refresh):
```javascript
{
  "isTranslating": false,        // Always starts as false
  "liveStatus": "offline",       // Always starts as offline
  "outputStreamAvailable": false // Always starts as false
}
```

### Why This Design?
- ✅ User stays logged in after refresh
- ✅ Translation language persists
- ✅ But session state (translating/live) resets
- ✅ Forces user to intentionally start a new session
- ✅ Prevents "ghost" live indicators

---

## 🔍 Output Stream Availability Check

### HTTP Request:
```javascript
const response = await fetch(outputVideoUrl, {
  method: 'HEAD',      // Only headers, no body
  cache: 'no-cache'    // Always fresh check
});

return response.ok && response.status === 200;
```

### Possible Responses:
| Status | Meaning                    | Action                  |
|--------|----------------------------|-------------------------|
| 200    | ✅ Stream is available     | Set status to ONLINE    |
| 404    | ❌ Stream not ready yet    | Keep checking           |
| 403    | 🔒 Access denied           | Show error              |
| 500    | 💥 Server error            | Retry                   |

### Check Frequency:
- Interval: Every 3 seconds
- Max checks: 20 times (60 seconds total)
- Stops when: Stream found OR timeout reached

---

## 🎯 Key Design Decisions

1. **Why separate `isTranslating` and `outputStreamAvailable`?**
   - `isTranslating`: User has clicked start, backend is processing
   - `outputStreamAvailable`: Stream is confirmed live for viewers
   - This distinction gives accurate status feedback

2. **Why check every 3 seconds?**
   - Fast enough to feel responsive
   - Not too aggressive on network
   - RTMP encoding typically takes 5-15 seconds

3. **Why stop after 20 checks?**
   - Prevents infinite loops
   - 60 seconds is reasonable timeout
   - User gets message if still not available

4. **Why use Zustand instead of Redux?**
   - Much simpler API
   - Built-in persistence
   - TypeScript friendly
   - Only ~1KB bundle size

---

## ✅ Testing Scenarios

### Scenario 1: Successful Stream Start
1. Login → ✅ Language shows "German"
2. Start translating → ✅ Status: "Connecting"
3. Wait 10 seconds → ✅ Status: "LIVE"
4. Output video plays → ✅ Stream visible

### Scenario 2: Page Refresh During Translation
1. User is translating (green status)
2. Refresh page → ✅ User still logged in
3. ✅ Language still shows "German"
4. ✅ Status resets to "Offline"
5. User must click "Start" again (expected)

### Scenario 3: Slow RTMP Processing
1. Start translating → Status: "Connecting"
2. Output checks: 404, 404, 404... (15 seconds)
3. Finally 200! → Status: "LIVE"
4. User sees "Output stream is live!" message

### Scenario 4: Network Issues
1. Start translating
2. Output checks timeout
3. Status stays "Connecting"
4. User sees "Output may take a few moments"
5. Can manually refresh video player

---

This system ensures users always know the REAL status of their translation stream! 🎉
