
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://i.imgur.com/5cY0Q5H.png">
    <img src="https://i.imgur.com/5cY0Q5H.png" alt="MediaDock Banner" width="100%">
  </picture>

  <div align="center">

  # MediaDock 🎬

  **Descargador de videos profesional con datos reales desde yt-dlp**

  ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)
  ![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
  ![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)
  ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?logo=tailwindcss)
  ![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express)
  ![yt-dlp](https://img.shields.io/badge/yt--dlp-2026.06-FF0000?logo=youtube)
  ![License](https://img.shields.io/badge/License-MIT-green)

  [✨ Características](#-características) •
  [🏗️ Arquitectura](#️-arquitectura) •
  [⚙️ Tecnologías](#️-tecnologías) •
  [🚀 Instalación](#-instalación) •
  [📡 API](#-api)

  </div>

  ---

  ## 📋 Descripción General

  **MediaDock** es una aplicación profesional de descarga de videos que extrae **metadatos reales** y permite descargar videos desde **múltiples plataformas** (YouTube, TikTok, Instagram, Facebook, Vimeo, Twitter/X, Twitch, Kick y sitios de streaming como Cuevana).

  > ⚡ **Sin datos placeholder.** Toda la información proviene de `yt-dlp` y extractores reales.

  ### 🎯 Objetivos

  - **Extraer metadatos reales** de cualquier URL (título, thumbnail HD, duración, uploader, subtítulos, calidades disponibles)
  - **Descargar videos** en la calidad seleccionada con progreso en tiempo real
  - **Soporte multiplataforma** via yt-dlp + extractores dedicados
  - **Experiencia fluida** con animaciones, atajos de teclado, notificaciones desktop e historial persistente

  ---

  ## ✨ Características

  - 🔍 Análisis con datos reales de yt-dlp (sin placeholders)
  - 💾 Caché de metadatos (memoria + disco, TTL 10 min)
  - 📐 7+ calidades detectadas automáticamente (2160p → Audio)
  - 🎞️ Codec, FPS, bitrate, HDR y dimensiones reales
  - 📝 Subtítulos e idioma detectados automáticamente
  - 🖼️ Thumbnail en máxima resolución (maxresdefault)
  - 🚫 Cancelar descarga en tiempo real (AbortController)
  - 🔔 Notificaciones desktop al completar
  - 📜 Historial clickeable agrupado por día
  - ✅ Validación de URL en tiempo real con detección de plataforma
  - 🎨 Colores por calidad (4K púrpura, 2K índigo, FHD azul, HD gris, audio verde)
  - ⌨️ Atajos de teclado (`?` para ver todos)
  - 📤 Compartir en Twitter/Facebook
  - 📱 PWA-ready (manifest + icons)
  - ⚡ Code splitting (6 chunks lazy-loaded)
  - 🌙 Modo oscuro forzado

  ---

  ## 🏗️ Arquitectura

  ```
  Frontend (React + Vite → GitHub Pages)
  Backend  (Express + TypeScript → Railway/Render/VPS)
  Dependencias externas: yt-dlp + FFmpeg
  ```

  **Flujo de análisis:**
  1. Cliente envía URL → `POST /api/analyze`
  2. Backend verifica caché (memoria + disco, TTL 10 min)
  3. `ExtractorRegistry` selecciona extractor según URL
  4. Datos extraídos → `parseYtDlpOutput()` → `VideoInfo` normalizado
  5. Se guarda en caché y se devuelve al cliente

  **Flujo de descarga:**
  1. Cliente envía `POST /api/download { url, qualityId }`
  2. Backend stremea el video directamente al cliente
  3. Cliente recibe con `axios.onDownloadProgress` y guarda el archivo

  ---

  ## ⚙️ Tecnologías

  ### Frontend
  React 18 · Vite 5 · TypeScript 5 · TailwindCSS 3 · shadcn/ui · Framer Motion 11 · TanStack Query 5 · Zustand 5 · Axios · Zod · Sonner · Lucide React · Radix UI

  ### Backend
  Express 4 · TypeScript 5 · Helmet · CORS · Morgan · express-rate-limit (10 req/min) · Zod · Cheerio

  ### Sistema
  yt-dlp 2026.06 · FFmpeg N-124716 · Node.js 20+ · pnpm · Docker

  ---

  ## 🚀 Instalación

  ```powershell
  # 1. Instalar yt-dlp + FFmpeg
  winget install yt-dlp.yt-dlp

  # 2. Clonar e instalar
  git clone https://github.com/Naiker12/MediaDock.git
  cd MediaDock
  pnpm install
  cp frontend/.env.example frontend/.env
  cp backend/.env.example backend/.env

  # 3. Iniciar (dos terminales)
  pnpm frontend:dev   # http://localhost:5173
  pnpm backend:start  # http://localhost:3001
  ```

  > Abre una **nueva terminal** después de instalar yt-dlp para que el PATH se actualice.

  ### Docker
  ```bash
  cd backend
  docker build -t mediadock-backend .
  docker run -p 3001:3001 mediadock-backend
  ```

  ---

  ## 📡 API

  ### POST /api/analyze
  ```json
  // Request
  { "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }

  // Response 200
  {
    "cached": false,
    "info": {
      "id": "dQw4w9WgXcQ",
      "title": "Rick Astley - Never Gonna Give You Up (Official Video)",
      "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "duration": 213,
      "durationString": "3:33",
      "uploader": "Rick Astley",
      "source": "youtube",
      "language": "en",
      "subtitles": ["en", "de-DE", "ja", "pt-BR", "es-419"],
      "qualities": [
        { "label": "2.16k", "codec": "VP9", "width": 3840, "height": 2160, "fps": 25, "bitrate": 20857000, "filesize": 358612992, "isBest": true },
        { "label": "1.44k", "codec": "VP9", "width": 2560, "height": 1440 },
        { "label": "1.08k", "codec": "avc1.640028", "extension": "mp4" },
        { "label": "720p", "codec": "avc1.4d401f", "extension": "mp4" },
        { "label": "480p", "codec": "avc1.4d401e", "extension": "mp4" },
        { "label": "360p", "codec": "avc1.4d401e", "extension": "mp4" },
        { "label": "Audio", "codec": "mp4a.40.5", "extension": "m4a" }
      ]
    }
  }
  ```

  ### POST /api/info
  Igual que `/api/analyze` pero devuelve solo `info`.

  ### POST /api/download
  ```json
  // Request
  { "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "qualityId": "4029" }

  // Response 200: Binary stream (video/mp4)
  ```

  ### GET /health
  ```json
  { "status": "ok", "timestamp": "..." }
  ```

  ---

  <div align="center">
    Hecho con ❤️ por <a href="https://github.com/Naiker12">Naiker12</a>
  </div>
