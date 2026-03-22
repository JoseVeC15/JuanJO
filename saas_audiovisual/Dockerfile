# ============================================
# Dockerfile for Flutter Web Application
# Using pre-built Flutter SDK
# ============================================

# Stage 1: Build Flutter web app
FROM cirruslabs/flutter:3.24.3 AS build

WORKDIR /app

# Copy pubspec files
COPY pubspec.yaml pubspec.lock ./

# Get dependencies (offline mode since lock file exists)
RUN flutter pub get --offline

# Copy source code
COPY . .

# Build web app
RUN flutter build web --release --no-source-maps

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built web app
COPY --from=build /app/build/web /usr/share/nginx/html

# Add health check endpoint
RUN echo "healthy" > /usr/share/nginx/html/health

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
