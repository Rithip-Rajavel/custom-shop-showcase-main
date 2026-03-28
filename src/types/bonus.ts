// Bonus Management Types
export interface Bonus {
  id: string;
  customerId: string;
  customerName: string;
  bonusAmount: number;
  bonusMonth: number;
  bonusYear: number;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface BonusRequest {
  customerId: string;
  bonusAmount: number;
  bonusMonth: number;
  bonusYear: number;
  reason: string;
}

export interface BonusSummary {
  customerId: string;
  customerName: string;
  totalBonus: number;
  month: number;
  year: number;
}
