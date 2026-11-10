FROM node:18-slim

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Bundle app source
COPY . .

# Expose port 5000
EXPOSE 5000

# Start command
CMD [ "npm", "start" ]
