import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWaitingRoomQueueFields20260804000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`queue_entries\`
        ADD COLUMN \`chair_id\` VARCHAR(36) NULL AFTER \`queue_notes\`,
        ADD COLUMN \`chair_name\` VARCHAR(100) NULL AFTER \`chair_id\`,
        ADD COLUMN \`manual_order\` INT NULL AFTER \`chair_name\`;
    `);

    await queryRunner.query(`
      CREATE INDEX \`idx_queue_clinic_status_manual_order\`
        ON \`queue_entries\` (\`clinic_id\`, \`status\`, \`manual_order\`);
    `);

    await queryRunner.query(`
      CREATE INDEX \`idx_queue_clinic_chair\`
        ON \`queue_entries\` (\`clinic_id\`, \`chair_id\`, \`status\`);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX `idx_queue_clinic_chair` ON `queue_entries`',
    );
    await queryRunner.query(
      'DROP INDEX `idx_queue_clinic_status_manual_order` ON `queue_entries`',
    );
    await queryRunner.query(`
      ALTER TABLE \`queue_entries\`
        DROP COLUMN \`manual_order\`,
        DROP COLUMN \`chair_name\`,
        DROP COLUMN \`chair_id\`;
    `);
  }
}
