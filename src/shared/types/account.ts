export interface Account {
  id: string;
  name: string;
  type: 'Cash' | 'Bank' | 'Credit Card' | 'Investment' | 'Retirement' | 'Loan' | 'Other';
}
