# Multi-stage Dockerfile for TecSalud Frontend Angular Application
#
# This Dockerfile builds the Angular application and serves it using nginx
# in a production-ready, optimized container.
#
# @author TecSalud Development Team
# @version 1.0.0

# ============================================================================
# Stage 1: Build Angular Application
# ============================================================================
FROM node:22.16.0-alpine AS build

# Set working directory for the build process
WORKDIR /app

# Copy package files for dependency installation
# This is done first to leverage Docker layer caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy Angular configuration files
# These are required for the Angular CLI to recognize the workspace
COPY angular.json tsconfig*.json ./

# Copy application source code
COPY src/ ./src/
COPY public/ ./public/

# Build the application for production
# This creates optimized bundles in the dist/ directory
RUN npm run build:prod

# ============================================================================
# Stage 2: Production nginx Server
# ============================================================================
FROM nginx:1.29.0-alpine

# Copy built application from the build stage
# This transfers the compiled Angular app to the nginx web root
# Angular 17+ places files in browser/ subdirectory
COPY --from=build /app/dist/frontend-angular/browser /usr/share/nginx/html

# Copy custom nginx configuration files
# These provide optimized settings for serving the Angular SPA
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-default.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the application
EXPOSE 80

# Start nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]
