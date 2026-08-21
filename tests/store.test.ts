import { describe, it, expect } from 'vitest';
import { useAppStore } from '../src/store/appStore';

describe('AppStore - Row & Bank operations', () => {
  it('setAllRowsModeAndBank updates all rows to the selected mode and bank', () => {
    const { createBank, setAllRowsModeAndBank } = useAppStore.getState();
    const newBankId = createBank('Test Bank');

    // Apply mode 5 and newBankId to all rows
    setAllRowsModeAndBank(5, newBankId);

    const rows = useAppStore.getState().screenRows;
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.mode).toBe(5);
      expect(row.bankId).toBe(newBankId);
    }
  });
});
