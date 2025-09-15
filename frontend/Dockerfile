FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Vite Dev server
EXPOSE 3000

CMD ["npm", "run", "dev"]
