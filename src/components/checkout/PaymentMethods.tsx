import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CreditCard, Wallet, Banknote, Building2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

interface PaymentMethodsProps {
  form: UseFormReturn<any>;
}

const paymentMethods = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    description: 'Visa, Mastercard, American Express',
    icon: CreditCard,
    available: true,
  },
  {
    id: 'bkash',
    name: 'bKash',
    description: 'Mobile banking payment',
    icon: Wallet,
    available: true,
  },
  {
    id: 'nagad',
    name: 'Nagad',
    description: 'Digital payment service',
    icon: Wallet,
    available: true,
  },
  {
    id: 'rocket',
    name: 'Rocket',
    description: 'DBBL mobile banking',
    icon: Building2,
    available: true,
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    description: 'Pay when you receive',
    icon: Banknote,
    available: true,
  },
];

export const PaymentMethods = ({ form }: PaymentMethodsProps) => {
  const [selectedMethod, setSelectedMethod] = useState('card');
  const { register, formState: { errors }, setValue, watch } = form;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">Payment Method</h2>

      <RadioGroup 
        value={selectedMethod} 
        onValueChange={(value) => {
          setSelectedMethod(value);
          setValue('paymentMethod', value);
        }}
        className="space-y-3"
      >
        {paymentMethods.map((method) => (
          <div key={method.id}>
            <label
              htmlFor={method.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                selectedMethod === method.id
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/50",
                !method.available && "opacity-50 cursor-not-allowed"
              )}
            >
              <RadioGroupItem 
                value={method.id} 
                id={method.id}
                disabled={!method.available}
              />
              <method.icon className="h-6 w-6 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium text-foreground">{method.name}</p>
                <p className="text-sm text-muted-foreground">{method.description}</p>
              </div>
            </label>

            {/* Card Details Form */}
            {selectedMethod === 'card' && method.id === 'card' && (
              <div className="mt-4 ml-12 space-y-4 p-4 bg-secondary/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number *</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    {...register('cardNumber', { 
                      required: selectedMethod === 'card' ? 'Card number is required' : false 
                    })}
                    className={errors.cardNumber ? 'border-destructive' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardName">Name on Card *</Label>
                  <Input
                    id="cardName"
                    placeholder="John Doe"
                    {...register('cardName', { 
                      required: selectedMethod === 'card' ? 'Name is required' : false 
                    })}
                    className={errors.cardName ? 'border-destructive' : ''}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiry">Expiry Date *</Label>
                    <Input
                      id="cardExpiry"
                      placeholder="MM/YY"
                      {...register('cardExpiry', { 
                        required: selectedMethod === 'card' ? 'Expiry is required' : false 
                      })}
                      className={errors.cardExpiry ? 'border-destructive' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardCvv">CVV *</Label>
                    <Input
                      id="cardCvv"
                      type="password"
                      placeholder="123"
                      maxLength={4}
                      {...register('cardCvv', { 
                        required: selectedMethod === 'card' ? 'CVV is required' : false 
                      })}
                      className={errors.cardCvv ? 'border-destructive' : ''}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Banking Info */}
            {selectedMethod === method.id && ['bkash', 'nagad', 'rocket'].includes(method.id) && (
              <div className="mt-4 ml-12 p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  You will be redirected to {method.name} to complete your payment securely.
                </p>
              </div>
            )}

            {/* COD Info */}
            {selectedMethod === 'cod' && method.id === 'cod' && (
              <div className="mt-4 ml-12 p-4 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="text-sm text-foreground">
                  Please keep exact cash ready at the time of delivery. 
                  Additional ৳50 delivery charge applies for COD orders.
                </p>
              </div>
            )}
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};
