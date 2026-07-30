import { status } from '@grpc/grpc-js';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  PreconditionFailedException,
  ServiceUnavailableException,
} from '@nestjs/common';

import type { ClinicServiceClient } from '../../clients/clinic/clinic-service.client';
import { mapClinicGrpcException, StaffFacade } from './staff.facade';

describe(mapClinicGrpcException.name, () => {
  it.each([
    [status.INVALID_ARGUMENT, BadRequestException],
    [status.ALREADY_EXISTS, ConflictException],
    [status.NOT_FOUND, NotFoundException],
    [status.FAILED_PRECONDITION, PreconditionFailedException],
    [status.UNAVAILABLE, ServiceUnavailableException],
    [status.DEADLINE_EXCEEDED, ServiceUnavailableException],
    [status.INTERNAL, InternalServerErrorException],
  ])('maps gRPC status %s to the expected HTTP error', (code, ErrorType) => {
    expect(
      mapClinicGrpcException({ code, details: 'clinic request failed' }),
    ).toBeInstanceOf(ErrorType);
  });
});

describe(StaffFacade.name, () => {
  const clinicClient: jest.Mocked<ClinicServiceClient> = {
    getStaffMember: jest.fn(),
    listStaffMembers: jest.fn(),
    createStaffMember: jest.fn(),
    updateStaffMember: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns successful staff client responses', async () => {
    const facade = new StaffFacade(clinicClient);
    clinicClient.listStaffMembers.mockResolvedValue({ items: [] });

    await expect(
      facade.listStaffMembers({
        clinicId: '10000000-0000-4000-8000-000000000001',
      }),
    ).resolves.toEqual({ items: [] });
  });

  it('normalizes omitted empty staff lists for the HTTP contract', async () => {
    const facade = new StaffFacade(clinicClient);
    clinicClient.listStaffMembers.mockResolvedValue(
      {} as Awaited<ReturnType<ClinicServiceClient['listStaffMembers']>>,
    );

    await expect(
      facade.listStaffMembers({
        clinicId: '10000000-0000-4000-8000-000000000001',
      }),
    ).resolves.toEqual({ items: [] });
  });

  it('maps clinic service dependency failures to stable HTTP errors', async () => {
    const facade = new StaffFacade(clinicClient);
    clinicClient.createStaffMember.mockRejectedValue({
      code: status.UNAVAILABLE,
    });

    await expect(
      facade.createStaffMember({
        clinicId: '10000000-0000-4000-8000-000000000001',
        role: 'DOCTOR',
        firstName: 'Salma',
        lastName: 'El Mansouri',
        email: 'salma.elmansouri@example.ma',
        password: 'StrongPassword123!',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
