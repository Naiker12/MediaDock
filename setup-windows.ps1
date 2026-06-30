# Video Downloader - Setup para Windows
Write-Host "=== Video Downloader Setup ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node.js
try {
    $nodeVer = node --version
    Write-Host "✓ Node.js: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js no instalado. Descargar: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 2. Verificar pnpm
try {
    $pnpmVer = pnpm --version
    Write-Host "✓ pnpm: v$pnpmVer" -ForegroundColor Green
} catch {
    Write-Host "Instalando pnpm..."
    npm install -g pnpm
}

# 3. Instalar yt-dlp
try {
    $dlpVer = yt-dlp --version
    Write-Host "✓ yt-dlp: v$dlpVer" -ForegroundColor Green
} catch {
    Write-Host "Instalando yt-dlp..."
    try {
        winget install yt-dlp.yt-dlp -e --silent 2>$null
        if ($LASTEXITCODE -ne 0) { throw "winget failed" }
    } catch {
        Write-Host "  Descarga manual: https://github.com/yt-dlp/yt-dlp/releases" -ForegroundColor Yellow
        Write-Host "  Coloca yt-dlp.exe en C:\Windows\System32\ o agrega al PATH" -ForegroundColor Yellow
    }
}

# 4. Verificar FFmpeg
try {
    $ffVer = ffmpeg -version
    Write-Host "✓ FFmpeg: instalado" -ForegroundColor Green
} catch {
    Write-Host "✗ FFmpeg no instalado." -ForegroundColor Yellow
    Write-Host "  Descargar: https://ffmpeg.org/download.html" -ForegroundColor Yellow
    Write-Host "  O: winget install FFmpeg" -ForegroundColor Yellow
}

# 5. Instalar dependencias del proyecto
Write-Host ""
Write-Host "Instalando dependencias del proyecto..." -ForegroundColor Cyan
pnpm install

# 6. Build
Write-Host ""
Write-Host "Compilando backend..." -ForegroundColor Cyan
pnpm backend:build

Write-Host ""
Write-Host "=== Setup completado ===" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar:"
Write-Host "  Terminal 1: pnpm frontend:dev"
Write-Host "  Terminal 2: pnpm backend:start"
