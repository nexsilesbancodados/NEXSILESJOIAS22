# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files (package-lock.json é obrigatório para o npm ci abaixo)
COPY package.json package-lock.json ./

# Install dependencies
# A flag --legacy-peer-deps não é mais necessária: @zxing/library saiu das
# dependências diretas (nunca era importado — o código só usa @zxing/browser,
# que traz a versão compatível por conta própria) e o conflito de peer sumiu.
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing + security headers (ver nginx.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
