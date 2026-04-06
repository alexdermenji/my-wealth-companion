import type { Account } from '../../../src/shared/types/account';

export const mockAccounts: Account[] = [
  { id: '1', name: 'Bank Account', type: 'Bank', openingBalance: 0 },
  { id: '2', name: 'Cash on Hand', type: 'Cash', openingBalance: 0 },
  { id: '3', name: 'Credit Card 1', type: 'Credit Card', openingBalance: 0 },
];
