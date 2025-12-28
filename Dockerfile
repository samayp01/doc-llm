FROM node:20-slim

WORKDIR /app

COPY . .

RUN npm ci && npm run build

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
