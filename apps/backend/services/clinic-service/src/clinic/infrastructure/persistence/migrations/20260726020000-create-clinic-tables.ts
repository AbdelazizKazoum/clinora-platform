import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClinicTables20260726020000
  implements MigrationInterface
{
  name = 'CreateClinicTables20260726020000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE clinics (
        id VARCHAR(36) NOT NULL,
        slug VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(30) NULL,
        email VARCHAR(255) NULL,
        address TEXT NULL,
        timezone VARCHAR(100) NOT NULL DEFAULT 'Africa/Casablanca',
        locale ENUM('ar', 'fr', 'en') NOT NULL DEFAULT 'fr',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_clinics_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE working_hours (
        id VARCHAR(36) NOT NULL,
        clinic_id VARCHAR(36) NOT NULL,
        day_of_week TINYINT UNSIGNED NOT NULL,
        open_time TIME NULL,
        close_time TIME NULL,
        is_closed TINYINT(1) NOT NULL DEFAULT 0,
        PRIMARY KEY (id),
        UNIQUE KEY UQ_working_hours_clinic_day
          (clinic_id, day_of_week),
        CONSTRAINT CHK_working_hours_day
          CHECK (day_of_week BETWEEN 0 AND 6),
        CONSTRAINT FK_working_hours_clinic
          FOREIGN KEY (clinic_id)
          REFERENCES clinics (id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE staff_members (
        id VARCHAR(36) NOT NULL,
        clinic_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL
          COMMENT 'External auth-service user identifier',
        role ENUM(
          'SECRETARY',
          'DENTAL_ASSISTANT',
          'DOCTOR',
          'ADMIN'
        ) NOT NULL,
        status ENUM('active', 'on-leave', 'inactive')
          NOT NULL DEFAULT 'active',
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(30) NULL,
        email VARCHAR(255) NOT NULL,
        specialization VARCHAR(255) NULL,
        avatar VARCHAR(500) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_staff_members_clinic_user
          (clinic_id, user_id),
        UNIQUE KEY UQ_staff_members_clinic_email
          (clinic_id, email),
        KEY IDX_staff_members_clinic_status
          (clinic_id, status),
        CONSTRAINT FK_staff_members_clinic
          FOREIGN KEY (clinic_id)
          REFERENCES clinics (id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS staff_members');
    await queryRunner.query('DROP TABLE IF EXISTS working_hours');
    await queryRunner.query('DROP TABLE IF EXISTS clinics');
  }
}
