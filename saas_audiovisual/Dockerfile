# ============================================
# Dockerfile for Flutter Web Application
# ============================================

# Stage 1: Build Flutter web app
FROM ghcr.io/cirruslabs/flutter:stable AS build

WORKDIR /app

# Copy pubspec file only
COPY pubspec.yaml ./

# Get dependencies and clean cache to save space
RUN flutter pub get && \
    rm -rf /root/.pub-cache/git && \
    rm -rf /root/.pub-cache/hosted

# Copy source code
COPY . .

# Build web app with minimal cache
RUN flutter build web --release --no-source-maps && \
    rm -rf /app/.dart_tool && \
    rm -rf /app/.packages

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built web app
COPY --from=build /app/build/web /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
