import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CardRarity {
  N = 'N',
  R = 'R',
  SR = 'SR',
  SSR = 'SSR',
  UR = 'UR',
}

export enum CardType {
  PERSON = 'person',
  EVENT = 'event',
  WEAPON = 'weapon',
  CLASSIC = 'classic',
  PLACE = 'place',
  DYNASTY = 'dynasty',
}

export interface MergePath {
  target: string;
  partner: string;
  desc: string;
}

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  card_id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: CardRarity.N })
  rarity: CardRarity;

  @Column()
  dynasty: string;

  @Column({ nullable: true })
  dynasty_tag: string;

  @Column({ default: 1 })
  level: number;

  @Column({ type: 'varchar', default: CardType.PERSON })
  type: CardType;

  @Column({ nullable: true })
  short_desc: string;

  @Column({ type: 'text', nullable: true })
  story: string;

  @Column({ type: 'text', nullable: true })
  knowledge_point: string;

  @Column({ type: 'simple-json', nullable: true })
  tags: string[];

  @Column({ type: 'simple-json', nullable: true })
  related_cards: string[];

  @Column({ type: 'simple-json', nullable: true })
  merge_paths: MergePath[];

  @Column({ default: 3 })
  star_max: number;

  @Column({ nullable: true })
  image_url: string;

  @Column({ nullable: true })
  thumbnail_url: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
