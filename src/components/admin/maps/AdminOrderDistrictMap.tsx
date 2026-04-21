import { useEffect, useMemo, useRef, useState } from 'react';
import L, { type GeoJSON as LeafletGeoJSON, type Layer, type Map as LeafletMap } from 'leaflet';
import { Loader2 } from 'lucide-react';
import { BD_DISTRICT_COORDS, BD_DISTRICT_LIST, normalizeDistrict } from '@/data/bdDistrictCoords';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: any[];
}

export interface DistrictStats {
  total: number;
  readyToShip: number;
  delivered: number;
  cancelled: number;
  failed: number;
  pending: number;
  processing: number;
  inCourier: number;
  packaging: number;
}

interface AdminOrderDistrictMapProps {
  geojson: GeoJsonFeatureCollection | null;
  geojsonError: string | null;
  language: string;
  labels: {
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
  };
  selectedDistrict: string | null;
  statsByDistrict: Record<string, DistrictStats>;
  onSelectDistrict: (district: string) => void;
}

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

const resolveColorToken = (tokenName: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
  return value ? `hsl(${value})` : fallback;
};

const getFeatureDistrictKey = (feature: any) => {
  const props = feature?.properties || {};
  const featureName: string = props.NAME_2 || props.NAME_3 || props.name || props.District || props.district || props.DIST_NAME || '';
  return normalizeDistrict(featureName);
};

const getPopupHtml = (
  district: string,
  language: string,
  labels: AdminOrderDistrictMapProps['labels'],
  stats: DistrictStats,
) => {
  const districtLabel = language === 'bn'
    ? (BD_DISTRICT_COORDS[district]?.nameBn || district)
    : district;

  return `
    <div style="min-width:180px">
      <div style="font-weight:700;font-size:14px;margin-bottom:6px;">${districtLabel} District, Bangladesh</div>
      <div style="font-size:12px;line-height:1.5;">
        <div><strong>${labels.total}:</strong> ${stats.total} pcs</div>
        <div><strong>${labels.pending}:</strong> ${stats.pending} pcs</div>
        <div><strong>${labels.processing}:</strong> ${stats.processing} pcs</div>
        <div><strong>${labels.packaging}:</strong> ${stats.packaging} pcs</div>
        <div><strong>${labels.inCourier}:</strong> ${stats.inCourier} pcs</div>
        <div><strong>${labels.ready}:</strong> ${stats.readyToShip} pcs</div>
        <div><strong>${labels.delivered}:</strong> ${stats.delivered} pcs</div>
        <div><strong>${labels.cancelled}:</strong> ${stats.cancelled} pcs</div>
        <div><strong>${labels.failed}:</strong> ${stats.failed} pcs</div>
      </div>
    </div>
  `;
};

const getPolygonStyle = (
  district: string | null,
  selectedDistrict: string | null,
  statsByDistrict: Record<string, DistrictStats>,
  maxTotal: number,
) => {
  const primary = resolveColorToken('--primary', 'hsl(24 95% 53%)');
  const border = resolveColorToken('--border', 'hsl(214 32% 91%)');
  const muted = resolveColorToken('--muted', 'hsl(210 40% 96%)');
  const stats = district ? statsByDistrict[district] || EMPTY_STATS : EMPTY_STATS;
  const isSelected = district && selectedDistrict === district;
  const density = maxTotal > 0 ? Math.min(stats.total / maxTotal, 1) : 0;

  return {
    color: isSelected ? primary : border,
    weight: isSelected ? 2.6 : 1,
    fillColor: stats.total > 0 || isSelected ? primary : muted,
    fillOpacity: isSelected ? 0.56 : stats.total > 0 ? 0.12 + density * 0.3 : 0.06,
  };
};

export const AdminOrderDistrictMap = ({
  geojson,
  geojsonError,
  language,
  labels,
  selectedDistrict,
  statsByDistrict,
  onSelectDistrict,
}: AdminOrderDistrictMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const geoJsonLayerRef = useRef<LeafletGeoJSON | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const fallbackLayerRef = useRef<L.LayerGroup | null>(null);
  const districtLayersRef = useRef<Record<string, Layer>>({});
  const hasFittedBoundsRef = useRef(false);
  const [mapMounted, setMapMounted] = useState(false);

  const maxTotal = useMemo(
    () => Math.max(0, ...Object.values(statsByDistrict).map((stats) => stats.total)),
    [statsByDistrict],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      preferCanvas: true,
    }).setView([23.685, 90.3563], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;
    setMapMounted(true);

    const invalidateA = window.setTimeout(() => map.invalidateSize(), 120);
    const invalidateB = window.setTimeout(() => map.invalidateSize(), 480);

    return () => {
      window.clearTimeout(invalidateA);
      window.clearTimeout(invalidateB);
      markerRef.current?.remove();
      geoJsonLayerRef.current?.remove();
      fallbackLayerRef.current?.remove();
      districtLayersRef.current = {};
      hasFittedBoundsRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    geoJsonLayerRef.current?.remove();
    fallbackLayerRef.current?.remove();
    districtLayersRef.current = {};

    if (geojson?.features?.length) {
      const layer = L.geoJSON(geojson as any, {
        style: (feature) => getPolygonStyle(getFeatureDistrictKey(feature), selectedDistrict, statsByDistrict, maxTotal),
        onEachFeature: (feature, featureLayer) => {
          const district = getFeatureDistrictKey(feature);
          if (!district) return;

          districtLayersRef.current[district] = featureLayer;

          featureLayer.on({
            click: () => onSelectDistrict(district),
            mouseover: () => {
              const path = featureLayer as L.Path;
              path.setStyle({
                weight: selectedDistrict === district ? 2.6 : 1.8,
                fillOpacity: selectedDistrict === district ? 0.56 : 0.28,
              });
            },
            mouseout: () => {
              const path = featureLayer as L.Path;
              path.setStyle(getPolygonStyle(district, selectedDistrict, statsByDistrict, maxTotal));
            },
          });
        },
      });

      layer.addTo(map);
      geoJsonLayerRef.current = layer;

      if (!selectedDistrict && !hasFittedBoundsRef.current) {
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
          hasFittedBoundsRef.current = true;
        }
      }

      return;
    }

    const primary = resolveColorToken('--primary', 'hsl(24 95% 53%)');
    const border = resolveColorToken('--border', 'hsl(214 32% 91%)');
    const muted = resolveColorToken('--muted', 'hsl(210 40% 96%)');
    const fallbackLayer = L.layerGroup();

    BD_DISTRICT_LIST.forEach((district) => {
      const stats = statsByDistrict[district.name] || EMPTY_STATS;
      const isSelected = selectedDistrict === district.name;
      const density = maxTotal > 0 ? Math.min(stats.total / maxTotal, 1) : 0;

      const marker = L.circleMarker([district.lat, district.lng], {
        radius: isSelected ? 12 : 7 + density * 10,
        color: isSelected ? primary : border,
        weight: isSelected ? 2.4 : 1.2,
        fillColor: stats.total > 0 || isSelected ? primary : muted,
        fillOpacity: isSelected ? 0.75 : stats.total > 0 ? 0.2 + density * 0.35 : 0.1,
      });

      marker.bindTooltip(`${language === 'bn' ? district.nameBn : district.name} (${stats.total})`, {
        direction: 'top',
      });
      marker.on('click', () => onSelectDistrict(district.name));
      fallbackLayer.addLayer(marker);
      districtLayersRef.current[district.name] = marker;
    });

    fallbackLayer.addTo(map);
    fallbackLayerRef.current = fallbackLayer;
  }, [geojson, language, maxTotal, onSelectDistrict, selectedDistrict, statsByDistrict]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerRef.current?.remove();

    if (!selectedDistrict) {
      return;
    }

    const coords = BD_DISTRICT_COORDS[selectedDistrict];
    if (!coords) return;

    const stats = statsByDistrict[selectedDistrict] || EMPTY_STATS;
    const selectedLayer = districtLayersRef.current[selectedDistrict] as any;

    if (selectedLayer?.getBounds) {
      const bounds = selectedLayer.getBounds();
      if (bounds?.isValid?.()) {
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 9 });
      }
    } else {
      map.flyTo([coords.lat, coords.lng], 9, { duration: 1.1 });
    }

    const marker = L.marker([coords.lat, coords.lng]);
    marker.addTo(map);
    marker.bindPopup(getPopupHtml(selectedDistrict, language, labels, stats), {
      autoPan: true,
      closeButton: true,
    });
    marker.openPopup();
    markerRef.current = marker;
  }, [labels, language, selectedDistrict, statsByDistrict]);

  return (
    <div className="relative h-[600px] w-full overflow-hidden bg-muted/20">
      <div ref={containerRef} className="h-full w-full" />

      {!mapMounted && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>{labels.mapLoading}</span>
          </div>
        </div>
      )}

      {geojsonError && (
        <div className="pointer-events-none absolute bottom-3 right-3 max-w-xs rounded-md border border-border bg-background/95 px-3 py-2 text-xs text-muted-foreground shadow-sm">
          {labels.mapFallback}
        </div>
      )}
    </div>
  );
};