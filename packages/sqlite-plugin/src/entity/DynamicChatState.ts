import * as typeorm from 'typeorm';
const { Entity, Column, PrimaryColumn } = typeorm;

@Entity()
export class DynamicChatState {
  @PrimaryColumn({
    type: 'varchar'
  })
  encryptBossId: string;

  @Column({
    type: 'varchar',
    nullable: true
  })
  encryptJobId?: string;

  @Column({
    type: 'integer',
    default: 0
  })
  turnCount: number;

  @Column({
    type: 'varchar',
    nullable: true
  })
  lastHandledMsgKey?: string;

  @Column({
    type: 'varchar',
    nullable: true
  })
  lastAction?: string;

  @Column({
    type: 'varchar',
    nullable: true
  })
  lastNotifiedMsgKey?: string;

  @Column({
    type: 'boolean',
    default: false
  })
  isHandedOver: boolean;

  @Column({
    type: 'datetime',
    nullable: true
  })
  handoverTime?: Date;

  @Column({
    type: 'datetime'
  })
  updatedAt: Date;
}
