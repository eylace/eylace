import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminOrderDistrictMap, type DistrictStats, type GeoJsonFeatureCollection } from '@/components/admin/maps/AdminOrderDistrictMap';
import { AddressMappingAuditDialog, type AddressMappingAuditRow } from '@/components/admin/maps/AddressMappingAuditDialog';
import { MapStatusLegend } from '@/components/admin/maps/MapStatusLegend';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { BD_DISTRICT_LIST } from '@/data/bdDistrictCoords';
import { extractDistrictFromText, getShippingAddressDistrictMatch, mapOrderStatusToDistrictBucket } from '@/lib/districtMapping';
import { Loader2, MapPin, Search, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

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
  const [auditOpen, setAuditOpen] = useState(false);
  const [savingAuditOrderId, setSavingAuditOrderId] = useState<string | null>(null);

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

  const orderDistrictDetails = useMemo(() => {
    return orders.map((order) => ({
      order,
      match: getShippingAddressDistrictMatch(order.shipping_address),
    }));
  }, [orders]);

  const statsByDistrict = useMemo(() => {
    const districtMap: Record<string, DistrictStats> = {};

    for (const { order, match } of orderDistrictDetails) {
      const districtKey = match.district;
      if (!districtKey) continue;

      if (!districtMap[districtKey]) {
        districtMap[districtKey] = { ...EMPTY_STATS };
      }

      districtMap[districtKey].total += 1;

      const statusBucket = mapOrderStatusToDistrictBucket(order.status || '');
      if (statusBucket) districtMap[districtKey][statusBucket] += 1;
    }

    return districtMap;
  }, [orderDistrictDetails]);

  const auditRows = useMemo<AddressMappingAuditRow[]>(() => {
    return orderDistrictDetails
      .filter(({ match }) => match.issue !== 'ok')
      .map(({ order, match }) => {
        const shippingAddress = order.shipping_address || {};
        const name = [shippingAddress.first_name || shippingAddress.firstName, shippingAddress.last_name || shippingAddress.lastName].filter(Boolean).join(' ') || 'Guest';
        const addressText = match.rawValues.map((entry) => `${entry.field}: ${entry.value}`).join(' • ') || String(shippingAddress.address || '');

        return {
          id: order.id,
          orderNumber: order.order_number,
          customerName: name,
          phone: shippingAddress.phone || order.guest_phone || '',
          status: order.status || '',
          addressText,
          issue: match.issue === 'unmatched' ? 'unmatched' : 'review',
          issueLabel: match.issue === 'unmatched' ? (language === 'bn' ? 'District পাওয়া যায়নি' : 'No district match') : (language === 'bn' ? 'রিভিউ দরকার' : 'Needs review'),
          sourceField: match.sourceField,
          suggestedDistrict: match.district,
          matchedAlias: match.matchedAlias,
        };
      });
  }, [language, orderDistrictDetails]);

  const filteredDistricts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return BD_DISTRICT_LIST;

    return BD_DISTRICT_LIST.filter((district) => (
      district.name.toLowerCase().includes(query) || district.nameBn.includes(search)
    ));
  }, [search]);

  const selectedStats = selectedDistrict ? (statsByDistrict[selectedDistrict] || EMPTY_STATS) : null;

  const handleAuditSave = async (orderId: string, district: string) => {
    if (!district) return;
    const target = orders.find((order) => order.id === orderId);
    if (!target) return;

    setSavingAuditOrderId(orderId);
    try {
      const shippingAddress = { ...(target.shipping_address || {}) };
      shippingAddress.district = district;
      if (!shippingAddress.state || extractDistrictFromText(shippingAddress.state).district == null) {
        shippingAddress.state = district;
      }

      const { error } = await supabase.functions.invoke('admin-update-order', {
        body: { orderId, shipping_address: shippingAddress },
      });

      if (error) throw error;

      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, shipping_address: shippingAddress } : order));
      toast.success(language === 'bn' ? 'District mapping update হয়েছে' : 'District mapping updated');
    } catch (error: any) {
      toast.error(error?.message || (language === 'bn' ? 'Update failed' : 'Update failed'));
    } finally {
      setSavingAuditOrderId(null);
    }
  };

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
        statusLegend: 'স্ট্যাটাস লেজেন্ড',
        statusLegendHint: 'সব জেলা ও popup-এ একই counting rule ব্যবহার করা হচ্ছে।',
        pendingHelp: 'নতুন অর্ডার, এখনো প্রসেস শুরু হয়নি।',
        processingHelp: 'অর্ডার কনফার্ম বা প্রসেসিংয়ে আছে।',
        packagingHelp: 'পণ্য প্যাক বা ready-for-pickup ধাপে আছে।',
        readyHelp: 'কুরিয়ারে দেওয়ার জন্য প্রস্তুত।',
        inCourierHelp: 'কুরিয়ার/শিপড/ট্রানজিট/আউট ফর ডেলিভারি।',
        deliveredHelp: 'সফলভাবে ডেলিভারি সম্পন্ন হয়েছে।',
        cancelledHelp: 'ম্যানুয়ালি বাতিল করা অর্ডার।',
        failedHelp: 'ফেল/রিটার্ন/রিফান্ড হওয়া অর্ডার।',
        audit: 'Address mapping audit',
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
        statusLegend: 'Status legend',
        statusLegendHint: 'The same counting rules are used in the district popup and sync panel.',
        pendingHelp: 'New orders waiting for confirmation or payment follow-up.',
        processingHelp: 'Confirmed or actively being processed by the team.',
        packagingHelp: 'Packed or staged for pickup before handoff.',
        readyHelp: 'Ready to be handed to courier.',
        inCourierHelp: 'Sent to courier, shipped, in transit, or out for delivery.',
        deliveredHelp: 'Successfully delivered/completed orders.',
        cancelledHelp: 'Orders cancelled before completion.',
        failedHelp: 'Failed delivery, returned, or refunded orders.',
        audit: 'Address mapping audit',
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

                <Button type="button" variant="outline" size="sm" className="mb-3 w-full justify-start gap-2" onClick={() => setAuditOpen(true)}>
                  <ShieldAlert className="h-4 w-4" />
                  {labels.audit}
                </Button>

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

                <div className="border-t border-border p-3">
                  <MapStatusLegend labels={labels} stats={selectedStats || undefined} />
                </div>

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

      <AddressMappingAuditDialog
        open={auditOpen}
        onOpenChange={setAuditOpen}
        rows={auditRows}
        language={language}
        savingOrderId={savingAuditOrderId}
        onSaveFix={handleAuditSave}
      />
    </AdminLayout>
  );
};

export default AdminMapsOrderData;