import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

const COLUMNS = ["encryptJobId", "sessionId", "messageSource", "action"];

export class AddContextColumnsForChatMessageRecord1780000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("chat_message_record"))) return;
    for (const name of COLUMNS) {
      if (!(await queryRunner.hasColumn("chat_message_record", name))) {
        await queryRunner.addColumn(
          "chat_message_record",
          new TableColumn({ name, type: "varchar", isNullable: true })
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}

