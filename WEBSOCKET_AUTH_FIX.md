# WebSocket Authentication Fix

## Issue
WebSocket was failing with "Authentication required" error because the token wasn't being retrieved correctly from the store.

## Root Cause
The WebSocket connection was trying to get the token from `localStorage.getItem('token')` but the Zustand store wasn't syncing with localStorage properly.

## Solution Applied

### 1. Updated TranslationStudio.tsx
```typescript
// Before (WRONG)
const token = localStorage.getItem('token');

// After (CORRECT)
const { token } = useAppStore.getState();
```

### 2. Updated useAppStore.ts
Added localStorage sync in login/logout actions:

```typescript
login: (user, token, streamingDetails) => {
  set({ user, token, streamingDetails, ... });
  // ✅ Also save to localStorage for compatibility
  localStorage.setItem('token', token);
},

logout: () => {
  set({ user: null, token: null, ... });
  // ✅ Also remove from localStorage
  localStorage.removeItem('token');
}
```

### 3. Updated api.ts
Enhanced the axios interceptor to fallback to store:

```typescript
api.interceptors.request.use((config) => {
  // First try localStorage
  let token = localStorage.getItem('token');
  
  // Fallback to store if needed
  if (!token) {
    const { useAppStore } = require('../store/useAppStore');
    token = useAppStore.getState().token;
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## How It Works Now

### Login Flow
```
1. User logs in
   ↓
2. AuthContext calls store.login(user, token, details)
   ↓
3. Store saves to Zustand state
   ↓
4. Store ALSO saves token to localStorage ✅
   ↓
5. Token now available in both places
```

### WebSocket Connection
```
1. User clicks "Start Translating"
   ↓
2. TranslationStudio gets token from store: useAppStore.getState().token
   ↓
3. WebSocket connects
   ↓
4. Sends auth message: { type: 'auth', token: '...' }
   ↓
5. Backend validates token ✅
   ↓
6. WebSocket authenticated successfully
```

### API Requests
```
1. axios interceptor runs before each request
   ↓
2. Gets token from localStorage (synced by store)
   ↓
3. Adds header: Authorization: Bearer <token>
   ↓
4. Request succeeds ✅
```

## Token Storage Strategy

We now use a **dual storage approach**:

1. **Zustand Store** (primary)
   - Reactive state management
   - Auto-persistence via persist middleware
   - Accessible via `useAppStore()`

2. **localStorage** (compatibility)
   - Direct access for WebSocket, axios
   - Synced automatically on login/logout
   - Fallback for non-React code

## Testing Checklist

- [x] Login saves token to both store and localStorage
- [x] WebSocket gets token from store
- [x] axios gets token from localStorage
- [x] Logout removes token from both places
- [x] Page refresh preserves token
- [x] No more "Authentication required" errors

## Debug Tips

If you see authentication errors:

1. **Check store state:**
   ```javascript
   console.log('Store token:', useAppStore.getState().token);
   ```

2. **Check localStorage:**
   ```javascript
   console.log('localStorage token:', localStorage.getItem('token'));
   ```

3. **Check axios headers:**
   ```javascript
   // In browser DevTools Network tab
   // Look for Authorization: Bearer <token> header
   ```

4. **Check WebSocket auth message:**
   ```javascript
   // Look for this in console:
   // 📤 Sent auth message with token
   // 🔐 Using token: eyJhbGciOiJIUzI1NiIs...
   ```

## Common Errors Fixed

### ❌ Before
```
WebSocket error: Authentication required
POST /streaming/stop 401 (Unauthorized)
WebSocket connection timeout
```

### ✅ After
```
✓ WebSocket CONNECTED
📤 Sent auth message with token
✓ WebSocket AUTHENTICATED
🎥 Starting RTMP stream...
```

## Architecture Benefits

✅ **Single source of truth**: Store manages all state  
✅ **Automatic sync**: localStorage always matches store  
✅ **No conflicts**: Both systems work together  
✅ **Backward compatible**: Existing code still works  
✅ **Type-safe**: Full TypeScript support  

---

**Status**: ✅ Fixed and deployed
**Impact**: All WebSocket and API authentication now works correctly
