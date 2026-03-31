# ============================================
# Dockerfile ligero - Solo Nginx
# ============================================

FROM nginx:alpine

# Copiar configuración nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos estáticos
COPY web-build/ /usr/share/nginx/html/

# Health check
RUN echo "healthy" > /usr/share/nginx/html/health

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
