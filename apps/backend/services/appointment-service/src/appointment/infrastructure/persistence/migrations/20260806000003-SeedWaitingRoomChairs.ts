import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedWaitingRoomChairs20260806000003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO \`chairs\` (\`id\`, \`clinic_id\`, \`name\`, \`code\`, \`is_active\`)
      SELECT
        UUID(),
        clinic_ids.clinic_id,
        defaults.name,
        defaults.code,
        1
      FROM (
        SELECT DISTINCT \`clinic_id\` FROM \`appointments\`
        UNION
        SELECT DISTINCT \`clinic_id\` FROM \`queue_entries\`
      ) AS clinic_ids
      CROSS JOIN (
        SELECT 'Operatory 1' AS name, 'OP-1' AS code
        UNION ALL
        SELECT 'Operatory 2' AS name, 'OP-2' AS code
        UNION ALL
        SELECT 'Operatory 3' AS name, 'OP-3' AS code
      ) AS defaults
      LEFT JOIN \`chairs\` existing
        ON existing.\`clinic_id\` = clinic_ids.\`clinic_id\`
       AND existing.\`code\` = defaults.\`code\`
      WHERE existing.\`id\` IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM \`chairs\`
      WHERE (\`code\`, \`name\`) IN (
        ('OP-1', 'Operatory 1'),
        ('OP-2', 'Operatory 2'),
        ('OP-3', 'Operatory 3')
      );
    `);
  }
}
