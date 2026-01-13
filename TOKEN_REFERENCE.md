# Quick Reference - Token Management

## Token Flow Diagram

```
┌─────────────────────────────────────────────────┐
│              User Logs In                       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  AuthContext       │
        │  calls             │
        │  store.login()     │
        └────────┬───────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │   Zustand Store (useAppStore)  │
    │                                │
    │   1. Saves to store state      │
    │   2. Persists via middleware   │
    │   3. Syncs to localStorage ✅  │
    └────┬──────────────────────┬────┘
         │                      │
         │                      │
         ▼                      ▼
┌─────────────────┐    ┌──────────────────┐
│  Zustand Store  │    │  localStorage    │
│  state.token    │    │  'token'         │
└────┬────────────┘    └────┬─────────────┘
     │                      │
     │                      │
     ▼                      ▼
┌─────────────────┐    ┌──────────────────┐
│  WebSocket      │    │  Axios           │
│  Auth           │    │  Interceptor     │
└─────────────────┘    └──────────────────┘
```

## Where Token is Stored

| Location | Access Method | Purpose |
|----------|--------------|---------|
| **Zustand Store** | `useAppStore.getState().token` | Primary state management |
| **localStorage** | `localStorage.getItem('token')` | Persistence & compatibility |
| **Zustand Persist** | Automatic | Auto-save to localStorage |

## Token Usage Points

### 1. WebSocket Connection
**File**: `TranslationStudio.tsx`

```typescript
const { token } = useAppStore.getState();

wsRef.current?.send(JSON.stringify({
  type: 'auth',
  token: token  // ✅ From store
}));
```

### 2. Axios API Requests
**File**: `api.ts`

```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');  // ✅ Synced from store
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. React Components
**File**: Any component

```typescript
const { token } = useAppStore();  // ✅ Reactive hook

// OR

const token = useAppStore.getState().token;  // ✅ Direct access
```

## Login/Logout Actions

### Login
```typescript
// In AuthContext
const login = async (email: string, password: string) => {
  const data = await authService.login({ email, password });
  
  // This saves to BOTH store and localStorage
  storeLogin(data.user, data.token, data.streamingDetails);
};
```

### Logout
```typescript
// In AuthContext
const logout = () => {
  // This removes from BOTH store and localStorage
  storeLogout();
};
```

## Debugging Token Issues

### Check if token exists
```javascript
// In browser console
console.log('Store:', useAppStore.getState().token);
console.log('localStorage:', localStorage.getItem('token'));

// Both should match!
```

### Check token in requests
```javascript
// In browser DevTools → Network tab
// Click on any API request
// Headers → Request Headers
// Should see: Authorization: Bearer eyJhbGci...
```

### Check WebSocket auth
```javascript
// In browser console, look for:
// ✓ WebSocket CONNECTED
// 📤 Sent auth message with token
// 🔐 Using token: eyJhbGciOiJIUzI1NiIs...
// ✓ WebSocket AUTHENTICATED
```

## Common Scenarios

### ✅ Fresh Login
```
1. Enter email/password
2. Click "Login"
3. Token saved to store → auto-synced to localStorage
4. User redirected to translation studio
5. All API calls include token
6. WebSocket authenticates successfully
```

### ✅ Page Refresh
```
1. Page reloads
2. Zustand persist middleware loads from localStorage
3. Store rehydrates with token
4. User still logged in
5. No re-authentication needed
```

### ✅ Start Translation
```
1. Click "Start Translating"
2. WebSocket gets token from store
3. Sends auth message
4. Backend validates
5. Connection established
6. Streaming begins
```

### ✅ Logout
```
1. Click "Logout"
2. Store clears all state
3. localStorage cleared
4. User redirected to login
5. All WebSocket connections closed
```

## Error Prevention

### ❌ WRONG - Don't do this
```typescript
// Manually setting localStorage without store
localStorage.setItem('token', 'abc123');  // ❌ Store won't know!
```

### ✅ CORRECT - Always use store
```typescript
// Use store actions
const { login } = useAppStore();
login(user, token, details);  // ✅ Syncs automatically!
```

## File Checklist

Files that handle token:

- [x] `src/store/useAppStore.ts` - Primary storage + localStorage sync
- [x] `src/contexts/AuthContext.tsx` - Login/logout actions
- [x] `src/services/api.ts` - Axios interceptor
- [x] `src/components/TranslationStudio.tsx` - WebSocket auth
- [x] `src/components/LoginForm.tsx` - Login UI
- [x] `src/components/RegisterForm.tsx` - Registration UI

## Quick Commands

```bash
# Check React app is running
ps aux | grep "react-scripts"

# Check backend is running with PM2
pm2 list

# View backend logs
pm2 logs translation-backend

# Restart if needed
pm2 restart translation-backend

# Check frontend in browser
# http://localhost:3000
```

## Success Indicators

✅ Login shows: "Login successful!"  
✅ Console shows: "✓ WebSocket AUTHENTICATED"  
✅ Status shows: 🟠 Connecting → 🟢 ONLINE  
✅ No 401 errors in Network tab  
✅ Translation starts without errors  

---

**Remember**: The store is the single source of truth. It automatically syncs with localStorage. Never bypass the store!
