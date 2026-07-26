import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable20260726000000 implements MigrationInterface {
  name = 'CreateUsersTable20260726000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'clinic_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'full_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'role',
            type: 'enum',
            enum: [
              'patient',
              'secretary',
              'doctor',
              'admin',
              'dental_assistant',
            ],
          },
          {
            name: 'created_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            precision: 6,
            default: 'CURRENT_TIMESTAMP(6)',
            onUpdate: 'CURRENT_TIMESTAMP(6)',
          },
        ],
        uniques: [
          {
            name: 'UQ_users_email_clinic_id',
            columnNames: ['email', 'clinic_id'],
          },
        ],
      }),
      true,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users', true);
  }
}
