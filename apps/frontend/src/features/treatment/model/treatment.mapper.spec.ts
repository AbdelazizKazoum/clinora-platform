import type { TreatmentVisitResponseDto } from '../api/dto/treatment-response.dto';
import { mapTreatmentVisitFromDto } from './treatment.mapper';
import {
  canApproveTreatmentDocumentation,
  canEditTreatmentDraft,
  parseTreatmentLaunchContext,
} from './treatment.rules';

const dto: TreatmentVisitResponseDto = {
  id: 'visit-1',
  clinicId: 'clinic-1',
  patientId: 'patient-1',
  responsibleDentistId: 'dentist-1',
  appointmentId: 'appointment-1',
  queueEntryId: 'queue-1',
  chairId: 'chair-1',
  status: 'AWAITING_REVIEW',
  chiefComplaint: 'Pain when biting',
  clinicalNotes: '',
  findings: [
    {
      id: 'finding-1',
      code: 'CARIES',
      status: 'DRAFT',
      target: {
        kind: 'TOOTH_SURFACE',
        arch: '',
        toothNumbers: [16],
        surfaces: ['OCCLUSAL'],
        periodontalSites: [],
      },
      details: [
        { key: 'ICDAS_CARS_SEVERITY', stringValue: '', integerValue: 4 },
      ],
      note: '',
      enteredByUserId: 'assistant-1',
      verifiedByUserId: '',
      createdAt: '2026-08-13T10:00:00.000Z',
      updatedAt: '2026-08-13T10:00:00.000Z',
    },
  ],
  acts: [],
  documentationHandoff: {
    id: 'handoff-1',
    status: 'SUBMITTED',
    assignedByDentistId: 'dentist-1',
    assignedToAssistantId: 'assistant-1',
    note: '',
    reviewNote: '',
    revision: 1,
    assignedAt: '2026-08-13T10:00:00.000Z',
    submittedAt: '2026-08-13T10:30:00.000Z',
    reviewedAt: '',
  },
  startedAt: '2026-08-13T10:00:00.000Z',
  completedAt: '',
  cancelledAt: '',
  cancellationReason: '',
  createdAt: '2026-08-13T10:00:00.000Z',
  updatedAt: '2026-08-13T10:30:00.000Z',
};

describe('Treatment frontend model', () => {
  it('maps transport strings into typed dates and nullable domain values', () => {
    const visit = mapTreatmentVisitFromDto(dto);

    expect(visit.startedAt).toEqual(new Date(dto.startedAt));
    expect(visit.clinicalNotes).toBeNull();
    expect(visit.findings[0]).toMatchObject({
      code: 'CARIES',
      details: [{ key: 'ICDAS_CARS_SEVERITY', value: 4 }],
      verifiedByUserId: null,
    });
    expect(visit.documentationHandoff?.reviewedAt).toBeNull();
  });

  it('fails closed on an unsupported backend lifecycle value', () => {
    expect(() =>
      mapTreatmentVisitFromDto({ ...dto, status: 'MAGIC_STATUS' }),
    ).toThrow('Unsupported Treatment visit status');
  });

  it('treats browser permissions as UX capabilities around assignment', () => {
    const handoff = dto.documentationHandoff;
    if (!handoff)
      throw new Error('Fixture must include a documentation handoff');

    const visit = mapTreatmentVisitFromDto({
      ...dto,
      status: 'IN_PROGRESS',
      documentationHandoff: {
        ...handoff,
        status: 'IN_PROGRESS',
      },
    });

    expect(
      canEditTreatmentDraft(visit, 'assistant-1', 'dental_assistant'),
    ).toBe(true);
    expect(
      canApproveTreatmentDocumentation(visit, 'assistant-1', 'admin'),
    ).toBe(false);
    expect(canApproveTreatmentDocumentation(visit, 'dentist-1', 'doctor')).toBe(
      true,
    );
  });

  it('parses the existing waiting-room launch handoff without owning it', () => {
    const context = parseTreatmentLaunchContext(
      new URLSearchParams({
        patientId: 'patient-1',
        doctorId: 'dentist-1',
        appointmentId: 'appointment-1',
        queueEntryId: 'queue-1',
        chairId: 'chair-1',
      }),
    );

    expect(context).toEqual({
      patientId: 'patient-1',
      doctorId: 'dentist-1',
      appointmentId: 'appointment-1',
      queueEntryId: 'queue-1',
      chairId: 'chair-1',
    });
    expect(
      parseTreatmentLaunchContext(new URLSearchParams({ patientId: 'p' })),
    ).toBeNull();
  });
});
