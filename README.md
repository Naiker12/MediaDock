
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
  [🖥️ Capturas](#️-capturas) •
  [🏗️ Arquitectura](#️-arquitectura) •
  [⚙️ Tecnologías](#️-tecnologías) •
  [🚀 Instalación](#-instalación) •
  [📡 API](#-api) •
  [📁 Estructura](#-estructura) •
  [📊 Estados UI](#-estados-ui) •
  [✅ Features](#-features) •
  [📋 Tareas Pendientes](#-tareas-pendientes)

  </div>

  ---

  ## 📋 Descripción General

  **MediaDock** es una aplicación profesional de descarga de videos que extrae **metadatos reales** y permite descargar videos desde **múltiples plataformas** (YouTube, TikTok, Instagram, Facebook, Vimeo, Twitter/X, Twitch, Kick y sitios de streaming como Cuevana).

  > ⚡ **Sin datos placeholder.** Toda la información proviene de `yt-dlp` y extractores reales.

  ### 🎯 Objetivos del Proyecto

  - **Extraer metadatos reales** de cualquier video URL (título, thumbnail HD, duración, uploader, descripción, subtítulos, calidades disponibles)
  - **Descargar videos** en la calidad seleccionada con progreso en tiempo real
  - **Soporte multiplataforma** (YouTube, TikTok, Instagram, Facebook, Vimeo, Twitter/X, Twitch, Kick, Cuevana, y más vía yt-dlp)
  - **Experiencia de usuario fluida** con animaciones, atajos de teclado, notificaciones desktop e historial persistente
  - **Arquitectura modular** con sistema de extractores plugables, caché inteligente y pipeline de metadatos

  ---

  ## ✨ Características

  - 🔍 **Análisis con datos reales** de yt-dlp (sin placeholders)
  - 💾 **Caché de metadatos** (memoria + disco, TTL 10 min)
  - 📐 **7+ calidades detectadas** automáticamente (2160p → Audio)
  - 🎞️ **Codec, FPS, bitrate, HDR** y dimensiones reales
  - 📝 **Subtítulos e idioma** detectados automáticamente
  - 🖼️ **Thumbnail en máxima resolución** disponible (maxresdefault)
  - 🚫 **Cancelar descarga** en tiempo real (AbortController)
  - 🔔 **Notificaciones desktop** al completar descarga
  - 📜 **Historial clickeable** agrupado por día (Hoy/Ayer/Anteriores)
  - ✅ **Validación de URL** en tiempo real con detección de plataforma
  - 🎨 **Colores por calidad** (4K púrpura, 2K índigo, FHD azul, HD gris, audio verde)
  - ⌨️ **Atajos de teclado** (presiona `?` para ver todos)
  - 📤 **Compartir** en Twitter/Facebook
  - 📱 **PWA-ready** (manifest + icons)
  - ⚡ **Code splitting** (6 chunks lazy-loaded)
  - 🌙 **Modo oscuro** forzado

  ---

  ## 🖥️ Capturas

  | Estado | Vista |
  |--------|-------|
  | **IDLE** | Input de URL con detección de plataforma y botón "Analizar" |
  | **LOADING** | Barra de progreso animada con 4 pasos |
  | **SUCCESS** | Thumbnail HD, metadatos completos, tarjetas de calidad por color |
  | **DOWNLOAD** | Progreso en tiempo real, botón de cancelar, notificación al completar |
  | **ERROR** | Mensajes clasificados por tipo (red, servidor, extractor, URL inválida) |
  | **HISTORY** | Descargas recientes agrupadas por Hoy/Ayer/Anteriores |

  ---

  ## 🏗️ Arquitectura

  ### Frontend (React + Vite → GitHub Pages)

  ```
  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
  │  VideoInput  │───▶│  useVideoInfo│───▶│  VideoPreview │
  │  (URL +      │    │  (TanStack   │    │  (Thumbnail   │
  │   validación)│    │   Query)     │    │   + metadatos)│
  └─────────────┘    └──────┬───────┘    └──────┬─────────┘
                            │                    │
                            ▼                    ▼
                     ┌──────────────┐    ┌──────────────┐
                     │   api.ts     │    │DownloadSection│
                     │  (Axios +    │    │+ QualityCard  │
                     │  interceptors)│   │+ HistorySection│
                     └──────────────┘    └──────────────┘
  ```

  ### Backend (Express + TypeScript → Railway/Render/VPS)

  ```
  POST /api/analyze { url }
       │
       ▼
  ┌─ Cache ───────────────────────┐
  │ ¿URL ya analizada?            │
  │ ├─ Sí → devolver datos        │
  │ └─ No → continuar             │
  └───────────────────────────────┘
       │
       ▼
  ┌─ ExtractorRegistry ───────────┐
  │ CuevanaExtractor (sites)      │
  │   └── HTML scraping + iframes │
  │ YtDlpExtractor (yt-dlp JSON)  │
  │   └── --dump-single-json      │
  │ DemoExtractor (fallback)      │
  └───────────────────────────────┘
       │
       ▼
  ┌─ Parser ──────────────────────┐
  │ parseYtDlpOutput()            │
  │ → VideoInfo normalizado       │
  └───────────────────────────────┘
       │
       ▼
  ┌─ Cache ───────────────────────┐
  │ Guardar en memoria + disco    │
  └───────────────────────────────┘
       │
       ▼
  Response: { info: VideoInfo, cached: boolean }
  ```

  ### Data Flow (POST /api/download)

  ```
  1. Cliente → POST /api/download { url, qualityId }
  2. Controller valida con Zod
  3. ExtractorRegistry.download(url, qualityId)
     ├── YtDlpExtractor: yt-dlp -f formatId -o - url
     └── CuevanaExtractor: stream desde URL directa
  4. Stream pipe → Response (video/mp4)
  5. Cliente recibe con axios onDownloadProgress
  6. Blob descargado → link.click() → guardar en disco
  ```

  ---

  ## ⚙️ Tecnologías

  ### Frontend

  | Tecnología | Versión | Propósito |
  |------------|---------|-----------|
  | React | ^18.3.1 | UI library |
  | Vite | ^5.4.9 | Build tool / dev server |
  | TypeScript | ^5.6.3 | Type safety |
  | TailwindCSS | ^3.4.13 | CSS framework |
  | shadcn/ui | latest | Componentes UI accesibles |
  | Framer Motion | ^11.11.1 | Animaciones |
  | TanStack Query | ^5.59.0 | Server state / mutations |
  | Zustand | ^5.0.0 | State management (persist) |
  | Axios | ^1.7.7 | HTTP client (onDownloadProgress) |
  | Zod | ^3.23.8 | Schema validation |
  | React Hook Form | ^7.53.1 | Form management |
  | Sonner | ^1.7.0 | Toast notifications |
  | Lucide React | ^0.447.0 | Icon library |
  | Radix UI | - | Primitivas accesibles |
  | clsx + tailwind-merge | - | Clases condicionales |

  ### Backend

  | Tecnología | Versión | Propósito |
  |------------|---------|-----------|
  | Node.js | 20+ | Runtime |
  | Express | ^4.21.1 | Web framework |
  | TypeScript | ^5.6.3 | Type safety |
  | Helmet | ^8.0.0 | Seguridad HTTP headers |
  | CORS | ^2.8.5 | Cross-origin |
  | Morgan | ^1.10.0 | HTTP logging |
  | express-rate-limit | ^7.4.1 | Rate limiting (10 req/min) |
  | Zod | ^3.23.8 | Request validation |
  | Cheerio | ^1.2.0 | HTML parsing (Cuevana) |

  ### Dependencias del Sistema

  | Herramienta | Propósito |
  |-------------|-----------|
  | yt-dlp ^2026.06.09 | Extracción de metadatos + descarga de videos |
  | FFmpeg N-124716 | Conversión de formatos (HLS → mp4) |

  ---

  ## 🚀 Instalación

  ### Prerrequisitos

  - **Node.js** 20+
  - **pnpm** (instalar con `npm i -g pnpm`)
  - **yt-dlp** y **FFmpeg** (instalar con winget o manualmente)

  ### Instalación de yt-dlp + FFmpeg

  ```powershell
  winget install yt-dlp.yt-dlp
  ```

  > Abre una **nueva ventana** de PowerShell para que el PATH se actualice.

  ### Configuración del proyecto

  ```bash
  # Clonar el repositorio
  git clone https://github.com/Naiker12/MediaDock.git
  cd MediaDock

  # Instalar dependencias
  pnpm install

  # Configurar variables de entorno
  cp frontend/.env.example frontend/.env
  cp backend/.env.example backend/.env
  ```

  ### Iniciar en desarrollo

  ```bash
  # Terminal 1: Frontend (http://localhost:5173)
  pnpm frontend:dev

  # Terminal 2: Backend (http://localhost:3001)
  pnpm backend:start
  ```

  > El frontend en dev proxy automáticamente `/api` → `localhost:3001`.

  ### Docker (producción)

  ```bash
  cd backend
  docker build -t mediadock-backend .
  docker run -p 3001:3001 mediadock-backend
  ```

  ### Build para producción

  ```bash
  pnpm frontend:build   # → frontend/dist/ (static files)
  pnpm backend:build    # → backend/dist/ (compiled JS)
  pnpm backend:start    # Node dist/index.js
  ```

  ---

  ## 📡 API

  ### POST /api/analyze

  Obtiene metadatos completos de un video.

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
      "description": "The official video...",
      "duration": 213,
      "durationString": "3:33",
      "uploader": "Rick Astley",
      "source": "youtube",
      "language": "en",
      "subtitles": ["en", "de-DE", "ja", "pt-BR", "es-419"],
      "qualities": [
        { "id": "4029", "label": "2.16k", "codec": "VP9", "width": 3840, "height": 2160, "fps": 25, "bitrate": 20857000, "filesize": 358612992, "extension": "webm", "audioCodec": "opus", "isHDR": false, "isBest": true },
        { "label": "1.44k", "codec": "VP9", "extension": "webm", "width": 2560, "height": 1440 },
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

  Igual que `/api/analyze` pero devuelve solo el objeto `info`.

  ### POST /api/download

  Descarga un video en la calidad especificada.

  ```json
  // Request
  { "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "qualityId": "4029" }

  // Response 200: Binary stream (video/mp4)
  // Response 503: { "error": "yt-dlp no instalado...", "code": "EXTRACTOR_UNAVAILABLE" }
  ```

  ### GET /health

  ```json
  { "status": "ok", "timestamp": "2026-06-30T12:00:00.000Z" }
  ```

  ---

  ## 📁 Estructura del Proyecto

  ```
  MediaDock/
  │
  ├── package.json                 # Monorepo root (pnpm workspace)
  ├── pnpm-workspace.yaml          # Workspace: frontend/ + backend/
  ├── pnpm-lock.yaml
  ├── .gitignore
  ├── AGENTS.md                    # Instrucciones para asistentes AI
  ├── setup-windows.ps1            # Script de instalación automatizada
  │
  ├── frontend/                    # React + Vite + Tailwind + shadcn/ui
  │   ├── package.json
  │   ├── vite.config.ts           # @ alias + /api proxy → :3001
  │   ├── tsconfig.json
  │   ├── tailwind.config.ts       # Paleta oscura personalizada
  │   ├── components.json          # shadcn/ui config oficial
  │   ├── index.html               # Dark mode + PWA meta tags
  │   ├── .env.example
  │   ├── public/
  │   │   ├── manifest.json        # PWA manifest
  │   │   └── icons/               # PWA icons
  │   │
  │   └── src/
  │       ├── main.tsx             # Entry + Notification.requestPermission()
  │       ├── App.tsx              # ErrorBoundary wrapper
  │       ├── index.css            # Tailwind directives + shimmer
  │       ├── types/index.ts       # VideoInfo, VideoQuality, etc.
  │       ├── store/useAppStore.ts # Zustand persist (historial)
  │       ├── hooks/useVideoInfo.ts# TanStack Query mutation
  │       ├── services/api.ts      # Axios + endpoints
  │       ├── utils/format.ts      # formatSize, formatBitrate, etc.
  │       ├── lib/
  │       │   ├── utils.ts         # cn() utility
  │       │   └── downloadManager.ts # AbortController global
  │       ├── pages/Home.tsx       # Auto-scroll + lazy loading
  │       └── components/
  │           ├── ErrorBoundary.tsx
  │           ├── Navbar.tsx
  │           ├── VideoInput.tsx   # Validación URL + auto-paste
  │           ├── Loading.tsx      # Barra progreso + 4 pasos
  │           ├── VideoPreview.tsx # Thumbnail + metadatos + modal HD
  │           ├── DownloadSection.tsx # Progress + History + Cancel
  │           ├── QualityCard.tsx  # Colores por calidad
  │           ├── ErrorState.tsx   # Errores clasificados
  │           ├── ShareButton.tsx  # Copiar + Twitter/Facebook
  │           ├── KeyboardShortcuts.tsx # Modal atajos
  │           ├── Footer.tsx
  │           └── ui/              # shadcn/ui primitives
  │
  └── backend/                     # Express + TypeScript + yt-dlp + FFmpeg
      ├── package.json
      ├── tsconfig.json            # NodeNext ESM
      ├── Dockerfile               # Node 20-alpine + yt-dlp + ffmpeg
      ├── .env.example
      │
      └── src/
          ├── index.ts             # Express + helmet + cors + morgan + rate-limit
          ├── routes/video.ts      # POST /api/analyze, /info, /download
          ├── controllers/videoController.ts # Zod validation + stream
          ├── middlewares/errorHandler.ts    # Errores clasificados
          ├── services/
          │   ├── types.ts         # Tipos expandidos
          │   ├── videoService.ts  # Orquestador: cache → extract → parse
          │   ├── yt-dlp/index.ts  # findBinary() con winget + PATH
          │   └── ffmpeg/index.ts  # convert() + convertUrl()
          ├── extractor/
          │   ├── types.ts         # Extractor interface
          │   ├── registry.ts      # ExtractorRegistry
          │   ├── yt-dlp.ts        # YtDlpExtractor (--dump-single-json)
          │   ├── demo.ts          # DemoExtractor (fallback)
          │   └── cuevana/         # CuevanaExtractor (HTML scraping)
          ├── parser/metadata.ts   # parseYtDlpOutput() → VideoInfo
          └── cache/index.ts       # VideoCache (memoria + disco, TTL 10min)
  ```

  ---

  ## 📊 Estados UI

  ### IDLE
  ```
  ┌──────────────────────────────────────┐
  │         MediaDock                     │
  │   Pega la URL del video y descarga   │
  │  ┌────────────────────────────────┐  │
  │  │ Pega aquí la URL del video...  │  │
  │  └────────────────────────────────┘  │
  │  ✓ URL válida: youtube.com           │
  │          [  Analizar  ]              │
  └──────────────────────────────────────┘
  ```

  ### LOADING
  ```
  ┌──────────────────────────────────────┐
  │  ████████████████████████░░░ 85%    │
  │  ✓ Analizando enlace...              │
  │  ✓ Obteniendo miniatura...           │
  │  ✓ Leyendo formatos disponibles...   │
  │  ◌ Preparando descarga               │
  └──────────────────────────────────────┘
  ```

  ### SUCCESS
  ```
  ┌─────────────────────────────────────────────────┐
  │ ✓ youtube / Rick Astley...             [Cambiar]│
  ├─────────────────────────────────────────────────┤
  │ ┌──────────────┐  ┌────────────────────────────┐│
  │ │  THUMBNAIL   │  │ Rick Astley                ││
  │ │     HD       │  │ Never Gonna Give You Up... ││
  │ │              │  │ youtube | 2026              ││
  │ │      ▶       │  │ ★★★★★                      ││
  │ │              │  │ RECOMENDADO: 2.16k VP9 342MB││
  │ │ HD 2160p 3:33│  ├────────────────────────────┤│
  │ └──────────────┘  │ Duración   3:33   2160p    ││
  │  youtube | R.A.   │ FPS        25    VP9       ││
  │                   │ Audio   opus  20.9 Mbps    ││
  │ Calidades:        │ Subtítulos 5  HDR: No     ││
  │ ┌──────┐ ┌──────┐└──────────────┬──────────────┘│
  │ │★ BEST│ │1.44k │               │               │
  │ │ 2.16k│ │ VP9  │      [Descargar]              │
  │ │342MB │ │144MB │                               │
  │ └──────┘ └──────┘                               │
  │                                                 │
  │ Descargas recientes                             │
  │ Hoy                                             │
  │ ┌──────────────────────────┐                    │
  │ │🖼 Rick Astley  2160p  ↻ ✔│ hace 2m           │
  │ └──────────────────────────┘                    │
  └─────────────────────────────────────────────────┘
  ```

  ---

  ## ✅ Features Implementadas

  - [x] Análisis con datos REALES de yt-dlp (sin placeholders)
  - [x] Caché de metadatos (memoria + disco, TTL 10 min)
  - [x] 7+ calidades detectadas automáticamente
  - [x] Codec, fps, bitrate, HDR, dimensiones reales
  - [x] Subtítulos e idioma detectados automáticamente
  - [x] POST /api/analyze (endpoint dedicado)
  - [x] Uploader, fecha, descripción extraídos
  - [x] Thumbnail en máxima resolución disponible
  - [x] Cancelar descarga real (AbortController)
  - [x] Notificaciones desktop al completar
  - [x] Historial clickeable (re-analizar)
  - [x] Validación URL en tiempo real
  - [x] Errores clasificados por tipo (red, servidor, extractor, URL)
  - [x] Auto-scroll a resultados
  - [x] Atajos de teclado (presionar `?`)
  - [x] Compartir en Twitter/Facebook
  - [x] PWA manifest + icons
  - [x] Code splitting (6 chunks lazy-loaded)
  - [x] Colores por calidad (púrpura 4K, índigo 2K, azul 1080p, gris 720p, verde audio)
  - [x] Grupo de historial por día (Hoy/Ayer/Anteriores)
  - [x] findBinary() con detección automática de winget
  - [x] Soporte Cuevana (HTML scraping + iframes)
  - [x] Rate limiting (10 req/min)
  - [x] Dockerfile listo para producción

  ---

  ## 🔧 Solución de Problemas

  | Error | Causa | Solución |
  |-------|-------|----------|
  | 503 Service Unavailable | yt-dlp no instalado o no encontrado | `winget install yt-dlp.yt-dlp` o configurar `YT_DLP_PATH` en `.env` |
  | PATH desactualizado | winget instaló pero PATH nuevo no cargado | Abrir nueva terminal o configurar ruta exacta en `.env` |
  | ERR_MODULE_NOT_FOUND | Imports sin extensión `.js` | Todos los imports en backend ya usan `.js` (NodeNext) |
  | Sin progreso de descarga | Falta callback onDownloadProgress | Ya implementado via Axios |
  | Sin caché | Cada análisis ejecutaba yt-dlp | Ya implementado VideoCache |

  ---

  ## 📋 Tareas Pendientes

  ### Prioridad Alta
  - [ ] Probar `/api/download` con calidad real (elegir format_id)
  - [ ] Integrar FFmpeg para convertir formatos (webm VP9 → mp4 H.264)
  - [ ] Agregar selector de formato de salida (mp4/mkv/webm)

  ### Prioridad Media
  - [ ] Tema claro/oscuro
  - [ ] Selector de idioma (i18n)
  - [ ] Service worker para PWA offline
  - [ ] Barra de búsqueda en historial
  - [ ] Múltiples descargas simultáneas
  - [ ] Progreso real de yt-dlp (parsear stderr)
  - [ ] Estimar tiempo de análisis

  ### Prioridad Baja
  - [ ] Tests unitarios (Vitest + Supertest)
  - [ ] Analizador de bundle (vite-bundle-analyzer)
  - [ ] Compresión brotli/gzip en backend
  - [ ] Logs estructurados (pino)
  - [ ] Rate limit por API key
  - [ ] Modo oscuro automático (prefers-color-scheme)

  ---

  ## 🤝 Contribuir

  1. Fork el repositorio
  2. Crea tu rama (`git checkout -b feature/amazing`)
  3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
  4. Push a la rama (`git push origin feature/amazing`)
  5. Abre un Pull Request

  ---

  ## 📄 Licencia

  **MIT** © 2026 MediaDock

  ---

  <div align="center">
    Hecho con ❤️ por <a href="https://github.com/Naiker12">Naiker12</a>
  </div>
