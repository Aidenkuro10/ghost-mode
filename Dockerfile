FROM node:20-bullseye

# Installer ffmpeg et yt-dlp directement via apt
RUN apt-get update && \
    apt-get install -y ffmpeg yt-dlp && \
    apt-get clean

WORKDIR /app

COPY npx/package*.json ./
RUN npm install

COPY npx .

RUN npm run build

EXPOSE 10000

CMD ["npm", "start"]