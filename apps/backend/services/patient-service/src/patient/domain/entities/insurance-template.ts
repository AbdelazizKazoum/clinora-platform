export interface InsuranceTemplateProperties {
  id: string;
  clinicId: string;
  insuranceProviderId: string;
  name: string;
  fileUrl: string;
  createdAt: Date;
}

export class InsuranceTemplate {
  constructor(readonly properties: InsuranceTemplateProperties) {}

  get id(): string {
    return this.properties.id;
  }
}
