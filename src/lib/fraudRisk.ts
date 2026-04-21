import { supabase } from '@/integrations/supabase/client';

export interface FraudResult {
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  total: number;
  success: number;
  failed: number;
  pending: number;
  breakdown: {
    delivered: number;
    completed: number;
    fulfilled: number;
    cancelled: number;
    failed: number;
    refunded: number;
    pending: number;
    processing: number;
    sent_to_courier: number;
    shipped: number;
    courier_history: Array<{ name: string; parcels: number; success: number; failed: number; rate: number }>;
    formula: string;
    computed_at: string;
  };
}

export const SUCCESS_STATUSES = new Set(['delivered', 'completed', 'fulfilled']);
export const FAILED_STATUSES = new Set(['cancelled', 'failed', 'refunded']);

export const normalizePhone = (raw: string | undefined | null): string => {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  // Strip leading country code 880 / 88 if present, keep last 10-11 digits
  if (digits.length > 11 && digits.startsWith('880')) return digits.slice(3);
  if (digits.length > 11 && digits.startsWith('88')) return digits.slice(2);
  return digits;
};

export const computeFraudFromHistory = (history: any[]): FraudResult => {
  const counts = {
    delivered: 0, completed: 0, fulfilled: 0,
    cancelled: 0, failed: 0, refunded: 0,
    pending: 0, processing: 0, sent_to_courier: 0, shipped: 0,
  };
  history.forEach((o: any) => {
    const s = (o?.status || 'pending').toLowerCase();
    if (s in counts) (counts as any)[s] += 1;
  });

  const success = counts.delivered + counts.completed + counts.fulfilled;
  const failed = counts.cancelled + counts.failed + counts.refunded;
  const pending = counts.pending + counts.processing + counts.sent_to_courier + counts.shipped;
  const total = history.length;
  const completed = success + failed;

  let risk_score: number;
  let formula: string;
  if (completed > 0) {
    risk_score = Math.round((failed / completed) * 100);
    formula = `Failed (${failed}) / Completed (${completed}) × 100 = ${risk_score}%`;
  } else if (total === 0) {
    risk_score = 25;
    formula = 'No order history → baseline 25% (unknown customer)';
  } else {
    risk_score = 15;
    formula = `Only pending orders (${pending}) → baseline 15%`;
  }
  if (failed >= 3) {
    risk_score = Math.min(100, risk_score + 10);
    formula += ` + 10% penalty (${failed} failed orders)`;
  }
  risk_score = Math.max(0, Math.min(100, risk_score));

  const risk_level: FraudResult['risk_level'] =
    risk_score >= 75 ? 'critical' :
    risk_score >= 50 ? 'high' :
    risk_score >= 25 ? 'medium' : 'low';

  // Real courier breakdown from history
  const courierMap = new Map<string, { parcels: number; success: number; failed: number }>();
  history.forEach((o: any) => {
    if (!o?.carrier) return;
    const key = String(o.carrier);
    const cur = courierMap.get(key) || { parcels: 0, success: 0, failed: 0 };
    cur.parcels += 1;
    if (SUCCESS_STATUSES.has(o.status)) cur.success += 1;
    if (FAILED_STATUSES.has(o.status)) cur.failed += 1;
    courierMap.set(key, cur);
  });
  const courier_history = Array.from(courierMap.entries()).map(([name, v]) => {
    const closed = v.success + v.failed;
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      parcels: v.parcels,
      success: v.success,
      failed: v.failed,
      rate: closed > 0 ? Math.round((v.success / closed) * 100) : 0,
    };
  });

  return {
    risk_score,
    risk_level,
    total,
    success,
    failed,
    pending,
    breakdown: {
      ...counts,
      courier_history,
      formula,
      computed_at: new Date().toISOString(),
    },
  };
};

export const persistFraudCache = async (phone: string, result: FraudResult) => {
  const phone_normalized = normalizePhone(phone);
  if (!phone_normalized) return;
  await (supabase as any).from('fraud_risk_cache').upsert({
    phone_normalized,
    risk_score: result.risk_score,
    risk_level: result.risk_level,
    total_orders: result.total,
    success_orders: result.success,
    failed_orders: result.failed,
    pending_orders: result.pending,
    breakdown: result.breakdown,
    computed_at: new Date().toISOString(),
  }, { onConflict: 'phone_normalized' });
};

export const loadFraudCache = async (phones: string[]): Promise<Record<string, FraudResult>> => {
  const normalized = Array.from(new Set(phones.map(normalizePhone).filter(Boolean)));
  if (normalized.length === 0) return {};
  const { data } = await (supabase as any)
    .from('fraud_risk_cache')
    .select('*')
    .in('phone_normalized', normalized);
  const map: Record<string, FraudResult> = {};
  (data || []).forEach((row: any) => {
    map[row.phone_normalized] = {
      risk_score: row.risk_score,
      risk_level: row.risk_level,
      total: row.total_orders,
      success: row.success_orders,
      failed: row.failed_orders,
      pending: row.pending_orders,
      breakdown: row.breakdown || {},
    };
  });
  return map;
};