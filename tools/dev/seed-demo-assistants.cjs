// Local development fixture setup. All writes use the clinic service so it
// provisions auth identities through its existing application workflow.
const { randomBytes } = require('node:crypto');
const { createRequire } = require('node:module');
const { resolve } = require('node:path');

const workspaceRoot = resolve(__dirname, '../..');
const serviceRequire = createRequire(
  resolve(workspaceRoot, 'apps/backend/services/clinic-service/package.json'),
);
const grpc = serviceRequire('@grpc/grpc-js');
const nestRequire = createRequire(
  serviceRequire.resolve('@nestjs/microservices/package.json'),
);
const protoLoader = nestRequire('@grpc/proto-loader');
const definition = protoLoader.loadSync(
  resolve(workspaceRoot, 'libs/contracts/clinic/src/lib/clinic.proto'),
  { defaults: true, oneofs: true },
);
const { ClinicService } = grpc.loadPackageDefinition(definition).clinic;
const client = new ClinicService(
  '127.0.0.1:5002',
  grpc.credentials.createInsecure(),
);
const clinicId =
  process.env.DEMO_CLINIC_ID ?? '10000000-0000-4000-8000-000000000001';
const demoAssistants = [
  {
    firstName: 'Yasmine',
    lastName: 'Alaoui',
    email: 'yasmine.alaoui.demo@clinora.test',
  },
  {
    firstName: 'Amine',
    lastName: 'Bennani',
    email: 'amine.bennani.demo@clinora.test',
  },
  {
    firstName: 'Nora',
    lastName: 'Idrissi',
    email: 'nora.idrissi.demo@clinora.test',
  },
];

function call(method, input) {
  return new Promise((resolveReply, reject) => {
    client[method](input, { deadline: Date.now() + 15000 }, (error, reply) => {
      if (error) reject(error);
      else resolveReply(reply);
    });
  });
}

async function main() {
  const clinic = await call('getClinic', { clinicId });
  const { items } = await call('listStaffMembers', { clinicId });
  console.log(`Clinic: ${clinic.name} (${clinicId})`);
  for (const assistant of demoAssistants) {
    const existing = items.find((member) => member.email === assistant.email);
    if (existing) {
      console.log(
        `Already exists: ${assistant.firstName} ${assistant.lastName} (${existing.status})`,
      );
      continue;
    }
    if (!process.argv.includes('--seed')) {
      console.log(`Would create: ${assistant.firstName} ${assistant.lastName}`);
      continue;
    }
    await call('createStaffMember', {
      ...assistant,
      clinicId,
      role: 'DENTAL_ASSISTANT',
      password:
        process.env.DEMO_ASSISTANT_PASSWORD ??
        randomBytes(24).toString('base64url'),
    });
    console.log(`Created: ${assistant.firstName} ${assistant.lastName}`);
  }
  const roster = await call('listStaffMembers', { clinicId });
  const activeAssistants = roster.items.filter(
    (member) =>
      member.role === 'DENTAL_ASSISTANT' &&
      member.status === 'active' &&
      member.isActive,
  );
  console.log(`Active dental assistants: ${activeAssistants.length}`);
}

main()
  .catch((error) => {
    console.error(error.details ?? error.message);
    process.exitCode = 1;
  })
  .finally(() => client.close());
