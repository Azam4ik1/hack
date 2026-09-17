FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY app ./app
COPY db ./db
COPY tools ./tools
ENV PORT=8081
EXPOSE 8081
CMD ["node", "app/src/server.js"]
