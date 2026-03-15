import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CurrencyConfig {
  defaultCurrency: string;
  currencyPosition: string;
  thousandSeparator: string;
  decimalSeparator: string;
  decimalPlaces: number;
  enabledCurrencies: string[];
}

interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  formatPrice: (amount: number) => string;
  convertPrice: (amount: number, fromCurrency?: string) => number;
  rates: Record<string, number>;
  config: CurrencyConfig;
  isLoading: boolean;
  lastUpdated: string | null;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: '৳',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AED: 'د.إ',
};

const defaultConfig: CurrencyConfig = {
  defaultCurrency: 'BDT',
  currencyPosition: 'before',
  thousandSeparator: ',',
  decimalSeparator: '.',
  decimalPlaces: 2,
  enabledCurrencies: ['BDT', 'USD'],
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'eylace-currency';

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CURRENCY_STORAGE_KEY) || 'BDT';
    }
    return 'BDT';
  });
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1, BDT: 110.50 });
  const [config, setConfig] = useState<CurrencyConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch admin currency settings
  useEffect(() => {
    const loadConfig = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'store_settings_v2')
        .maybeSingle();

      if (data?.value && typeof data.value === 'object') {
        const v = data.value as any;
        setConfig({
          defaultCurrency: v.defaultCurrency || 'BDT',
          currencyPosition: v.currencyPosition || 'before',
          thousandSeparator: v.thousandSeparator || ',',
          decimalSeparator: v.decimalSeparator || '.',
          decimalPlaces: parseInt(v.decimalPlaces || '2', 10),
          enabledCurrencies: v.enabledCurrencies || ['BDT', 'USD'],
        });

        // Set default currency if user hasn't chosen one yet
        const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
        if (!storedCurrency) {
          setCurrencyState(v.defaultCurrency || 'BDT');
        }
      }
    };
    loadConfig();
  }, []);

  // Fetch real-time exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('exchange-rates', {
          body: { base: 'USD', targets: config.enabledCurrencies },
        });

        if (!error && data?.rates) {
          setRates(data.rates);
          setLastUpdated(data.updated_at);
        }
      } catch (err) {
        console.error('Failed to fetch exchange rates:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
    // Refresh rates every 10 minutes
    const interval = setInterval(fetchRates, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [config.enabledCurrencies]);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    localStorage.setItem(CURRENCY_STORAGE_KEY, code);
  }, []);

  // Convert from base currency (BDT, the store default) to target currency
  const convertPrice = useCallback((amount: number, fromCurrency: string = 'BDT') => {
    if (fromCurrency === currency) return amount;

    // Convert: fromCurrency -> USD -> targetCurrency
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[currency] || 1;
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }, [currency, rates]);

  const formatPrice = useCallback((amount: number) => {
    const converted = convertPrice(amount, config.defaultCurrency);
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    
    // Format number
    const fixed = converted.toFixed(config.decimalPlaces);
    const [intPart, decPart] = fixed.split('.');
    
    // Add thousand separator
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandSeparator);
    const formattedNumber = decPart 
      ? `${formattedInt}${config.decimalSeparator}${decPart}`
      : formattedInt;

    return config.currencyPosition === 'before'
      ? `${symbol}${formattedNumber}`
      : `${formattedNumber}${symbol}`;
  }, [currency, config, convertPrice]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      formatPrice,
      convertPrice,
      rates,
      config,
      isLoading,
      lastUpdated,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};
