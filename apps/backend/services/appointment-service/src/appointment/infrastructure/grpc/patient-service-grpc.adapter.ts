import {Inject, Injectable, OnModuleInit} from "@nestjs/common";
import {ClientGrpc} from "@nestjs/microservices";
import {lastValueFrom} from "rxjs";
import type {PatientServiceClient} from "@clinora/contracts-patient";
import {PATIENT_SERVICE_NAME} from "@clinora/contracts-patient";
import {
  PatientServicePort,
  PatientSnapshot,
} from "../../application/ports/patient-service.port";
import {PATIENT_GRPC_CLIENT} from "../../appointment.tokens";

@Injectable()
export class PatientServiceGrpcAdapter
  implements PatientServicePort, OnModuleInit
{
  private service!: PatientServiceClient;

  constructor(@Inject(PATIENT_GRPC_CLIENT) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.service = this.client.getService<PatientServiceClient>(
      PATIENT_SERVICE_NAME,
    );
  }

  async getPatient(id: string, clinicId: string): Promise<PatientSnapshot> {
    const patient = await lastValueFrom(
      this.service.getPatient({id, clinicId}),
    );
    return {
      id: patient.id,
      clinicId: patient.clinicId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone || undefined,
    };
  }
}
