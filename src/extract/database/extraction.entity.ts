import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { GroupA } from '../types/group-a.types';
import { GroupB } from '../types/group-b.types';

@Entity('extractions')
export class ExtractionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', unique: true })
  listingId!: string;

  @Column({ type: 'text', nullable: true })
  sourceUrl!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  groupA!: GroupA | null;

  @Column({ type: 'simple-json', nullable: true })
  groupB!: GroupB | null;

  @Column({ type: 'datetime' })
  extractedAt!: Date;

  @Column({ type: 'boolean' })
  groupAValid!: boolean;

  @Column({ type: 'boolean' })
  groupBValid!: boolean;

  @Column({ type: 'text' })
  status!: 'success' | 'failed';

  @Column({ type: 'simple-json', nullable: true })
  errors!: string[] | null;
}