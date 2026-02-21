FROM node:20-bullseye

# Installer ffmpeg + curl
RUN apt-get update && \
    apt-get install -y ffmpeg curl && \
    apt-get clean

# Télécharger le binaire officiel yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

COPY npx/package*.json ./
RUN npm install

COPY npx .

RUN npm run build

EXPOSE 10000

CMD ["npm", "start"]