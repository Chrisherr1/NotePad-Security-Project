# Dockerfile
# ----------
# Builds the Express backend for production.
# Frontend is served separately by Nginx as static files.

# use the official Node.js LTS image as the base
FROM node:22-alpine

# set the working directory inside the container
WORKDIR /app

# copy package files first so Docker can cache the npm install layer
# if package.json hasn't changed, Docker skips npm install on rebuilds
COPY package*.json ./

# install production dependencies only — skips devDependencies (nodemon etc.)
RUN npm ci --omit=dev

# copy the rest of the backend source code
COPY . .

# tell Docker this container listens on port 3000
EXPOSE 3000

# start the server
CMD ["node", "index.js"]