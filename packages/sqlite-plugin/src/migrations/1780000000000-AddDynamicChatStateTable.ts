import { MigrationInterface, QueryRunner } from "typeorm"

export class AddDynamicChatStateTable1780000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "dynamic_chat_state" ("encryptBossId" varchar PRIMARY KEY NOT NULL, "encryptJobId" varchar, "turnCount" integer NOT NULL DEFAULT (0), "lastHandledMsgKey" varchar, "lastAction" varchar, "lastNotifiedMsgKey" varchar, "isHandedOver" boolean NOT NULL DEFAULT (0), "handoverTime" datetime, "updatedAt" datetime NOT NULL);`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
