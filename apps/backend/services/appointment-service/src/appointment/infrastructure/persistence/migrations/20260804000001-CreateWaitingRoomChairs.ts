import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWaitingRoomChairs20260804000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`chairs\` (
        \`id\`         VARCHAR(36) NOT NULL DEFAULT (UUID()),
        \`clinic_id\`  VARCHAR(36) NOT NULL,
        \`name\`       VARCHAR(100) NOT NULL,
        \`code\`       VARCHAR(50) NOT NULL DEFAULT '',
        \`is_active\`  TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_chairs_clinic_active_name\` (\`clinic_id\`, \`is_active\`, \`name\`),
        INDEX \`idx_chairs_clinic_active_code\` (\`clinic_id\`, \`is_active\`, \`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `chairs`');
  }
}
