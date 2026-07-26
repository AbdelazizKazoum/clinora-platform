FROM node:22-alpine AS builder

WORKDIR /workspace

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm nx sync
RUN pnpm nx build api-gateway --configuration=production

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /workspace

COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/apps/backend/api-gateway/node_modules ./apps/backend/api-gateway/node_modules
COPY --from=builder /workspace/apps/backend/api-gateway/dist ./apps/backend/api-gateway/dist
COPY --from=builder /workspace/libs/contracts/auth/package.json ./libs/contracts/auth/package.json
COPY --from=builder /workspace/libs/contracts/auth/dist ./libs/contracts/auth/dist
COPY --from=builder /workspace/libs/contracts/auth/src/lib/auth.proto ./libs/contracts/auth/src/lib/auth.proto

USER node

EXPOSE 3001

CMD ["node", "apps/backend/api-gateway/dist/main.js"]
