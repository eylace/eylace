import { useCurrency } from '@/contexts/CurrencyContext';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';

const CURRENCY_FLAGS: Record<string, string> = {
  BDT: '🇧🇩',
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  INR: '🇮🇳',
  AED: '🇦🇪'
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: '৳',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AED: 'د.إ'
};

export const CurrencySwitcher = () => {
  const { currency, setCurrency, config, rates, lastUpdated } = useCurrency();

  // Always show at least BDT + USD
  const enabledCurrencies = config.enabledCurrencies.length > 1 ?
  config.enabledCurrencies :
  ['BDT', 'USD'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-primary-foreground/10 transition-colors outline-none border border-primary-foreground/20">
        <span className="text-base">{CURRENCY_FLAGS[currency] || '💱'}</span>
        <span className="text-sm font-semibold text-primary-foreground">{CURRENCY_SYMBOLS[currency]} {currency}</span>
        <ChevronDown className="h-3.5 w-3.5 text-primary-foreground/70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        {enabledCurrencies.map((code) =>
        <DropdownMenuItem
          key={code}
          onClick={() => setCurrency(code)}
          className={`cursor-pointer ${currency === code ? 'bg-accent text-accent-foreground font-semibold' : ''}`}>
          
            <span className="text-lg mr-2">{CURRENCY_FLAGS[code] || '💱'}</span>
            <span className="font-medium">{CURRENCY_SYMBOLS[code]} {code}</span>
            {rates[code] && code !== 'USD' &&
          <span className="ml-auto text-xs text-primary-foreground">
                1$ = {rates[code]?.toFixed(2)}
              </span>
          }
          </DropdownMenuItem>
        )}
        {lastUpdated &&
        <div className="px-2 py-1.5 border-t border-border mt-1 text-xs text-right text-slate-950">
            🔄 Rate updated: {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        }
      </DropdownMenuContent>
    </DropdownMenu>);

};