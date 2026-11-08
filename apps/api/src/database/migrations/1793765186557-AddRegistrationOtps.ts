import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddRegistrationOtps1793765186557 implements MigrationInterface {
    name = 'AddRegistrationOtps1793765186557'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "registration_otps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "displayName" character varying(80) NOT NULL, "phone" character varying(20) NOT NULL, "password_hash" character varying(255) NOT NULL, "otp_hash" character varying(64) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "attempt_count" integer NOT NULL DEFAULT '0', "consumed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a24b2cc667f82ac0b181afbbb54" UNIQUE ("phone"), CONSTRAINT "PK_a963caa5c383aaa948c9bb63f31" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "selected_options" SET DEFAULT '{}'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "selected_options" SET DEFAULT '{}'`);
        await queryRunner.query(`DROP TABLE "registration_otps"`);
    }

}
