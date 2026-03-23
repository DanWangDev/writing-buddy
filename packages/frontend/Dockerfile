FROM node:22-alpine AS builder

WORKDIR /app

COPY packages/frontend/package.json packages/frontend/
COPY package.json package-lock.json ./

RUN npm ci --workspace=packages/frontend

COPY packages/frontend/ packages/frontend/

ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build -w packages/frontend

FROM nginx:alpine

COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
