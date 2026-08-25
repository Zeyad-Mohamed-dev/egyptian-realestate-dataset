export interface GroupB {
  description: string | null;

  compoundName: string | null;
  developerName: string | null;

  finishingLevel:
    | 'core & shell'
    | 'semi-finished'
    | 'fully finished'
    | 'super lux'
    | 'furnished'
    | 'unknown'
    | null;

  deliveryStatus:
    | 'ready'
    | 'off-plan'
    | null;

  deliveryDate: string | null;

  saleType:
    | 'primary'
    | 'resale'
    | null;

  paymentType:
    | 'cash'
    | 'installments'
    | 'both'
    | null;

  downPaymentAmount: number | null;
  downPaymentPct: number | null;

  installmentYears: number | null;
  installmentAmount: number | null;

  installmentFrequency:
    | 'monthly'
    | 'quarterly'
    | 'annual'
    | null;

  cashDiscountPct: number | null;

  amenities: string[];

  floorNumber: number | null;
  gardenAreaSqm: number | null;
  roofAreaSqm: number | null;

  isNegotiable: boolean | null;
}

