# Dockerfile for Railway deployment
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose port (Railway automatically sets this, but good for documentation)
EXPOSE 8080

# Start the server
CMD ["npm", "start"]