import { Component, type ErrorInfo, type ReactNode, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { BD_DISTRICT_COORDS, BD_DISTRICT_LIST, normalizeDistrict } from '@/data/bdDistrictCoords';
import { Loader2, MapPin, Search } from 'lucide-react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BD_GEOJSON_SOURCES = [
  'https://raw.githubusercontent.com/ifahimreza/bangladesh-geojson/master/bangladesh.geojson',
];

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: any[];
}

interface DistrictStats {
  total: number;
  readyToShip: number;
  delivered: number;
  cancelled: number;
  failed: number;
}

const isFeatureCollection = (value: unknown): value is GeoJsonFeatureCollection => {
  return !!value && typeof value === 'object' && (value as GeoJsonFeatureCollection).type === 'FeatureCollection' && Array.isArray((value as GeoJsonFeatureCollection).features);
};

const getFeatureDistrictKey = (feature: any) => {
  const props = feature?.properties || {};
  const featureName: string = props.NAME_2 || props.NAME_3 || props.name || props.District || props.district || props.DIST_NAME || '';
  return normalizeDistrict(featureName);
};

class MapErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AdminMapsOrderData map render failed:', error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function FlyTo({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 9, { duration: 1.2 });
  }, [coords, map]);
  return null;
}

function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    const t3 = setTimeout(() => map.invalidateSize(), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [map]);
  return null;
}

const AdminMapsOrderData = () => {
  const { language } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [geojson, setGeojson] = useState<any>(null);
  const [geojsonError, setGeojsonError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Fetch orders
  useEffect(() => {
    setMapReady(true);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.functions.invoke('admin-get-orders');
        setOrders(data?.orders || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch GeoJSON boundaries
  useEffect(() => {
      let mounted = true;

    void (async () => {
      try {
        for (const url of BD_GEOJSON_SOURCES) {
          const res = await fetch(url);
          if (!res.ok) continue;
          const json = await res.json();
          if (mounted && isFeatureCollection(json)) {
            setGeojson(json);
            setGeojsonError(null);
            return;
          }
        }
        if (mounted) setGeojsonError('District boundary data is unavailable right now.');
      } catch {
        if (mounted) setGeojsonError('Failed to load district boundary data.');
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Compute stats per district
  const statsByDistrict = useMemo(() => {
    const map: Record<string, DistrictStats> = {};
    for (const o of orders) {
      const addr = o.shipping_address || {};
      const candidate = addr.state || addr.city || addr.district || '';
      const key = normalizeDistrict(candidate);
      if (!key) continue;
      if (!map[key]) map[key] = { total: 0, readyToShip: 0, delivered: 0, cancelled: 0, failed: 0 };
      map[key].total += 1;
      const s = (o.status || '').toLowerCase();
      if (s === 'processing' || s === 'confirmed' || s === 'pending') map[key].readyToShip += 1;
      else if (s === 'delivered') map[key].delivered += 1;
      else if (s === 'cancelled' || s === 'canceled') map[key].cancelled += 1;
      else if (s === 'failed' || s === 'returned') map[key].failed += 1;
    }
    return map;
  }, [orders]);

  const filteredDistricts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return BD_DISTRICT_LIST;
    return BD_DISTRICT_LIST.filter(d =>
      d.name.toLowerCase().includes(q) || d.nameBn.includes(search)
    );
  }, [search]);

  const selectedCoords: [number, number] | null = selectedDistrict && BD_DISTRICT_COORDS[selectedDistrict]
    ? [BD_DISTRICT_COORDS[selectedDistrict].lat, BD_DISTRICT_COORDS[selectedDistrict].lng]
    : null;

  const selectedStats = selectedDistrict ? (statsByDistrict[selectedDistrict] || { total: 0, readyToShip: 0, delivered: 0, cancelled: 0, failed: 0 }) : null;

  // GeoJSON style — highlight selected district orange
  const geoJsonStyle = (feature: any) => {
    const isSelected = selectedDistrict && getFeatureDistrictKey(feature) === selectedDistrict;
    return {
      color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))',
      weight: isSelected ? 2.5 : 0.6,
      fillColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
      fillOpacity: isSelected ? 0.45 : 0.05,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const key = getFeatureDistrictKey(feature);
    if (!key) return;
    layer.on({
      click: () => setSelectedDistrict(key),
      mouseover: (e) => {
        const l = e.target as L.Path;
        l.setStyle({ weight: 2, fillOpacity: 0.25 });
      },
      mouseout: (e) => {
        const l = e.target as L.Path;
        const isSel = selectedDistrict === key;
        l.setStyle({
          weight: isSel ? 2.5 : 0.6,
          fillOpacity: isSel ? 0.45 : 0.05,
        });
      },
    });
  };

  const labels = language === 'bn'
    ? { title: 'ম্যাপস অর্ডার ডেটা', desc: 'জেলা অনুযায়ী অর্ডার পরিসংখ্যান', search: 'জেলা খুঁজুন...', total: 'মোট', ready: 'শিপ করার জন্য প্রস্তুত', delivered: 'ডেলিভারি হয়েছে', cancelled: 'বাতিল', failed: 'ব্যর্থ', loading: 'লোড হচ্ছে...', clickHint: 'একটি জেলা নির্বাচন করুন' }
    : { title: 'Maps Order Data', desc: 'District-wise order statistics', search: 'Search district...', total: 'Total', ready: 'Ready to Ship', delivered: 'Delivered', cancelled: 'Cancelled', failed: 'Failed', loading: 'Loading...', clickHint: 'Select a district' };

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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: District list */}
            <Card className="lg:col-span-4 border border-border">
              <CardContent className="p-3">
                <div className="relative mb-3">
                  <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={labels.search}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
                <div className="max-h-[560px] overflow-y-auto divide-y divide-border">
                  {filteredDistricts.map((d) => {
                    const stats = statsByDistrict[d.name];
                    const count = stats?.total || 0;
                    const active = selectedDistrict === d.name;
                    return (
                      <button
                        key={d.name}
                        onClick={() => setSelectedDistrict(d.name)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/50 transition-colors ${active ? 'bg-primary/10' : ''}`}
                      >
                        <span className={`text-sm ${active ? 'text-primary font-semibold' : 'text-foreground'}`}>
                          {language === 'bn' ? d.nameBn : d.name}
                        </span>
                        <span className={`text-xs font-semibold ${count > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                          ({count})
                        </span>
                      </button>
                    );
                  })}
                  {filteredDistricts.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground">No districts found</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right: Map */}
            <Card className="lg:col-span-8 border border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="h-[600px] w-full bg-muted/20">
                  {mapReady ? (
                    <MapErrorBoundary
                      fallback={
                        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                          <p className="text-sm font-medium text-foreground">Map preview is temporarily unavailable.</p>
                          <p className="text-xs text-muted-foreground">District list and order totals are still available on the left.</p>
                        </div>
                      }
                    >
                      <MapContainer
                        center={[23.685, 90.3563]}
                        zoom={7}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom
                      >
                        <InvalidateOnMount />
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {geojson && (
                          <GeoJSON
                            key={selectedDistrict || 'none'}
                            data={geojson}
                            style={geoJsonStyle as any}
                            onEachFeature={onEachFeature}
                          />
                        )}
                        {selectedDistrict && selectedCoords && selectedStats && (
                          <Marker position={selectedCoords}>
                            <Popup>
                              <div className="min-w-[180px]">
                                <div className="font-bold text-sm mb-1.5 text-foreground">
                                  {(language === 'bn' ? BD_DISTRICT_COORDS[selectedDistrict].nameBn : selectedDistrict)} District, Bangladesh
                                </div>
                                <div className="space-y-0.5 text-xs">
                                  <div><strong>{labels.total}:</strong> {selectedStats.total} pcs</div>
                                  <div><strong>{labels.ready}:</strong> {selectedStats.readyToShip} pcs</div>
                                  <div><strong>{labels.delivered}:</strong> {selectedStats.delivered} pcs</div>
                                  <div><strong>{labels.cancelled}:</strong> {selectedStats.cancelled} pcs</div>
                                  <div><strong>{labels.failed}:</strong> {selectedStats.failed} pcs</div>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        )}
                        <FlyTo coords={selectedCoords} />
                      </MapContainer>
                    </MapErrorBoundary>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                {geojsonError && (
                  <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                    {geojsonError}
                  </div>
                )}
                {!selectedDistrict && (
                  <div className="p-3 text-center text-xs text-muted-foreground border-t border-border">
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