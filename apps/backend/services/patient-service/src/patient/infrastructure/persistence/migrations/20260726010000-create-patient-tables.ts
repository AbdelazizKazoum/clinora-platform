import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePatientTables20260726010000
  implements MigrationInterface
{
  name = 'CreatePatientTables20260726010000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE patients (
        id VARCHAR(36) NOT NULL,
        clinic_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(30) NULL,
        email VARCHAR(255) NULL,
        date_of_birth DATE NULL,
        gender ENUM('MALE', 'FEMALE', 'OTHER') NULL,
        address TEXT NULL,
        notes TEXT NULL,
        allergies TEXT NULL,
        chronic_conditions TEXT NULL,
        current_medications TEXT NULL,
        medical_notes TEXT NULL,
        status ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
        deleted_at DATETIME NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_patients_clinic_user (clinic_id, user_id),
        UNIQUE KEY IDX_patients_clinic_id_id (clinic_id, id),
        KEY IDX_patients_clinic_name (clinic_id, last_name, first_name),
        KEY IDX_patients_clinic_status (clinic_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE insurance_providers (
        id VARCHAR(36) NOT NULL,
        clinic_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_insurance_providers_clinic_name (clinic_id, name),
        UNIQUE KEY IDX_insurance_providers_clinic_id_id (clinic_id, id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE insurance_templates (
        id VARCHAR(36) NOT NULL,
        clinic_id VARCHAR(36) NOT NULL,
        insurance_provider_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        KEY IDX_insurance_templates_clinic_provider
          (clinic_id, insurance_provider_id),
        CONSTRAINT FK_insurance_templates_clinic_provider
          FOREIGN KEY (clinic_id, insurance_provider_id)
          REFERENCES insurance_providers (clinic_id, id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE patient_insurances (
        id VARCHAR(36) NOT NULL,
        clinic_id VARCHAR(36) NOT NULL,
        patient_id VARCHAR(36) NOT NULL,
        insurance_provider_id VARCHAR(36) NOT NULL,
        policy_number VARCHAR(100) NULL,
        member_id VARCHAR(100) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        KEY IDX_patient_insurances_clinic_patient (clinic_id, patient_id),
        KEY IDX_patient_insurances_clinic_provider
          (clinic_id, insurance_provider_id),
        CONSTRAINT FK_patient_insurances_clinic_patient
          FOREIGN KEY (clinic_id, patient_id)
          REFERENCES patients (clinic_id, id)
          ON DELETE CASCADE,
        CONSTRAINT FK_patient_insurances_clinic_provider
          FOREIGN KEY (clinic_id, insurance_provider_id)
          REFERENCES insurance_providers (clinic_id, id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE patient_documents (
        id VARCHAR(36) NOT NULL,
        clinic_id VARCHAR(36) NOT NULL,
        patient_id VARCHAR(36) NOT NULL,
        type ENUM('GENERAL', 'INSURANCE', 'MEDICAL', 'OTHER')
          NOT NULL DEFAULT 'GENERAL',
        title VARCHAR(255) NULL,
        file_url VARCHAR(500) NOT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        KEY IDX_patient_documents_clinic_patient (clinic_id, patient_id),
        CONSTRAINT FK_patient_documents_clinic_patient
          FOREIGN KEY (clinic_id, patient_id)
          REFERENCES patients (clinic_id, id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS patient_documents');
    await queryRunner.query('DROP TABLE IF EXISTS patient_insurances');
    await queryRunner.query('DROP TABLE IF EXISTS insurance_templates');
    await queryRunner.query('DROP TABLE IF EXISTS insurance_providers');
    await queryRunner.query('DROP TABLE IF EXISTS patients');
  }
}
