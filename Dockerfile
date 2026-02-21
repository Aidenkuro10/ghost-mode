FROM node:20-bullseye

RUN apt-get update && \
    apt-get install -y ffmpeg curl && \
    apt-get clean

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# Copier tout le projet
COPY . .

# Aller dans le dossier npx
WORKDIR /app/npx

RUN npm install
RUN npm run build

EXPOSE 10000

CMD ["npm", "start"]