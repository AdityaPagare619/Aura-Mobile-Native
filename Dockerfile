# Dockerfile for Deterministic Zero-Version-Issue Builds
# This ensures that no matter what machine you build the native frontend on,
# the output is exactly the same and free of local node version errors.

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for Docker caching
COPY package.json package-lock.json* ./
RUN npm ci

# Copy full source
COPY . .

# Build the optimized production assets for Capacitor
RUN npm run build

# We do not need a web server (like nginx) because this is a Native offline app.
# We just need to extract the built `dist` folder.
# The actual deployment to Android is done by the host machine copying this `dist` folder 
# and running `npx cap sync android && cd android && ./gradlew assembleDebug`
CMD ["npm", "run", "build"]
