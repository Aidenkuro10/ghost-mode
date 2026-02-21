FROM node:20

# Installer ffmpeg et yt-dlp
RUN apt-get update && apt-get install -y ffmpeg python3 python3-pip \
  && pip3 install yt-dlp

WORKDIR /app

COPY npx/package*.json ./
RUN npm install

COPY npx .

RUN npm run build

EXPOSE 10000

CMD ["npm", "start"]