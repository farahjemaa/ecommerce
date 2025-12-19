# Frontend Dockerfile
# Utilise Nginx pour servir les fichiers statiques

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html /usr/share/nginx/html/
COPY products.html /usr/share/nginx/html/
COPY product-detail.html /usr/share/nginx/html/
COPY cart.html /usr/share/nginx/html/
COPY admin.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/


EXPOSE 80


CMD ["nginx", "-g", "daemon off;"]
