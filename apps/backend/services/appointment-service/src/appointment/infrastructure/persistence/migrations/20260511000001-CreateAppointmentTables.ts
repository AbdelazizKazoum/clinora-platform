import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateAppointmentTables20260511000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`appointments\` (
        \`id\`                  VARCHAR(36) NOT NULL DEFAULT (UUID()),
        \`clinic_id\`           VARCHAR(36) NOT NULL,
        \`patient_id\`          VARCHAR(36) NOT NULL,
        \`patient_name\`        VARCHAR(255) NOT NULL,
        \`patient_phone\`       VARCHAR(30) NULL,
        \`doctor_id\`           VARCHAR(36) NOT NULL,
        \`doctor_name\`         VARCHAR(255) NOT NULL,
        \`start_at\`            DATETIME NOT NULL,
        \`end_at\`              DATETIME NOT NULL,
        \`is_emergency\`        TINYINT(1) NOT NULL DEFAULT 0,
        \`appointment_type\`    VARCHAR(100) NULL,
        \`channel\`             ENUM('ONLINE','WALK_IN','PHONE') NOT NULL,
        \`status\`              ENUM('PENDING','CONFIRMED','CANCELLED','NO_SHOW','COMPLETED') NOT NULL DEFAULT 'PENDING',
        \`notes\`               TEXT NULL,
        \`cancelled_at\`        DATETIME NULL,
        \`cancellation_reason\` TEXT NULL,
        \`created_by\`          VARCHAR(36) NULL,
        \`created_at\`          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\`          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_appointments_clinic\` (\`clinic_id\`),
        INDEX \`idx_appointments_patient\` (\`clinic_id\`, \`patient_id\`),
        INDEX \`idx_appointments_doctor_date\` (\`clinic_id\`, \`doctor_id\`, \`start_at\`, \`end_at\`),
        INDEX \`idx_appointments_status_date\` (\`clinic_id\`, \`status\`, \`start_at\`),
        INDEX \`idx_appointments_conflict_check\` (\`clinic_id\`, \`doctor_id\`, \`status\`, \`start_at\`, \`end_at\`),
        INDEX \`idx_appointments_emergency\` (\`clinic_id\`, \`is_emergency\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`queue_entries\` (
        \`id\`               VARCHAR(36) NOT NULL DEFAULT (UUID()),
        \`clinic_id\`        VARCHAR(36) NOT NULL,
        \`appointment_id\`   VARCHAR(36) NOT NULL,
        \`patient_id\`       VARCHAR(36) NOT NULL,
        \`patient_name\`     VARCHAR(255) NOT NULL,
        \`patient_phone\`    VARCHAR(30) NULL,
        \`doctor_id\`        VARCHAR(36) NOT NULL,
        \`doctor_name\`      VARCHAR(255) NOT NULL,
        \`appointment_type\` VARCHAR(100) NULL,
        \`status\`           ENUM('ARRIVED','WAITING','IN_CHAIR','DONE') NOT NULL DEFAULT 'ARRIVED',
        \`priority\`         ENUM('NORMAL','URGENT','EMERGENCY') NOT NULL DEFAULT 'NORMAL',
        \`queue_notes\`      TEXT NULL,
        \`arrived_at\`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`called_at\`        DATETIME NULL,
        \`seated_at\`        DATETIME NULL,
        \`completed_at\`     DATETIME NULL,
        \`updated_at\`       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_queue_appointment\` (\`appointment_id\`),
        INDEX \`idx_queue_clinic_waiting_room\` (\`clinic_id\`, \`status\`, \`priority\`, \`arrived_at\`),
        INDEX \`idx_queue_clinic_doctor\` (\`clinic_id\`, \`doctor_id\`, \`status\`, \`priority\`),
        INDEX \`idx_queue_clinic_date\` (\`clinic_id\`, \`arrived_at\`),
        CONSTRAINT \`fk_queue_entries_appointment\`
          FOREIGN KEY (\`appointment_id\`) REFERENCES \`appointments\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`outbox\` (
        \`id\`         VARCHAR(36) NOT NULL DEFAULT (UUID()),
        \`event_type\` VARCHAR(100) NOT NULL,
        \`payload\`    JSON NOT NULL,
        \`published\`  TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`idx_outbox_unpublished\` (\`published\`, \`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS `outbox`");
    await queryRunner.query("DROP TABLE IF EXISTS `queue_entries`");
    await queryRunner.query("DROP TABLE IF EXISTS `appointments`");
  }
}
