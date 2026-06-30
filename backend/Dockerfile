FROM node:20-alpine

RUN echo "https://dl-cdn.alpinelinux.org/alpine/v3.20/community" >> /etc/apk/repositories && \
  apk add --no-cache \
  yt-dlp \
  ffmpeg \
  python3 \
  py3-pip

WORKDIR /app

COPY backend/package.json ./
RUN npm install

COPY backend/tsconfig.json ./
COPY backend/src ./src

RUN npm run build

EXPOSE 3001

ENV YT_DLP_PATH=yt-dlp
ENV FFMPEG_PATH=ffmpeg
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
