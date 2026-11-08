import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentAttempts1762585200000
  implements MigrationInterface
{
  name = 'CreatePaymentAttempts1762585200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "payment_attempts_method_enum" AS ENUM ('WALLET', 'CARD')
    `);
    await queryRunner.query(`
      CREATE TYPE "payment_attempts_status_enum" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED')
    `);
    await queryRunner.query(`
      CREATE TABLE "payment_attempts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "orderId" character varying(64) NOT NULL,
        "amount" integer NOT NULL,
        "method" "payment_attempts_method_enum" NOT NULL,
        "status" "payment_attempts_status_enum" NOT NULL DEFAULT 'PENDING',
        "idempotencyKey" character varying(128) NOT NULL,
        "requestFingerprint" character varying(64) NOT NULL,
        "transactionRef" character varying(128),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_attempts_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payment_attempts_idempotency_key" UNIQUE ("idempotencyKey")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "payment_attempts"`);
    await queryRunner.query(`DROP TYPE "payment_attempts_status_enum"`);
    await queryRunner.query(`DROP TYPE "payment_attempts_method_enum"`);
  }
}
