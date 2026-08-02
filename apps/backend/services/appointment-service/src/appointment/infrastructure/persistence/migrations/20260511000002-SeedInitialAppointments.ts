import {MigrationInterface, QueryRunner} from "typeorm";

export class SeedInitialAppointments20260511000002
  implements MigrationInterface
{
  private readonly clinicId = "00000000-0000-4000-8000-000000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      INSERT INTO \`appointments\`
        (\`id\`, \`clinic_id\`, \`patient_id\`, \`patient_name\`, \`patient_phone\`,
         \`doctor_id\`, \`doctor_name\`, \`start_at\`, \`end_at\`, \`is_emergency\`,
         \`appointment_type\`, \`channel\`, \`status\`, \`notes\`, \`created_by\`)
      VALUES
        (
          '00000000-0000-4000-8000-00000000b001',
          ?, '00000000-0000-4000-8000-00000000c001', 'Alice Johnson', '555-0101',
          '00000000-0000-4000-8000-00000000d001', 'Dr. Yasmine Benali',
          TIMESTAMP(CURDATE(), '09:00:00'),
          TIMESTAMP(CURDATE(), '09:30:00'),
          0, 'Consultation', 'PHONE', 'CONFIRMED', 'Default waiting-room test appointment',
          '00000000-0000-4000-8000-0000000000a1'
        ),
        (
          '00000000-0000-4000-8000-00000000b002',
          ?, '00000000-0000-4000-8000-00000000c002', 'Michael Chen', '555-0203',
          '00000000-0000-4000-8000-00000000d001', 'Dr. Yasmine Benali',
          DATE_ADD(TIMESTAMP(CURDATE(), '10:00:00'), INTERVAL 1 DAY),
          DATE_ADD(TIMESTAMP(CURDATE(), '10:45:00'), INTERVAL 1 DAY),
          0, 'Scaling and Polishing', 'ONLINE', 'PENDING', 'Default calendar test appointment',
          '00000000-0000-4000-8000-0000000000a1'
        ),
        (
          '00000000-0000-4000-8000-00000000b003',
          ?, '00000000-0000-4000-8000-00000000c003', 'Sarah Williams', '555-0305',
          '00000000-0000-4000-8000-00000000d002', 'Dr. Karim Haddad',
          DATE_ADD(TIMESTAMP(CURDATE(), '14:00:00'), INTERVAL 2 DAY),
          DATE_ADD(TIMESTAMP(CURDATE(), '14:30:00'), INTERVAL 2 DAY),
          1, 'Dental Emergency', 'WALK_IN', 'CONFIRMED', 'Default emergency test appointment',
          '00000000-0000-4000-8000-0000000000a1'
        )
      ON DUPLICATE KEY UPDATE \`id\` = \`id\`
      `,
      [this.clinicId, this.clinicId, this.clinicId],
    );

    await queryRunner.query(
      `
      INSERT INTO \`queue_entries\`
        (\`id\`, \`clinic_id\`, \`appointment_id\`, \`patient_id\`, \`patient_name\`,
         \`patient_phone\`, \`doctor_id\`, \`doctor_name\`, \`appointment_type\`,
         \`status\`, \`priority\`, \`queue_notes\`, \`arrived_at\`)
      VALUES
        (
          '00000000-0000-4000-8000-00000000e001',
          ?, '00000000-0000-4000-8000-00000000b001',
          '00000000-0000-4000-8000-00000000c001', 'Alice Johnson', '555-0101',
          '00000000-0000-4000-8000-00000000d001', 'Dr. Yasmine Benali',
          'Consultation', 'WAITING', 'NORMAL', 'Default queue test entry',
          DATE_SUB(NOW(), INTERVAL 10 MINUTE)
        )
      ON DUPLICATE KEY UPDATE \`id\` = \`id\`
      `,
      [this.clinicId],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "DELETE FROM `queue_entries` WHERE `id` = '00000000-0000-4000-8000-00000000e001'",
    );
    await queryRunner.query(
      "DELETE FROM `appointments` WHERE `id` IN ('00000000-0000-4000-8000-00000000b001', '00000000-0000-4000-8000-00000000b002', '00000000-0000-4000-8000-00000000b003')",
    );
  }
}
