# State Management with Zustand

## Overview
The application now uses **Zustand** for centralized state management with persistence. This ensures user data and translation language are preserved across page refreshes.

## Store Location
`src/store/useAppStore.ts`

## Features

### 1. **Persistent Storage**
- User data, authentication token, and streaming details are automatically saved to `localStorage`
- Data persists across browser refreshes and sessions
- Translation language is never lost

### 2. **Centralized State**
All app state is managed in one place:
- `user`: Current user object (fullname, email, language, etc.)
- `streamingDetails`: RTMP URLs, language, watch URLs
- `token`: JWT authentication token
- `isTranslating`: Current translation session status
- `liveStatus`: 'offline' | 'connecting' | 'online'
- `outputStreamAvailable`: Boolean indicating if RTMP output is ready

### 3. **Smart Live Status**
The live indicator now shows:
- **🔴 RED (Offline)**: Not translating
- **🟠 ORANGE (Connecting)**: Translation started, waiting for RTMP output
- **🟢 GREEN (Online)**: RTMP output stream is confirmed available

### 4. **Output Stream Verification**
The app now checks if the output stream is actually available:
- Makes HTTP HEAD requests to the output URL every 3 seconds
- Only shows "LIVE" when the stream returns HTTP 200
- Automatically refreshes the output video player when stream becomes available

## Usage in Components

### Import the Store
```typescript
import { useAppStore } from '../store/useAppStore';
```

### Access State
```typescript
const { 
  user, 
  streamingDetails, 
  liveStatus,
  getTranslationLanguage,
  getWatchUrl 
} = useAppStore();
```

### Update State
```typescript
const { 
  setLiveStatus, 
  setOutputStreamAvailable 
} = useAppStore();

setLiveStatus('online');
setOutputStreamAvailable(true);
```

### Computed Getters
```typescript
// Get formatted translation language (capitalized, never "unknown")
const language = getTranslationLanguage();

// Get correct watch URL from streamingDetails or fallback
const watchUrl = getWatchUrl();
```

## How It Works

### Login Flow
1. User logs in via `AuthContext`
2. `authService.login()` returns user, token, streamingDetails
3. Store's `login()` action saves all data
4. Data persists to localStorage automatically

### Translation Flow
1. User clicks "Start Translating"
2. `setLiveStatus('connecting')` - Orange indicator
3. `setOutputStreamAvailable(false)` - Output not ready yet
4. RTMP stream starts on backend
5. Every 3 seconds, app checks if output URL is available
6. When output returns HTTP 200:
   - `setOutputStreamAvailable(true)`
   - `setLiveStatus('online')` - **Green indicator**
   - Output video player refreshes automatically

### Page Refresh
1. Store automatically rehydrates from localStorage
2. User, token, and streamingDetails are restored
3. Translation language persists
4. User doesn't need to log in again

## Benefits

✅ **No more "Unknown" language** after refresh  
✅ **Accurate live status** - only green when stream is actually available  
✅ **Persistent user data** across page reloads  
✅ **Centralized state** - easier to debug and maintain  
✅ **Type-safe** - Full TypeScript support  
✅ **Lightweight** - Zustand is only ~1KB  

## Migration from Previous System

### Before (React Context + localStorage)
```typescript
const [user, setUser] = useState(null);
const [token, setToken] = useState(localStorage.getItem('token'));
```

### After (Zustand Store)
```typescript
const { user, token } = useAppStore();
```

All localStorage management is handled automatically by Zustand's persist middleware!
