import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_CURRENCY,
  type CurrencyCode,
  formatCurrency,
  getCurrencySymbol,
  isCurrencyCode,
} from '../utils/currency';

interface CurrencyContextValue {
  currencyCode: CurrencyCode;
  setCurrencyCode: (currencyCode: CurrencyCode) => void;
  formatMoney: (
    amount: number,
    options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
  ) => string;
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

function getStorageKey(spaceId: string) {
  return `tripsplit_currency_${spaceId}`;
}

export function CurrencyProvider({
  spaceId,
  children,
}: {
  spaceId: string | null;
  children: ReactNode;
}) {
  const [currencyCode, setCurrencyCodeState] = useState<CurrencyCode>(DEFAULT_CURRENCY);

  useEffect(() => {
    if (!spaceId || typeof window === 'undefined') {
      setCurrencyCodeState(DEFAULT_CURRENCY);
      return;
    }

    const stored = window.localStorage.getItem(getStorageKey(spaceId));
    setCurrencyCodeState(isCurrencyCode(stored) ? stored : DEFAULT_CURRENCY);
  }, [spaceId]);

  useEffect(() => {
    if (!spaceId || typeof window === 'undefined') return;
    window.localStorage.setItem(getStorageKey(spaceId), currencyCode);
  }, [spaceId, currencyCode]);

  function setCurrencyCode(nextCurrencyCode: CurrencyCode) {
    setCurrencyCodeState(nextCurrencyCode);
  }

  return (
    <CurrencyContext.Provider
      value={{
        currencyCode,
        setCurrencyCode,
        formatMoney: (amount, options) => formatCurrency(amount, currencyCode, options),
        currencySymbol: getCurrencySymbol(currencyCode),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
