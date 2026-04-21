import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminOrderDistrictMap, type DistrictStats, type GeoJsonFeatureCollection } from '@/components/admin/maps/AdminOrderDistrictMap';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { BD_DISTRICT_LIST, normalizeDistrict } from '@/data/bdDistrictCoords';
import { Loader2, MapPin, Search } from 'lucide-react';

const BD_GEOJSON_SOURCES = [
  'https://raw.githubusercontent.com/ifahimreza/bangladesh-geojson/master/bangladesh.geojson',
];

const isFeatureCollection = (value: unknown): value is GeoJsonFeatureCollection => {
  return !!value && typeof value === 'object' && (value as GeoJsonFeatureCollection).type === 'FeatureCollection' && Array.isArray((value as GeoJsonFeatureCollection).features);
};

const EMPTY_STATS: DistrictStats = {
  total: 0,
  readyToShip: 0,
  delivered: 0,
  cancelled: 0,
  failed: 0,
  pending: 0,
  processing: 0,
  inCourier: 0,
  packaging: 0,
};

const AdminMapsOrderData = () => {
  const { language } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [geojson, setGeojson] = useState<GeoJsonFeatureCollection | null>(null);
  const [geojsonError, setGeojsonError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.functions.invoke('admin-get-orders');
        setOrders(data?.orders || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        for (const url of BD_GEOJSON_SOURCES) {
          const response = await fetch(url);
          if (!response.ok) continue;

          const json = await response.json();
          if (mounted && isFeatureCollection(json)) {
            setGeojson(json);
            setGeojsonError(null);
            return;
          }
        }

        if (mounted) {
          setGeojson(null);
          setGeojsonError(language === 'bn'
            ? 'জেলার বাউন্ডারি ডেটা লোড হয়নি, তাই সেন্টার পয়েন্ট ম্যাপ দেখানো হচ্ছে।'
            : 'District boundary data could not be loaded, so the center-point map is being shown.');
        }
      } catch {
        if (mounted) {
          setGeojson(null);
          setGeojsonError(language === 'bn'
            ? 'ম্যাপ বাউন্ডারি লোড হয়নি, fallback district map দেখানো হচ্ছে।'
            : 'Map boundaries failed to load, so the fallback district map is being shown.');
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [language]);

  const statsByDistrict = useMemo(() => {
    const districtMap: Record<string, DistrictStats> = {};

    for (const order of orders) {
      const shippingAddress = order.shipping_address || {};
      // Try every address-like field; many records only have the district in the freeform `address` line
      const candidates = [
        shippingAddress.district,
        shippingAddress.state,
        shippingAddress.city,
        shippingAddress.address,
        shippingAddress.area,
      ].filter(Boolean) as string[];

      let districtKey: string | null = null;
      for (const candidate of candidates) {
        districtKey = normalizeDistrict(candidate);
        if (districtKey) break;
      }
      if (!districtKey) continue;

      if (!districtMap[districtKey]) {
        districtMap[districtKey] = { ...EMPTY_STATS };
      }

      districtMap[districtKey].total += 1;

      const status = (order.status || '').toLowerCase();
      if (status === 'pending') districtMap[districtKey].pending += 1;
      else if (status === 'processing' || status === 'confirmed') districtMap[districtKey].processing += 1;
      else if (status === 'packaging' || status === 'packed') districtMap[districtKey].packaging += 1;
      else if (status === 'sent_to_courier' || status === 'shipped' || status === 'in_transit' || status === 'out_for_delivery') districtMap[districtKey].inCourier += 1;
      else if (status === 'ready_to_ship') districtMap[districtKey].readyToShip += 1;
      else if (status === 'delivered' || status === 'completed') districtMap[districtKey].delivered += 1;
      else if (status === 'cancelled' || status === 'canceled') districtMap[districtKey].cancelled += 1;
      else if (status === 'failed' || status === 'returned' || status === 'refunded') districtMap[districtKey].failed += 1;
    }

    return districtMap;
  }, [orders]);

  const filteredDistricts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return BD_DISTRICT_LIST;

    return BD_DISTRICT_LIST.filter((district) => (
      district.name.toLowerCase().includes(query) || district.nameBn.includes(search)
    ));
  }, [search]);

  const selectedStats = selectedDistrict ? (statsByDistrict[selectedDistrict] || EMPTY_STATS) : null;

  const labels = language === 'bn'
    ? {
        title: 'ম্যাপস অর্ডার ডেটা',
        desc: 'জেলা অনুযায়ী অর্ডার পরিসংখ্যান',
        search: 'জেলা খুঁজুন...',
        total: 'মোট',
        ready: 'শিপ করার জন্য প্রস্তুত',
        delivered: 'ডেলিভারি হয়েছে',
        cancelled: 'বাতিল',
        failed: 'ব্যর্থ',
        loading: 'লোড হচ্ছে...',
        clickHint: 'একটি জেলা নির্বাচন করুন',
        noDistricts: 'কোনো জেলা পাওয়া যায়নি',
        mapLoading: 'ম্যাপ লোড হচ্ছে...',
        mapFallback: 'বাউন্ডারি ম্যাপ না পাওয়া গেলে fallback district map চালু থাকবে।',
        pending: 'পেন্ডিং',
        processing: 'প্রসেসিং',
        packaging: 'প্যাকেজিং',
        inCourier: 'কুরিয়ারে',
      }
    : {
        title: 'Maps Order Data',
        desc: 'District-wise order statistics',
        search: 'Search district...',
        total: 'Total',
        ready: 'Ready to Ship',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
        failed: 'Failed',
        loading: 'Loading...',
        clickHint: 'Select a district',
        noDistricts: 'No districts found',
        mapLoading: 'Loading map...',
        mapFallback: 'Boundary data is unavailable, so the fallback district map will remain active.',
        pending: 'Pending',
        processing: 'Processing',
        packaging: 'Packaging',
        inCourier: 'In Courier',
      };

  return (
    <AdminLayout titleKey="admin.title.orders" descriptionKey="admin.desc.orders">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-base font-bold text-foreground">{labels.title}</h2>
            <p className="text-xs text-muted-foreground">{labels.desc}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="border border-border lg:col-span-4">
              <CardContent className="p-3">
                <div className="relative mb-3">
                  <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={labels.search}
                    className="h-8 pl-7 text-xs"
                  />
                </div>

                <div className="max-h-[560px] overflow-y-auto divide-y divide-border">
                  {filteredDistricts.map((district) => {
                    const stats = statsByDistrict[district.name] || EMPTY_STATS;
                    const active = selectedDistrict === district.name;

                    return (
                      <button
                        key={district.name}
                        onClick={() => setSelectedDistrict(district.name)}
                        className={`w-full px-3 py-2.5 text-left transition-colors hover:bg-muted/50 ${active ? 'bg-primary/10' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className={`text-sm ${active ? 'font-semibold text-primary' : 'text-foreground'}`}>
                            {language === 'bn' ? district.nameBn : district.name}
                          </span>
                          <span className={`text-xs font-semibold ${stats.total > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                            ({stats.total})
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {filteredDistricts.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground">{labels.noDistricts}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border border-border lg:col-span-8">
              <CardContent className="p-0">
                <AdminOrderDistrictMap
                  geojson={geojson}
                  geojsonError={geojsonError}
                  language={language}
                  labels={labels}
                  selectedDistrict={selectedDistrict}
                  statsByDistrict={statsByDistrict}
                  onSelectDistrict={setSelectedDistrict}
                />

                {selectedDistrict && selectedStats ? (
                  <div className="grid grid-cols-2 gap-3 border-t border-border p-3 md:grid-cols-3 lg:grid-cols-9">
                    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                      <div className="text-[11px] text-muted-foreground">{labels.total}</div>
                      <div className="text-sm font-semibold text-foreground">{selectedStats.total}</div>
                    </div>
                    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                      <div className="text-[11px] text-muted-foreground">{labels.pending}</div>
                      <div className="text-sm font-semibold text-foreground">{selectedStats.pending}</div>
                    </div>
                    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                      <div className="text-[11px] text-muted-foreground">{labels.processing}</div>
                      <div className="text-sm font-semibold text-foreground">{selectedStats.processing}</div>
                    </div>
                    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                      <div className="text-[11px] text-muted-foreground">{labels.packaging}</div>
                      <div className="text-sm font-semibold text-foreground">{selectedStats.packaging}</div>
                    </div>
                    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                      <div className="text-[11px] text-muted-foreground">{labels.inCourier}</div>
                      <div className="text-sm font-semibold text-foreground">{selectedStats.inCourier}</div>
                    </div>
                    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                      <div className="text-[11px] text-muted-foreground">{labels.ready}</div>
                      <div className="text-sm font-semibold text-foreground">{selectedStats.readyToShip}</div>
                    </div>
                    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                      <div className="text-[11px] text-muted-foreground">{labels.delivered}</div>
                      <div className="text-sm font-semibold text-foreground">{selectedStats.delivered}</div>
                    </div>
                    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                      <div className="text-[11px] text-muted-foreground">{labels.cancelled}</div>
                      <div className="text-sm font-semibold text-foreground">{selectedStats.cancelled}</div>
                    </div>
                    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
                      <div className="text-[11px] text-muted-foreground">{labels.failed}</div>
                      <div className="text-sm font-semibold text-foreground">{selectedStats.failed}</div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-border p-3 text-center text-xs text-muted-foreground">
                    {labels.clickHint}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminMapsOrderData;