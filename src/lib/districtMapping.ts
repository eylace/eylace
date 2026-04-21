import { BD_DISTRICT_COORDS, BD_DISTRICT_LIST, normalizeDistrict as normalizeLegacyDistrict } from '@/data/bdDistrictCoords';

export type DistrictStatusKey =
  | 'pending'
  | 'processing'
  | 'packaging'
  | 'readyToShip'
  | 'inCourier'
  | 'delivered'
  | 'cancelled'
  | 'failed';

export interface DistrictMapLabels {
  total: string;
  ready: string;
  delivered: string;
  cancelled: string;
  failed: string;
  mapLoading: string;
  mapFallback: string;
  pending: string;
  processing: string;
  inCourier: string;
  packaging: string;
  statusLegend: string;
  statusLegendHint: string;
  pendingHelp: string;
  processingHelp: string;
  packagingHelp: string;
  readyHelp: string;
  inCourierHelp: string;
  deliveredHelp: string;
  cancelledHelp: string;
  failedHelp: string;
}

export interface ShippingAddressDistrictMatch {
  district: string | null;
  matchedAlias: string | null;
  normalizedValue: string;
  confidence: 'exact' | 'contains' | 'none';
  sourceField: string | null;
  issue: 'ok' | 'review' | 'unmatched';
  rawValues: Array<{ field: string; value: string }>;
}

interface DistrictAliasEntry {
  district: string;
  alias: string;
}

const BANGLA_CHAR_NORMALIZERS: Array<[RegExp, string]> = [
  [/য়/g, 'য়'],
  [/ড়/g, 'ড়'],
  [/ঢ়/g, 'ঢ়'],
  [/ৱ/g, 'ও'],
];

const BANGLA_DIGIT_MAP: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

const ADDRESS_STOPWORDS = [
  'district', 'dist', 'zilla', 'zila', 'division', 'upazila', 'upozilla', 'thana', 'sadar', 'city', 'pourashava', 'pouroshova', 'union', 'ward',
  'road', 'rd', 'house', 'flat', 'block', 'village', 'gram', 'para', 'post', 'postcode', 'zip', 'bangladesh',
  'জেলা', 'ডিস্ট্রিক্ট', 'বিভাগ', 'উপজেলা', 'থানা', 'সদর', 'সিটি', 'পৌরসভা', 'ইউনিয়ন', 'ইউনিয়ন', 'ওয়ার্ড', 'ওয়ার্ড', 'রোড', 'বাড়ি', 'বাড়ি', 'গ্রাম', 'বাংলাদেশ',
];

const DISTRICT_ALIAS_GROUPS: Partial<Record<string, string[]>> = {
  Barguna: ['borguna', 'বরগুনা'],
  Barisal: ['barisal', 'barishal', 'বরিশাল'],
  Bhola: ['bhola', 'ভোলা'],
  Jhalokati: ['jhalokati', 'jhalakathi', 'ঝালকাঠি'],
  Patuakhali: ['patuakhali', 'পটুয়াখালী', 'পটুয়াখালী'],
  Pirojpur: ['pirojpur', 'pirojpur', 'পিরোজপুর'],
  Bandarban: ['bandarban', 'বান্দরবান'],
  Brahmanbaria: ['brahmanbaria', 'brahman bariya', 'brammanbaria', 'ব্রাহ্মণবাড়িয়া', 'ব্রাহ্মণবাড়িয়া'],
  Chandpur: ['chandpur', 'চাঁদপুর', 'চাদপুর'],
  Chattogram: ['chattogram', 'chittagong', 'চট্টগ্রাম'],
  Comilla: ['comilla', 'cumilla', 'কুমিল্লা'],
  "Cox's Bazar": ['coxs bazar', 'coxs bazaar', "cox's bazar", 'cox bazar', 'কক্সবাজার'],
  Feni: ['feni', 'ফেনী'],
  Khagrachhari: ['khagrachhari', 'khagrachari', 'খাগড়াছড়ি', 'খাগড়াছড়ি'],
  Lakshmipur: ['lakshmipur', 'laxmipur', 'লক্ষ্মীপুর'],
  Noakhali: ['noakhali', 'নোয়াখালী', 'নোয়াখালী'],
  Rangamati: ['rangamati', 'রাঙ্গামাটি'],
  Dhaka: ['dhaka', 'ঢাকা'],
  Faridpur: ['faridpur', 'ফরিদপুর'],
  Gazipur: ['gazipur', 'গাজীপুর'],
  Gopalganj: ['gopalganj', 'গোপালগঞ্জ'],
  Kishoreganj: ['kishoreganj', 'কিশোরগঞ্জ'],
  Madaripur: ['madaripur', 'মাদারীপুর'],
  Manikganj: ['manikganj', 'মানিকগঞ্জ'],
  Munshiganj: ['munshiganj', 'মুন্সিগঞ্জ'],
  Narayanganj: ['narayanganj', 'নারায়ণগঞ্জ', 'নারায়ণগঞ্জ'],
  Narsingdi: ['narsingdi', 'narshingdi', 'নরসিংদী'],
  Rajbari: ['rajbari', 'রাজবাড়ী', 'রাজবাড়ী'],
  Shariatpur: ['shariatpur', 'শরীয়তপুর', 'শরীয়তপুর'],
  Tangail: ['tangail', 'টাঙ্গাইল'],
  Bagerhat: ['bagerhat', 'বাগেরহাট'],
  Chuadanga: ['chuadanga', 'চুয়াডাঙ্গা', 'চুয়াডাঙ্গা'],
  Jessore: ['jessore', 'jashore', 'যশোর'],
  Jhenaidah: ['jhenaidah', 'ঝিনাইদহ'],
  Khulna: ['khulna', 'খুলনা'],
  Kushtia: ['kushtia', 'কুষ্টিয়া', 'কুষ্টিয়া'],
  Magura: ['magura', 'মাগুরা'],
  Meherpur: ['meherpur', 'মেহেরপুর'],
  Narail: ['narail', 'নড়াইল', 'নড়াইল'],
  Satkhira: ['satkhira', 'সাতক্ষীরা'],
  Jamalpur: ['jamalpur', 'জামালপুর'],
  Mymensingh: ['mymensingh', 'ময়মনসিংহ', 'ময়মনসিংহ'],
  Netrokona: ['netrokona', 'netrakona', 'নেত্রকোণা'],
  Sherpur: ['sherpur', 'শেরপুর'],
  Bogura: ['bogura', 'bogra', 'বগুড়া', 'বগুড়া'],
  Joypurhat: ['joypurhat', 'জয়পুরহাট', 'জয়পুরহাট'],
  Naogaon: ['naogaon', 'নওগাঁ'],
  Natore: ['natore', 'নাটোর'],
  Chapainawabganj: ['chapainawabganj', 'chapai nawabganj', 'চাঁপাইনবাবগঞ্জ'],
  Pabna: ['pabna', 'পাবনা'],
  Rajshahi: ['rajshahi', 'রাজশাহী'],
  Sirajganj: ['sirajganj', 'সিরাজগঞ্জ'],
  Habiganj: ['habiganj', 'হবিগঞ্জ'],
  Moulvibazar: ['moulvibazar', 'maulvibazar', 'moulvibazar', 'মৌলভীবাজার'],
  Sunamganj: ['sunamganj', 'সুনামগঞ্জ'],
  Sylhet: ['sylhet', 'সিলেট'],
  Dinajpur: ['dinajpur', 'দিনাজপুর'],
  Gaibandha: ['gaibandha', 'গাইবান্ধা'],
  Kurigram: ['kurigram', 'কুড়িগ্রাম', 'কুড়িগ্রাম'],
  Lalmonirhat: ['lalmonirhat', 'লালমনিরহাট'],
  Nilphamari: ['nilphamari', 'নীলফামারী'],
  Panchagarh: ['panchagarh', 'পঞ্চগড়', 'পঞ্চগড়'],
  Rangpur: ['rangpur', 'রংপুর'],
  Thakurgaon: ['thakurgaon', 'ঠাকুরগাঁও'],
};

const ADDRESS_FIELDS = ['district', 'state', 'city', 'area', 'address', 'upazila', 'thana', 'region', 'division'];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const normalizeAddressText = (input?: string | null) => {
  if (!input) return '';

  let value = String(input)
    .split('')
    .map((char) => BANGLA_DIGIT_MAP[char] ?? char)
    .join('')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[’'`]/g, '')
    .replace(/[–—−]/g, ' ')
    .replace(/[(){}\[\]<>|/\\,;:]+/g, ' ')
    .replace(/[.&_-]+/g, ' ');

  BANGLA_CHAR_NORMALIZERS.forEach(([pattern, replacement]) => {
    value = value.replace(pattern, replacement);
  });

  for (const word of ADDRESS_STOPWORDS) {
    value = value.replace(new RegExp(`(^|\\s)${escapeRegExp(word)}(?=\\s|$)`, 'g'), ' ');
  }

  return value.replace(/\s+/g, ' ').trim();
};

const buildAliasEntries = (): DistrictAliasEntry[] => {
  const aliasMap = new Map<string, Set<string>>();

  BD_DISTRICT_LIST.forEach((district) => {
    aliasMap.set(district.name, new Set([district.name, district.nameBn]));
  });

  Object.keys(BD_DISTRICT_COORDS).forEach((key) => {
    const canonical = normalizeLegacyDistrict(key);
    if (!canonical) return;
    if (!aliasMap.has(canonical)) aliasMap.set(canonical, new Set([canonical]));
    aliasMap.get(canonical)!.add(key);
  });

  Object.entries(DISTRICT_ALIAS_GROUPS).forEach(([district, aliases]) => {
    if (!aliasMap.has(district)) aliasMap.set(district, new Set([district]));
    aliases.forEach((alias) => aliasMap.get(district)!.add(alias));
  });

  return Array.from(aliasMap.entries())
    .flatMap(([district, aliases]) => Array.from(aliases).map((alias) => ({ district, alias: normalizeAddressText(alias) })))
    .filter((entry) => entry.alias.length > 1)
    .sort((a, b) => b.alias.length - a.alias.length);
};

const DISTRICT_ALIAS_ENTRIES = buildAliasEntries();

const splitCandidateSegments = (value: string) => {
  return Array.from(new Set(
    value
      .split(/[\n,;/|]+/)
      .map((segment) => normalizeAddressText(segment))
      .filter(Boolean),
  ));
};

const hasAliasMatch = (normalizedSource: string, normalizedAlias: string) => {
  if (!normalizedSource || !normalizedAlias) return false;
  if (normalizedSource === normalizedAlias) return true;

  const isLatinAlias = /^[a-z0-9 ]+$/.test(normalizedAlias);
  if (isLatinAlias) {
    return new RegExp(`(^|\\s)${escapeRegExp(normalizedAlias)}(?=\\s|$)`).test(normalizedSource);
  }

  return normalizedSource.includes(normalizedAlias);
};

export const extractDistrictFromText = (input?: string | null) => {
  const normalizedValue = normalizeAddressText(input);
  if (!normalizedValue) {
    return {
      district: null,
      matchedAlias: null,
      normalizedValue,
      confidence: 'none' as const,
    };
  }

  const segments = [normalizedValue, ...splitCandidateSegments(String(input))];

  for (const segment of segments) {
    const exactMatch = DISTRICT_ALIAS_ENTRIES.find((entry) => entry.alias === segment);
    if (exactMatch) {
      return {
        district: exactMatch.district,
        matchedAlias: exactMatch.alias,
        normalizedValue,
        confidence: 'exact' as const,
      };
    }
  }

  for (const segment of segments) {
    const containsMatch = DISTRICT_ALIAS_ENTRIES.find((entry) => hasAliasMatch(segment, entry.alias));
    if (containsMatch) {
      return {
        district: containsMatch.district,
        matchedAlias: containsMatch.alias,
        normalizedValue,
        confidence: 'contains' as const,
      };
    }
  }

  const fallback = normalizeLegacyDistrict(input);
  return {
    district: fallback,
    matchedAlias: fallback ? normalizeAddressText(fallback) : null,
    normalizedValue,
    confidence: fallback ? ('contains' as const) : ('none' as const),
  };
};

export const getShippingAddressDistrictMatch = (shippingAddress: unknown): ShippingAddressDistrictMatch => {
  const address = typeof shippingAddress === 'object' && shippingAddress !== null
    ? shippingAddress as Record<string, unknown>
    : {};

  const rawValues = ADDRESS_FIELDS.flatMap((field) => {
    const value = address[field];
    return typeof value === 'string' && value.trim()
      ? [{ field, value: value.trim() }]
      : [];
  });

  for (const candidate of rawValues) {
    const match = extractDistrictFromText(candidate.value);
    if (!match.district) continue;

    const issue = ['district', 'state'].includes(candidate.field)
      ? 'ok'
      : candidate.field === 'city' && match.confidence === 'exact'
        ? 'ok'
        : 'review';

    return {
      ...match,
      sourceField: candidate.field,
      issue,
      rawValues,
    };
  }

  const combined = rawValues.map((entry) => entry.value).join(' ');
  const combinedMatch = extractDistrictFromText(combined);
  if (combinedMatch.district) {
    return {
      ...combinedMatch,
      sourceField: 'combined',
      issue: 'review',
      rawValues,
    };
  }

  return {
    district: null,
    matchedAlias: null,
    normalizedValue: normalizeAddressText(combined),
    confidence: 'none',
    sourceField: null,
    issue: 'unmatched',
    rawValues,
  };
};

export const getFeatureDistrictKey = (feature: any) => {
  const props = feature?.properties || {};
  const featureName = props.NAME_3 || props.DIST_NAME || props.District || props.district || props.name || props.NAME || props.NAME_2 || props.NAME_1 || '';
  return extractDistrictFromText(featureName).district ?? normalizeLegacyDistrict(featureName);
};

export const mapOrderStatusToDistrictBucket = (status: string): DistrictStatusKey | null => {
  const normalized = status.trim().toLowerCase();

  if (['pending', 'awaiting_payment'].includes(normalized)) return 'pending';
  if (['processing', 'confirmed', 'on_hold'].includes(normalized)) return 'processing';
  if (['packaging', 'packed', 'ready_for_pickup'].includes(normalized)) return 'packaging';
  if (['ready_to_ship'].includes(normalized)) return 'readyToShip';
  if (['sent_to_courier', 'shipped', 'in_transit', 'out_for_delivery', 'dispatched'].includes(normalized)) return 'inCourier';
  if (['delivered', 'completed', 'fulfilled'].includes(normalized)) return 'delivered';
  if (['cancelled', 'canceled'].includes(normalized)) return 'cancelled';
  if (['failed', 'returned', 'refunded', 'delivery_failed'].includes(normalized)) return 'failed';

  return null;
};

export const getDistrictStatusLegend = (labels: DistrictMapLabels) => {
  return [
    { key: 'pending', label: labels.pending, description: labels.pendingHelp, dotClass: 'bg-warning', popupToken: '--warning' },
    { key: 'processing', label: labels.processing, description: labels.processingHelp, dotClass: 'bg-accent', popupToken: '--accent' },
    { key: 'packaging', label: labels.packaging, description: labels.packagingHelp, dotClass: 'bg-secondary', popupToken: '--secondary' },
    { key: 'readyToShip', label: labels.ready, description: labels.readyHelp, dotClass: 'bg-primary/70', popupToken: '--primary' },
    { key: 'inCourier', label: labels.inCourier, description: labels.inCourierHelp, dotClass: 'bg-primary', popupToken: '--primary' },
    { key: 'delivered', label: labels.delivered, description: labels.deliveredHelp, dotClass: 'bg-success', popupToken: '--success' },
    { key: 'cancelled', label: labels.cancelled, description: labels.cancelledHelp, dotClass: 'bg-destructive/70', popupToken: '--destructive' },
    { key: 'failed', label: labels.failed, description: labels.failedHelp, dotClass: 'bg-destructive', popupToken: '--destructive' },
  ] as const;
};