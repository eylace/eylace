import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface ShippingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  saveAddress: boolean;
}

interface ShippingFormProps {
  form: UseFormReturn<any>;
}

export const ShippingForm = ({ form }: ShippingFormProps) => {
  const { register, formState: { errors }, setValue, watch } = form;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">Shipping Information</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            placeholder="John"
            {...register('firstName', { required: 'First name is required' })}
            className={errors.firstName ? 'border-destructive' : ''}
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            {...register('lastName', { required: 'Last name is required' })}
            className={errors.lastName ? 'border-destructive' : ''}
          />
          {errors.lastName && (
            <p className="text-xs text-destructive">{errors.lastName.message as string}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            {...register('phone', { required: 'Phone is required' })}
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message as string}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Street Address *</Label>
        <Input
          id="address"
          placeholder="123 Main Street"
          {...register('address', { required: 'Address is required' })}
          className={errors.address ? 'border-destructive' : ''}
        />
        {errors.address && (
          <p className="text-xs text-destructive">{errors.address.message as string}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="apartment">Apartment, suite, etc. (optional)</Label>
        <Input
          id="apartment"
          placeholder="Apt 4B"
          {...register('apartment')}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-2 col-span-2 sm:col-span-1">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            placeholder="New York"
            {...register('city', { required: 'City is required' })}
            className={errors.city ? 'border-destructive' : ''}
          />
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            placeholder="NY"
            {...register('state', { required: 'State is required' })}
            className={errors.state ? 'border-destructive' : ''}
          />
          {errors.state && (
            <p className="text-xs text-destructive">{errors.state.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="zipCode">ZIP Code *</Label>
          <Input
            id="zipCode"
            placeholder="10001"
            {...register('zipCode', { required: 'ZIP code is required' })}
            className={errors.zipCode ? 'border-destructive' : ''}
          />
          {errors.zipCode && (
            <p className="text-xs text-destructive">{errors.zipCode.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Country *</Label>
          <Select
            defaultValue="US"
            onValueChange={(value) => setValue('country', value)}
          >
            <SelectTrigger className={errors.country ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
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
        <Checkbox 
          id="saveAddress" 
          onCheckedChange={(checked) => setValue('saveAddress', checked)}
        />
        <Label htmlFor="saveAddress" className="text-sm font-normal cursor-pointer">
          Save this address for future orders
        </Label>
      </div>
    </div>
  );
};
