import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStockReservationToOrders1794081600000
  implements MigrationInterface
{
  name = 'AddStockReservationToOrders1794081600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "stock_reserved" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "stock_reserved"`);
  }
}
