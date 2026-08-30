# ---- Build stage ----
FROM node:20-slim AS build

WORKDIR /app
COPY package.json .
RUN npm install

COPY . .

# Frontend calls the backend at a *relative* /api path (see .env.production),
# so the same Ingress host serves both — no CORS, no hardcoded backend URL.
RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
