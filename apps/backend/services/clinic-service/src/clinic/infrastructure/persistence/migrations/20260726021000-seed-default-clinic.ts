import { MigrationInterface, QueryRunner } from 'typeorm';

import { DEFAULT_CLINIC_ID } from '@clinora/contracts-clinic';

export class SeedDefaultClinic20260726021000
  implements MigrationInterface
{
  name = 'SeedDefaultClinic20260726021000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        INSERT INTO clinics (
          id,
          slug,
          name,
          timezone,
          locale,
          is_active
        )
        VALUES (?, 'clinora-default', 'Clinora Dental Clinic',
          'Africa/Casablanca', 'fr', 1)
        ON DUPLICATE KEY UPDATE id = id
      `,
      [DEFAULT_CLINIC_ID],
    );
  }

  down(): Promise<void> {
    return Promise.resolve();
  }
}
