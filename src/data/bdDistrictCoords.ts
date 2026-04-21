// District centroid coordinates for Bangladesh (64 districts)
// Used as fallback markers when GeoJSON polygon is unavailable
export const BD_DISTRICT_COORDS: Record<string, { lat: number; lng: number; nameBn: string }> = {
  Dhaka: { lat: 23.8103, lng: 90.4125, nameBn: 'ঢাকা' },
  Faridpur: { lat: 23.6070, lng: 89.8429, nameBn: 'ফরিদপুর' },
  Gazipur: { lat: 24.0023, lng: 90.4264, nameBn: 'গাজীপুর' },
  Gopalganj: { lat: 23.0050, lng: 89.8266, nameBn: 'গোপালগঞ্জ' },
  Kishoreganj: { lat: 24.4260, lng: 90.7826, nameBn: 'কিশোরগঞ্জ' },
  Madaripur: { lat: 23.1641, lng: 90.1897, nameBn: 'মাদারীপুর' },
  Manikganj: { lat: 23.8617, lng: 90.0003, nameBn: 'মানিকগঞ্জ' },
  Munshiganj: { lat: 23.5422, lng: 90.5305, nameBn: 'মুন্সিগঞ্জ' },
  Narayanganj: { lat: 23.6238, lng: 90.5000, nameBn: 'নারায়ণগঞ্জ' },
  Narsingdi: { lat: 23.9322, lng: 90.7150, nameBn: 'নরসিংদী' },
  Rajbari: { lat: 23.7574, lng: 89.6444, nameBn: 'রাজবাড়ী' },
  Shariatpur: { lat: 23.2423, lng: 90.4348, nameBn: 'শরীয়তপুর' },
  Tangail: { lat: 24.2513, lng: 89.9167, nameBn: 'টাঙ্গাইল' },
  Chattogram: { lat: 22.3569, lng: 91.7832, nameBn: 'চট্টগ্রাম' },
  Chittagong: { lat: 22.3569, lng: 91.7832, nameBn: 'চট্টগ্রাম' },
  Bandarban: { lat: 22.1953, lng: 92.2184, nameBn: 'বান্দরবান' },
  Brahmanbaria: { lat: 23.9571, lng: 91.1119, nameBn: 'ব্রাহ্মণবাড়িয়া' },
  Chandpur: { lat: 23.2333, lng: 90.6713, nameBn: 'চাঁদপুর' },
  Comilla: { lat: 23.4607, lng: 91.1809, nameBn: 'কুমিল্লা' },
  'Cox\'s Bazar': { lat: 21.4272, lng: 92.0058, nameBn: 'কক্সবাজার' },
  Feni: { lat: 23.0159, lng: 91.3976, nameBn: 'ফেনী' },
  Khagrachhari: { lat: 23.1193, lng: 91.9847, nameBn: 'খাগড়াছড়ি' },
  Lakshmipur: { lat: 22.9447, lng: 90.8282, nameBn: 'লক্ষ্মীপুর' },
  Noakhali: { lat: 22.8696, lng: 91.0995, nameBn: 'নোয়াখালী' },
  Rangamati: { lat: 22.7324, lng: 92.2985, nameBn: 'রাঙ্গামাটি' },
  Rajshahi: { lat: 24.3636, lng: 88.6241, nameBn: 'রাজশাহী' },
  Bogra: { lat: 24.8465, lng: 89.3776, nameBn: 'বগুড়া' },
  Bogura: { lat: 24.8465, lng: 89.3776, nameBn: 'বগুড়া' },
  Joypurhat: { lat: 25.0968, lng: 89.0227, nameBn: 'জয়পুরহাট' },
  Naogaon: { lat: 24.7936, lng: 88.9318, nameBn: 'নওগাঁ' },
  Natore: { lat: 24.4206, lng: 89.0003, nameBn: 'নাটোর' },
  Chapainawabganj: { lat: 24.5965, lng: 88.2775, nameBn: 'চাঁপাইনবাবগঞ্জ' },
  Pabna: { lat: 24.0064, lng: 89.2372, nameBn: 'পাবনা' },
  Sirajganj: { lat: 24.4534, lng: 89.7007, nameBn: 'সিরাজগঞ্জ' },
  Khulna: { lat: 22.8456, lng: 89.5403, nameBn: 'খুলনা' },
  Bagerhat: { lat: 22.6516, lng: 89.7857, nameBn: 'বাগেরহাট' },
  Chuadanga: { lat: 23.6402, lng: 88.8418, nameBn: 'চুয়াডাঙ্গা' },
  Jessore: { lat: 23.1664, lng: 89.2081, nameBn: 'যশোর' },
  Jashore: { lat: 23.1664, lng: 89.2081, nameBn: 'যশোর' },
  Jhenaidah: { lat: 23.5448, lng: 89.1539, nameBn: 'ঝিনাইদহ' },
  Kushtia: { lat: 23.9013, lng: 89.1206, nameBn: 'কুষ্টিয়া' },
  Magura: { lat: 23.4873, lng: 89.4197, nameBn: 'মাগুরা' },
  Meherpur: { lat: 23.7622, lng: 88.6318, nameBn: 'মেহেরপুর' },
  Narail: { lat: 23.1725, lng: 89.4988, nameBn: 'নড়াইল' },
  Satkhira: { lat: 22.7185, lng: 89.0705, nameBn: 'সাতক্ষীরা' },
  Barisal: { lat: 22.7010, lng: 90.3535, nameBn: 'বরিশাল' },
  Barishal: { lat: 22.7010, lng: 90.3535, nameBn: 'বরিশাল' },
  Barguna: { lat: 22.0953, lng: 90.1121, nameBn: 'বরগুনা' },
  Bhola: { lat: 22.6859, lng: 90.6482, nameBn: 'ভোলা' },
  Jhalokati: { lat: 22.6406, lng: 90.1987, nameBn: 'ঝালকাঠি' },
  Patuakhali: { lat: 22.3596, lng: 90.3296, nameBn: 'পটুয়াখালী' },
  Pirojpur: { lat: 22.5790, lng: 89.9759, nameBn: 'পিরোজপুর' },
  Sylhet: { lat: 24.8949, lng: 91.8687, nameBn: 'সিলেট' },
  Habiganj: { lat: 24.3745, lng: 91.4155, nameBn: 'হবিগঞ্জ' },
  Moulvibazar: { lat: 24.4829, lng: 91.7774, nameBn: 'মৌলভীবাজার' },
  Sunamganj: { lat: 25.0658, lng: 91.3950, nameBn: 'সুনামগঞ্জ' },
  Rangpur: { lat: 25.7439, lng: 89.2752, nameBn: 'রংপুর' },
  Dinajpur: { lat: 25.6217, lng: 88.6354, nameBn: 'দিনাজপুর' },
  Gaibandha: { lat: 25.3289, lng: 89.5285, nameBn: 'গাইবান্ধা' },
  Kurigram: { lat: 25.8054, lng: 89.6360, nameBn: 'কুড়িগ্রাম' },
  Lalmonirhat: { lat: 25.9923, lng: 89.2847, nameBn: 'লালমনিরহাট' },
  Nilphamari: { lat: 25.9314, lng: 88.8560, nameBn: 'নীলফামারী' },
  Panchagarh: { lat: 26.3411, lng: 88.5542, nameBn: 'পঞ্চগড়' },
  Thakurgaon: { lat: 26.0336, lng: 88.4616, nameBn: 'ঠাকুরগাঁও' },
  Mymensingh: { lat: 24.7471, lng: 90.4203, nameBn: 'ময়মনসিংহ' },
  Jamalpur: { lat: 24.9375, lng: 89.9372, nameBn: 'জামালপুর' },
  Netrokona: { lat: 24.8703, lng: 90.7274, nameBn: 'নেত্রকোণা' },
  Sherpur: { lat: 25.0204, lng: 90.0152, nameBn: 'শেরপুর' },
};

export const BD_DISTRICT_LIST = Object.entries(BD_DISTRICT_COORDS)
  .filter(([k]) => !['Chittagong', 'Bogra', 'Jashore', 'Barishal'].includes(k))
  .map(([name, v]) => ({ name, ...v }))
  .sort((a, b) => a.name.localeCompare(b.name));

// Normalize a district-like string to a known key
export function normalizeDistrict(input?: string | null): string | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();
  for (const key of Object.keys(BD_DISTRICT_COORDS)) {
    if (key.toLowerCase() === s) return key === 'Chittagong' ? 'Chattogram'
      : key === 'Bogra' ? 'Bogura'
      : key === 'Jashore' ? 'Jessore'
      : key === 'Barishal' ? 'Barisal'
      : key;
  }
  // partial: contains
  for (const key of Object.keys(BD_DISTRICT_COORDS)) {
    if (s.includes(key.toLowerCase()) || key.toLowerCase().includes(s)) {
      return key === 'Chittagong' ? 'Chattogram'
        : key === 'Bogra' ? 'Bogura'
        : key === 'Jashore' ? 'Jessore'
        : key === 'Barishal' ? 'Barisal'
        : key;
    }
  }
  return null;
}