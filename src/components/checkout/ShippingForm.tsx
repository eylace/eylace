import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShippingFormProps {
  form: UseFormReturn<any>;
}

export const ShippingForm = ({ form }: ShippingFormProps) => {
  const { register, formState: { errors }, setValue } = form;
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">{t('shipping.title')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t('shipping.firstName')} *</Label>
          <Input id="firstName" {...register('firstName', { required: true })} className={errors.firstName ? 'border-destructive' : ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t('shipping.lastName')} *</Label>
          <Input id="lastName" {...register('lastName', { required: true })} className={errors.lastName ? 'border-destructive' : ''} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('shipping.email')} *</Label>
          <Input id="email" type="email" {...register('email', { required: true, pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' } })} className={errors.email ? 'border-destructive' : ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{t('shipping.phone')} *</Label>
          <Input id="phone" type="tel" {...register('phone', { required: true })} className={errors.phone ? 'border-destructive' : ''} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">{t('shipping.streetAddress')} *</Label>
        <Input id="address" {...register('address', { required: true })} className={errors.address ? 'border-destructive' : ''} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="apartment">{t('shipping.apartment')}</Label>
        <Input id="apartment" {...register('apartment')} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="city">{t('shipping.city')} *</Label>
          <Input id="city" {...register('city', { required: true })} className={errors.city ? 'border-destructive' : ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">{t('shipping.state')} *</Label>
          <Input id="state" {...register('state', { required: true })} className={errors.state ? 'border-destructive' : ''} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode">{t('shipping.zipCode')} *</Label>
          <Input id="zipCode" {...register('zipCode', { required: true })} className={errors.zipCode ? 'border-destructive' : ''} />
        </div>
        <div className="space-y-2">
          <Label>{t('shipping.country')} *</Label>
          <Select defaultValue="BD" onValueChange={(value) => setValue('country', value)}>
            <SelectTrigger><SelectValue placeholder={t('shipping.selectCountry')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="UK">United Kingdom</SelectItem>
              <SelectItem value="BD">Bangladesh</SelectItem>
              <SelectItem value="IN">India</SelectItem>
              <SelectItem value="PK">Pakistan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="saveAddress" onCheckedChange={(checked) => setValue('saveAddress', checked)} />
        <Label htmlFor="saveAddress" className="text-sm font-normal cursor-pointer">{t('shipping.saveAddress')}</Label>
      </div>
    </div>
  );
};
