FROM node:22-alpine AS builder

WORKDIR /workspace

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm nx sync
RUN pnpm nx build clinic-service --configuration=production

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /workspace

COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/apps/backend/services/clinic-service/node_modules ./apps/backend/services/clinic-service/node_modules
COPY --from=builder /workspace/apps/backend/services/clinic-service/dist ./apps/backend/services/clinic-service/dist
COPY --from=builder /workspace/libs/contracts/auth/package.json ./libs/contracts/auth/package.json
COPY --from=builder /workspace/libs/contracts/auth/dist ./libs/contracts/auth/dist
COPY --from=builder /workspace/libs/contracts/auth/src/lib/auth.proto ./libs/contracts/auth/src/lib/auth.proto
COPY --from=builder /workspace/libs/contracts/clinic/package.json ./libs/contracts/clinic/package.json
COPY --from=builder /workspace/libs/contracts/clinic/dist ./libs/contracts/clinic/dist
COPY --from=builder /workspace/libs/contracts/clinic/src/lib/clinic.proto ./libs/contracts/clinic/src/lib/clinic.proto

USER node

EXPOSE 3003 5002

CMD ["node", "apps/backend/services/clinic-service/dist/main.js"]
