import { of } from 'rxjs';

import type { ClientGrpc } from '@nestjs/microservices';

import { StaffRole } from '../../../domain/enums/staff-role.enum';
import { GrpcAuthServiceAdapter } from './grpc-auth-service.adapter';

describe('GrpcAuthServiceAdapter', () => {
  it('maps dental assistants to the auth dental_assistant role', async () => {
    const register = jest.fn().mockReturnValue(
      of({
        user: { id: 'auth-user-id' },
        accessToken: 'access',
        refreshToken: 'refresh',
      }),
    );
    const grpcClient = {
      getService: jest.fn().mockReturnValue({ register }),
    } as unknown as ClientGrpc;
    const adapter = new GrpcAuthServiceAdapter(grpcClient);
    adapter.onModuleInit();

    await adapter.registerStaff({
      clinicId: 'clinic-id',
      email: 'assistant@example.ma',
      password: 'StrongPassword123!',
      fullName: 'Nadia Alaoui',
      role: StaffRole.DentalAssistant,
    });

    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'dental_assistant' }),
    );
  });
});
