FROM node:20-alpine

RUN apk add --no-cache \
  yt-dlp \
  ffmpeg \
  python3 \
  py3-pip

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY backend/package.json backend/tsconfig.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY backend/src ./src

RUN pnpm install --frozen-lockfile --prod
RUN pnpm build

EXPOSE 3001

ENV YT_DLP_PATH=yt-dlp
ENV FFMPEG_PATH=ffmpeg
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
