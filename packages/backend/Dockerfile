FROM node:22-alpine AS builder

WORKDIR /app

COPY packages/shared/package.json packages/shared/
COPY packages/auth-client/package.json packages/auth-client/
COPY packages/backend/package.json packages/backend/
COPY package.json package-lock.json ./

RUN npm ci --workspace=packages/backend --workspace=packages/shared --workspace=packages/auth-client

COPY packages/shared/ packages/shared/
COPY packages/auth-client/ packages/auth-client/
COPY packages/backend/ packages/backend/

RUN npm run build -w packages/shared
RUN npm run build -w packages/auth-client
RUN npm run build -w packages/backend

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/writing-buddy.db

EXPOSE 5050

CMD ["node", "dist/index.js"]
