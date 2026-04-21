import { describe, expect, it } from 'vitest';
import { BD_DISTRICT_LIST } from '@/data/bdDistrictCoords';
import { extractDistrictFromText, getShippingAddressDistrictMatch, mapOrderStatusToDistrictBucket, normalizeAddressText } from '@/lib/districtMapping';

const SAMPLE_VARIANTS: Record<string, string[]> = {
  Dhaka: ['Dhaka', 'ঢাকা', 'dhaka district', 'Dhaka-1216', 'House 12, Road 3, Mirpur, Dhaka'],
  Jhenaidah: ['ঝিনাইদহ', 'Jhenaidah Sadar', 'shailkupa, jhenaidah', 'Jhinaidah'],
  Chattogram: ['Chittagong', 'CTG', 'চট্টগ্রাম', 'Chattogram District'],
  "Cox's Bazar": ["Cox's Bazar", 'Coxs Bazaar', 'কক্সবাজার'],
  Barguna: ['Borgona', 'borguna', 'বরগুনা'],
  Mymensingh: ['Nasirabad', 'Mymensingh', 'ময়মনসিংহ'],
  Rangamati: ['Parbattya Chattagram', 'রাঙ্গামাটি'],
  Bogura: ['Bogra', 'Bogura', 'বগুড়া'],
  Comilla: ['Cumilla', 'কুমিল্লা'],
  Jessore: ['Jashore', 'যশোর'],
  Brahmanbaria: ['B Baria', 'ব্রাহ্মণবাড়িয়া', 'Brahman Bariya'],
  Sirajganj: ['Sirajgonj', 'সিরাজগঞ্জ'],
  Habiganj: ['Hobiganj', 'হবিগঞ্জ'],
  Satkhira: ['Shatkhira', 'সাতক্ষীরা'],
  Sunamganj: ['Sun Amgonj', 'সুনামগঞ্জ'],
  Manikganj: ['Manikgonj', 'মানিকগঞ্জ'],
  Munshiganj: ['Munshigonj', 'মুন্সিগঞ্জ'],
};

describe('district normalization', () => {
  it('strips digits, punctuation and stopwords', () => {
    expect(normalizeAddressText('Dhaka-১২১৬, House #5')).toContain('dhaka');
    expect(normalizeAddressText('Dist.: Jhenaidah, Bangladesh')).toContain('jhenaidah');
  });

  it.each(Object.entries(SAMPLE_VARIANTS).flatMap(([district, variants]) => variants.map((variant) => [district, variant] as const)))(
    'maps variant "%s" → %s',
    (district, variant) => {
      expect(extractDistrictFromText(variant).district).toBe(district);
    },
  );

  it('detects every one of the 64 districts from canonical English and Bangla names', () => {
    for (const district of BD_DISTRICT_LIST) {
      expect(extractDistrictFromText(district.name).district).toBe(district.name);
      expect(extractDistrictFromText(district.nameBn).district).toBe(district.name);
    }
  });

  it('reports an unmatched issue for shipping addresses with no district hints', () => {
    expect(getShippingAddressDistrictMatch({ address: 'House 99, Imaginary Lane' }).issue).toBe('unmatched');
  });

  it('flags free-form-only addresses for review and still suggests a district', () => {
    const result = getShippingAddressDistrictMatch({ address: '7320, Chorbakharba, Shailkupa, Jhenaidah' });
    expect(result.district).toBe('Jhenaidah');
    expect(result.issue).toBe('review');
  });

  it('treats an explicit district field as a clean match', () => {
    const result = getShippingAddressDistrictMatch({ district: 'Khulna', address: 'House 1' });
    expect(result.district).toBe('Khulna');
    expect(result.issue).toBe('ok');
  });

  it('maps order statuses to consistent buckets', () => {
    expect(mapOrderStatusToDistrictBucket('pending')).toBe('pending');
    expect(mapOrderStatusToDistrictBucket('PROCESSING')).toBe('processing');
    expect(mapOrderStatusToDistrictBucket('packaging')).toBe('packaging');
    expect(mapOrderStatusToDistrictBucket('ready_to_ship')).toBe('readyToShip');
    expect(mapOrderStatusToDistrictBucket('sent_to_courier')).toBe('inCourier');
    expect(mapOrderStatusToDistrictBucket('out_for_delivery')).toBe('inCourier');
    expect(mapOrderStatusToDistrictBucket('delivered')).toBe('delivered');
    expect(mapOrderStatusToDistrictBucket('cancelled')).toBe('cancelled');
    expect(mapOrderStatusToDistrictBucket('refunded')).toBe('failed');
    expect(mapOrderStatusToDistrictBucket('unknown_status')).toBeNull();
  });
});