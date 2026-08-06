FROM node:22-alpine AS builder

WORKDIR /workspace

RUN corepack enable

ENV NX_DAEMON=false
ENV NODE_OPTIONS=--max-old-space-size=512

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm nx sync
RUN pnpm nx build appointment-service --configuration=production

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /workspace

COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/apps/backend/services/appointment-service/node_modules ./apps/backend/services/appointment-service/node_modules
COPY --from=builder /workspace/apps/backend/services/appointment-service/dist ./apps/backend/services/appointment-service/dist
COPY --from=builder /workspace/libs/contracts/appointment/package.json ./libs/contracts/appointment/package.json
COPY --from=builder /workspace/libs/contracts/appointment/dist ./libs/contracts/appointment/dist
COPY --from=builder /workspace/libs/contracts/appointment/src/lib/appointment.proto ./libs/contracts/appointment/src/lib/appointment.proto
COPY --from=builder /workspace/libs/contracts/patient/package.json ./libs/contracts/patient/package.json
COPY --from=builder /workspace/libs/contracts/patient/dist ./libs/contracts/patient/dist
COPY --from=builder /workspace/libs/contracts/patient/src/lib/patient.proto ./libs/contracts/patient/src/lib/patient.proto
COPY --from=builder /workspace/libs/contracts/clinic/package.json ./libs/contracts/clinic/package.json
COPY --from=builder /workspace/libs/contracts/clinic/dist ./libs/contracts/clinic/dist
COPY --from=builder /workspace/libs/contracts/clinic/src/lib/clinic.proto ./libs/contracts/clinic/src/lib/clinic.proto

USER node

EXPOSE 3005 5004

CMD ["node", "apps/backend/services/appointment-service/dist/main.js"]
