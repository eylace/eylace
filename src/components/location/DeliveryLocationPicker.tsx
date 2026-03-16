import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { useDeliveryLocation } from '@/contexts/DeliveryLocationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { bangladeshDivisions } from '@/data/bangladeshLocations';

export const DeliveryLocationPicker = () => {
  const { location, setLocation, isPickerOpen, closePicker } = useDeliveryLocation();
  const { language, t } = useLanguage();

  const [selectedDivision, setSelectedDivision] = useState(location?.division || '');
  const [selectedDistrict, setSelectedDistrict] = useState(location?.district || '');
  const [selectedUpazila, setSelectedUpazila] = useState(location?.upazila || '');
  const [streetAddress, setStreetAddress] = useState(location?.streetAddress || '');

  const isBn = language === 'bn';

  const districts = useMemo(() => {
    const div = bangladeshDivisions.find(d => d.name === selectedDivision);
    return div?.districts || [];
  }, [selectedDivision]);

  const upazilas = useMemo(() => {
    const dist = districts.find(d => d.name === selectedDistrict);
    return dist?.upazilas || [];
  }, [districts, selectedDistrict]);

  const handleDivisionChange = (val: string) => {
    setSelectedDivision(val);
    setSelectedDistrict('');
    setSelectedUpazila('');
  };

  const handleDistrictChange = (val: string) => {
    setSelectedDistrict(val);
    setSelectedUpazila('');
  };

  const handleSave = () => {
    if (!selectedDivision || !selectedDistrict || !selectedUpazila) return;
    const div = bangladeshDivisions.find(d => d.name === selectedDivision)!;
    const dist = div.districts.find(d => d.name === selectedDistrict)!;
    const upa = dist.upazilas.find(u => u.name === selectedUpazila)!;

    setLocation({
      division: div.name,
      divisionBn: div.nameBn,
      district: dist.name,
      districtBn: dist.nameBn,
      upazila: upa.name,
      upazilaBn: upa.nameBn,
      streetAddress: streetAddress.trim() || undefined,
    });
    closePicker();
  };

  // Reset form state when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSelectedDivision(location?.division || '');
      setSelectedDistrict(location?.district || '');
      setSelectedUpazila(location?.upazila || '');
      setStreetAddress(location?.streetAddress || '');
    } else {
      closePicker();
    }
  };

  return (
    <Dialog open={isPickerOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {t('location.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Division */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t('location.selectDivision')}
            </label>
            <Select value={selectedDivision} onValueChange={handleDivisionChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('location.selectDivision')} />
              </SelectTrigger>
              <SelectContent>
                {bangladeshDivisions.map(div => (
                  <SelectItem key={div.name} value={div.name}>
                    {isBn ? div.nameBn : div.name} {!isBn && `(${div.nameBn})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* District */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t('location.selectDistrict')}
            </label>
            <Select value={selectedDistrict} onValueChange={handleDistrictChange} disabled={!selectedDivision}>
              <SelectTrigger>
                <SelectValue placeholder={t('location.selectDistrict')} />
              </SelectTrigger>
              <SelectContent>
                {districts.map(dist => (
                  <SelectItem key={dist.name} value={dist.name}>
                    {isBn ? dist.nameBn : dist.name} {!isBn && `(${dist.nameBn})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upazila */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t('location.selectUpazila')}
            </label>
            <Select value={selectedUpazila} onValueChange={setSelectedUpazila} disabled={!selectedDistrict}>
              <SelectTrigger>
                <SelectValue placeholder={t('location.selectUpazila')} />
              </SelectTrigger>
              <SelectContent>
                {upazilas.map(upa => (
                  <SelectItem key={upa.name} value={upa.name}>
                    {isBn ? upa.nameBn : upa.name} {!isBn && `(${upa.nameBn})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Street Address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t('location.streetAddress')}
            </label>
            <Input
              value={streetAddress}
              onChange={e => setStreetAddress(e.target.value)}
              placeholder={isBn ? 'বাড়ি নং, রাস্তা, এলাকা...' : 'House no, Road, Area...'}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!selectedDivision || !selectedDistrict || !selectedUpazila}
            className="w-full"
          >
            {t('location.saveAddress')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
