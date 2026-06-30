FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  ffmpeg \
  python3 \
  python3-pip \
  && rm -rf /var/lib/apt/lists/*

RUN pip3 install yt-dlp --break-system-packages --no-cache-dir

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY backend/package.json ./
RUN pnpm install --no-frozen-lockfile

COPY backend/tsconfig.json ./
COPY backend/src ./src

RUN pnpm build

EXPOSE 3001

ENV YT_DLP_PATH=yt-dlp
ENV FFMPEG_PATH=ffmpeg
ENV NODE_ENV=production

CMD ["pnpm", "start"]
