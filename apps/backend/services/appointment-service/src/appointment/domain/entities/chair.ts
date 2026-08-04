export interface ChairProperties {
  id: string;
  clinicId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Chair {
  constructor(readonly properties: ChairProperties) {}

  get id(): string {
    return this.properties.id;
  }

  get clinicId(): string {
    return this.properties.clinicId;
  }

  get name(): string {
    return this.properties.name;
  }

  get code(): string {
    return this.properties.code;
  }

  get isActive(): boolean {
    return this.properties.isActive;
  }

  get isAssignable(): boolean {
    return this.properties.isActive;
  }
}
