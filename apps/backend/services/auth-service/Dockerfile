FROM node:22-alpine AS builder

WORKDIR /workspace

RUN corepack enable

ENV NX_DAEMON=false
ENV NODE_OPTIONS=--max-old-space-size=512

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm nx sync
RUN pnpm nx build auth-service --configuration=production

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /workspace

COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/apps/backend/services/auth-service/node_modules ./apps/backend/services/auth-service/node_modules
COPY --from=builder /workspace/apps/backend/services/auth-service/dist ./apps/backend/services/auth-service/dist
COPY --from=builder /workspace/libs/contracts/auth/package.json ./libs/contracts/auth/package.json
COPY --from=builder /workspace/libs/contracts/auth/dist ./libs/contracts/auth/dist
COPY --from=builder /workspace/libs/contracts/auth/src/lib/auth.proto ./libs/contracts/auth/src/lib/auth.proto

USER node

EXPOSE 3002 5001

CMD ["node", "apps/backend/services/auth-service/dist/main.js"]
