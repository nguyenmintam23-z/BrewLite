import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPaymentAttemptsSchema1794081600001 implements MigrationInterface {
  name = 'FixPaymentAttemptsSchema1794081600001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payment_attempts"
        ALTER COLUMN "orderId" TYPE uuid USING "orderId"::uuid,
        ALTER COLUMN "amount" TYPE numeric(10,2) USING "amount"::numeric(10,2),
        RENAME COLUMN "orderId" TO "order_id",
        RENAME COLUMN "idempotencyKey" TO "idempotency_key",
        RENAME COLUMN "requestFingerprint" TO "request_fingerprint",
        RENAME COLUMN "transactionRef" TO "transaction_ref",
        RENAME COLUMN "createdAt" TO "created_at",
        RENAME COLUMN "updatedAt" TO "updated_at";
    `);

    await queryRunner.query(`
      ALTER TABLE "payment_attempts"
        ADD CONSTRAINT "FK_payment_attempts_order_id"
        FOREIGN KEY ("order_id") REFERENCES "orders"("id")
        ON DELETE RESTRICT ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "payment_attempts"
        DROP CONSTRAINT IF EXISTS "FK_payment_attempts_order_id";
    `);

    await queryRunner.query(`
      ALTER TABLE "payment_attempts"
        ALTER COLUMN "order_id" TYPE character varying(64) USING "order_id"::character varying(64),
        ALTER COLUMN "amount" TYPE integer USING "amount"::integer,
        RENAME COLUMN "order_id" TO "orderId",
        RENAME COLUMN "idempotency_key" TO "idempotencyKey",
        RENAME COLUMN "request_fingerprint" TO "requestFingerprint",
        RENAME COLUMN "transaction_ref" TO "transactionRef",
        RENAME COLUMN "created_at" TO "createdAt",
        RENAME COLUMN "updated_at" TO "updatedAt";
    `);
  }
}
