FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Run migrations then start
CMD sh -c "npx knex migrate:latest --knexfile knexfile.js && node src/server.js"

EXPOSE 3001
