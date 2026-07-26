FROM node:22-alpine AS builder

WORKDIR /workspace

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm nx sync
RUN pnpm nx build patient-service --configuration=production

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /workspace

COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/apps/backend/services/patient-service/node_modules ./apps/backend/services/patient-service/node_modules
COPY --from=builder /workspace/apps/backend/services/patient-service/dist ./apps/backend/services/patient-service/dist
COPY --from=builder /workspace/libs/contracts/patient/package.json ./libs/contracts/patient/package.json
COPY --from=builder /workspace/libs/contracts/patient/dist ./libs/contracts/patient/dist
COPY --from=builder /workspace/libs/contracts/patient/src/lib/patient.proto ./libs/contracts/patient/src/lib/patient.proto

USER node

EXPOSE 3004 5003

CMD ["node", "apps/backend/services/patient-service/dist/main.js"]
