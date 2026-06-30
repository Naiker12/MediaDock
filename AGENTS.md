# Video Downloader Project

## Commands
- `pnpm frontend:dev` - Start frontend dev server (port 5173)
- `pnpm frontend:build` - Build frontend for production
- `pnpm backend:dev` - Build + start backend (port 3001)
- `pnpm backend:build` - Compile backend TypeScript
- `pnpm backend:start` - Start compiled backend

## Structure
- `frontend/` - React + Vite + TailwindCSS + shadcn/ui
- `backend/` - Express + TypeScript

## Architecture
- Frontend on GitHub Pages (static)
- Backend on Railway/Render/VPS (needs yt-dlp + FFmpeg)
- API: POST `/api/info` (get video metadata), POST `/api/download` (download)
- VideoService currently uses placeholder data - integrate with yt-dlp for production
