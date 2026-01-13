# React + TypeScript Frontend Setup Guide

## Project Structure Created

```
frontend-react/
├── src/
│   ├── components/          # React components
│   ├── contexts/           # React Context for state management
│   ├── services/           # API services
│   ├── types/              # TypeScript types
│   ├── hooks/              # Custom React hooks
│   └── styles/             # CSS/styling files
```

## Components to Create

The following components need to be created in `src/components/`:

1. **LoginForm.tsx** - Login component
2. **RegisterForm.tsx** - Registration component
3. **TranslationStudio.tsx** - Main translation interface
4. **VideoPlayer.tsx** - Video player component
5. **AudioControls.tsx** - Microphone controls
6. **LiveStatusIndicator.tsx** - Status indicator component
7. **LanguageDisplay.tsx** - Language display component
8. **MessageToast.tsx** - Toast notifications

## Installation Steps

1. Navigate to the React app:
```bash
cd /home/tniglobal/public_html/webrtc/browser-based-translation/frontend-react
```

2. Install dependencies (already done):
```bash
npm install hls.js axios @types/hls.js
```

3. Build for production:
```bash
npm run build
```

4. The build folder will contain the production-ready static files.

## Backend Configuration

The React app is configured to connect to:
- **Development**: http://localhost:3001
- **Production**: Same hostname as frontend on port 3001

## Running the App

### Development Mode
```bash
npm start
```
Runs on http://localhost:3000

### Production Build
```bash
npm run build
```
Creates optimized build in `build/` folder

## Deploying to Subdomain

1. Build the app: `npm run build`
2. Copy `build/*` contents to your subdomain directory
3. Configure web server (Apache/Nginx) to serve the static files
4. Ensure backend is accessible at `subdomain.com:3001` or configure proxy

## Environment Variables

Create `.env` file in frontend-react/:
```
REACT_APP_API_URL=https://your-backend-subdomain.com
REACT_APP_WS_URL=wss://your-backend-subdomain.com
```

## Next Steps

1. Complete all component files (see components list above)
2. Add styling (CSS modules or styled-components)
3. Test locally
4. Build for production
5. Deploy to subdomain
