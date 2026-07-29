import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class NormalizeStaffStatusIsActive20260729010000
  implements MigrationInterface
{
  name = 'NormalizeStaffStatusIsActive20260729010000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE staff_members
      SET is_active = CASE
        WHEN status = 'inactive' THEN 0
        ELSE 1
      END
    `);
  }

  async down(): Promise<void> {
    // Compatibility projection only; previous contradictory values cannot be recovered.
  }
}
