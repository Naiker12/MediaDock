FROM node:20-alpine

RUN apk add --no-cache \
  yt-dlp \
  ffmpeg \
  python3 \
  py3-pip

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src

RUN npm run build

EXPOSE 3001

ENV YT_DLP_PATH=yt-dlp
ENV FFMPEG_PATH=ffmpeg
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
