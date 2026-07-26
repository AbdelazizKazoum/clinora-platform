export interface InsuranceProviderProperties {
  id: string;
  clinicId: string;
  name: string;
  code: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class InsuranceProvider {
  constructor(readonly properties: InsuranceProviderProperties) {}

  get id(): string {
    return this.properties.id;
  }
}
