import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CreditCard, Wallet, Banknote, Building2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PaymentMethodsProps {
  form: UseFormReturn<any>;
}

export const PaymentMethods = ({ form }: PaymentMethodsProps) => {
  const [selectedMethod, setSelectedMethod] = useState('card');
  const { register, formState: { errors }, setValue } = form;
  const { t } = useLanguage();

  const paymentMethods = [
    { id: 'card', name: t('payment.creditDebit'), description: t('payment.creditDebitDesc'), icon: CreditCard, available: true },
    { id: 'bkash', name: 'bKash', description: t('payment.mobileBanking'), icon: Wallet, available: true },
    { id: 'nagad', name: 'Nagad', description: t('payment.digitalPayment'), icon: Wallet, available: true },
    { id: 'rocket', name: 'Rocket', description: t('payment.dblMobile'), icon: Building2, available: true },
    { id: 'cod', name: t('payment.cod'), description: t('payment.codDesc'), icon: Banknote, available: true },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">{t('payment.title')}</h2>
      <RadioGroup value={selectedMethod} onValueChange={(value) => { setSelectedMethod(value); setValue('paymentMethod', value); }} className="space-y-3">
        {paymentMethods.map((method) => (
          <div key={method.id}>
            <label htmlFor={method.id} className={cn("flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all", selectedMethod === method.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/50", !method.available && "opacity-50 cursor-not-allowed")}>
              <RadioGroupItem value={method.id} id={method.id} disabled={!method.available} />
              <method.icon className="h-6 w-6 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium text-foreground">{method.name}</p>
                <p className="text-sm text-muted-foreground">{method.description}</p>
              </div>
            </label>
            {selectedMethod === 'card' && method.id === 'card' && (
              <div className="mt-4 ml-12 space-y-4 p-4 bg-secondary/50 rounded-lg">
                <div className="space-y-2"><Label htmlFor="cardNumber">{t('payment.cardNumber')} *</Label><Input id="cardNumber" placeholder="1234 5678 9012 3456" {...register('cardNumber', { required: selectedMethod === 'card' })} className={errors.cardNumber ? 'border-destructive' : ''} /></div>
                <div className="space-y-2"><Label htmlFor="cardName">{t('payment.nameOnCard')} *</Label><Input id="cardName" {...register('cardName', { required: selectedMethod === 'card' })} className={errors.cardName ? 'border-destructive' : ''} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="cardExpiry">{t('payment.expiryDate')} *</Label><Input id="cardExpiry" placeholder="MM/YY" {...register('cardExpiry', { required: selectedMethod === 'card' })} className={errors.cardExpiry ? 'border-destructive' : ''} /></div>
                  <div className="space-y-2"><Label htmlFor="cardCvv">{t('payment.cvv')} *</Label><Input id="cardCvv" type="password" placeholder="123" maxLength={4} {...register('cardCvv', { required: selectedMethod === 'card' })} className={errors.cardCvv ? 'border-destructive' : ''} /></div>
                </div>
              </div>
            )}
            {selectedMethod === method.id && ['bkash', 'nagad', 'rocket'].includes(method.id) && (
              <div className="mt-4 ml-12 p-4 bg-secondary/50 rounded-lg"><p className="text-sm text-muted-foreground">{t('payment.redirectMsg')}</p></div>
            )}
            {selectedMethod === 'cod' && method.id === 'cod' && (
              <div className="mt-4 ml-12 p-4 bg-warning/10 border border-warning/30 rounded-lg"><p className="text-sm text-foreground">{t('payment.codNote')}</p></div>
            )}
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
