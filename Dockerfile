# Dockerfile for building the application
FROM node:24-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript files
RUN npm run build

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm","run","start"]