FROM node:20-bullseye

# Installer dépendances système nécessaires
RUN apt-get update && \
    apt-get install -y ffmpeg curl python3 make g++ && \
    apt-get clean

# Installer yt-dlp binaire officiel
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# Copier tout le projet
COPY . .

# Aller dans ton app Next
WORKDIR /app/npx

# Installer dépendances
RUN npm install

# Build Next
RUN npm run build

EXPOSE 10000

CMD ["npm", "start"]