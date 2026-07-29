import {
  type MigrationInterface,
  type QueryRunner,
  TableColumn,
} from 'typeorm';

export class AddUserAccountAvailability20260729000000
  implements MigrationInterface
{
  name = 'AddUserAccountAvailability20260729000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'is_active',
        type: 'boolean',
        default: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'is_active');
  }
}
