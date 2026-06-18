import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CardQuality {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  SR = 'sr',
  SSR = 'ssr',
  TREASURE = 'treasure',
}

export enum CardType {
  CHARACTER = 'character',
  PLACE = 'place',
  EVENT = 'event',
  STAGE_EVENT = 'stage_event',
}

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  card_id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: CardQuality.COMMON })
  quality: CardQuality;

  @Column()
  dynasty: string;

  @Column({ default: 1 })
  level: number;

  @Column({ type: 'varchar', default: CardType.CHARACTER })
  type: CardType;

  @Column({ nullable: true })
  image_url: string;

  @Column({ nullable: true })
  thumbnail_url: string;

  @Column({ type: 'text', nullable: true })
  story: string;

  @Column({ type: 'text', nullable: true })
  knowledge_point: string;

  @Column({ type: 'simple-json', nullable: true })
  tags: string[];

  @Column({ type: 'simple-json', nullable: true })
  related_cards: string[];

  @Column({ type: 'text', nullable: true })
  merge_hint: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
