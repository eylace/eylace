import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryLocation {
  division: string;
  divisionBn: string;
  district: string;
  districtBn: string;
  upazila: string;
  upazilaBn: string;
  streetAddress?: string;
}

interface DeliveryLocationContextType {
  location: DeliveryLocation | null;
  setLocation: (loc: DeliveryLocation) => void;
  clearLocation: () => void;
  isPickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
}

const STORAGE_KEY = 'eylace-delivery-location';

const DeliveryLocationContext = createContext<DeliveryLocationContextType | undefined>(undefined);

export const DeliveryLocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocationState] = useState<DeliveryLocation | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const { user } = useAuth();

  const setLocation = useCallback((loc: DeliveryLocation) => {
    setLocationState(loc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));

    // Sync to profile if logged in
    if (user) {
      supabase.from('profiles').update({
        city: loc.district,
        state: loc.division,
        address: [loc.upazila, loc.streetAddress].filter(Boolean).join(', '),
      }).eq('user_id', user.id).then(() => {});
    }
  }, [user]);

  const clearLocation = useCallback(() => {
    setLocationState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <DeliveryLocationContext.Provider value={{
      location,
      setLocation,
      clearLocation,
      isPickerOpen,
      openPicker: () => setIsPickerOpen(true),
      closePicker: () => setIsPickerOpen(false),
    }}>
      {children}
    </DeliveryLocationContext.Provider>
  );
};

export const useDeliveryLocation = () => {
  const context = useContext(DeliveryLocationContext);
  if (!context) throw new Error('useDeliveryLocation must be used within DeliveryLocationProvider');
  return context;
};
