import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('property_search')
export class PropertySearchEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', unique: true })
  listingId!: string;

  // Group A

  @Column({ type: 'text', nullable: true })
  title!: string | null;

  @Column({ type: 'real', nullable: true })
  price!: number | null;

  @Column({ type: 'text', nullable: true })
  currency!: string | null;

  @Column({ type: 'text', nullable: true })
  propertyType!: string | null;

  @Column({ type: 'text', nullable: true })
  purpose!: string | null;

  @Column({ type: 'integer', nullable: true })
  bedrooms!: number | null;

  @Column({ type: 'integer', nullable: true })
  bathrooms!: number | null;

  @Column({ type: 'real', nullable: true })
  areaSqm!: number | null;

  @Column({ type: 'text', nullable: true })
  location!: string | null;

  @Column({ type: 'real', nullable: true })
  latitude!: number | null;

  @Column({ type: 'real', nullable: true })
  longitude!: number | null;

  @Column({ type: 'text', nullable: true })
  sourceUrl!: string | null;

  @Column({ type: 'real', nullable: true })
  pricePerSqm!: number | null;

  @Column({ type: 'real', nullable: true })
  totalInstallmentCost!: number | null;

  @Column({ type: 'text', nullable: true })
  pricePeriod!: string | null;

  @Column({ type: 'text', nullable: true })
  agencyName!: string | null;

  @Column({ type: 'boolean', nullable: true })
  isVerified!: boolean | null;

  @Column({ type: 'text', nullable: true })
  dateListed!: string | null;

  @Column({ type: 'text', nullable: true })
  language!: string | null;

  @Column({ type: 'text', nullable: true })
  governorate!: string | null;

  @Column({ type: 'text', nullable: true })
  city!: string | null;

  @Column({ type: 'text', nullable: true })
  district!: string | null;

  // Group B

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true })
  compoundName!: string | null;

  @Column({ type: 'text', nullable: true })
  developerName!: string | null;

  @Column({ type: 'text', nullable: true })
  finishingLevel!: string | null;

  @Column({ type: 'text', nullable: true })
  deliveryStatus!: string | null;

  @Column({ type: 'text', nullable: true })
  deliveryDate!: string | null;

  @Column({ type: 'text', nullable: true })
  saleType!: string | null;

  @Column({ type: 'text', nullable: true })
  paymentType!: string | null;

  @Column({ type: 'real', nullable: true })
  downPaymentAmount!: number | null;

  @Column({ type: 'real', nullable: true })
  downPaymentPct!: number | null;

  @Column({ type: 'real', nullable: true })
  installmentYears!: number | null;

  @Column({ type: 'real', nullable: true })
  installmentAmount!: number | null;

  @Column({ type: 'text', nullable: true })
  installmentFrequency!: string | null;

  @Column({ type: 'real', nullable: true })
  cashDiscountPct!: number | null;

  @Column({ type: 'integer', nullable: true })
  floorNumber!: number | null;

  @Column({ type: 'real', nullable: true })
  gardenAreaSqm!: number | null;

  @Column({ type: 'real', nullable: true })
  roofAreaSqm!: number | null;

  @Column({ type: 'boolean', nullable: true })
  isNegotiable!: boolean | null;
}