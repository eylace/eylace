
-- ─── courier_dispatch_log ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courier_dispatch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  order_number TEXT,
  provider TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'create_order',
  idempotency_key TEXT NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  http_status INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  tracking_number TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courier_dispatch_log_order ON public.courier_dispatch_log(order_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_courier_dispatch_idempotency
  ON public.courier_dispatch_log(order_id, provider, idempotency_key)
  WHERE success = true;

ALTER TABLE public.courier_dispatch_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view dispatch logs"
  ON public.courier_dispatch_log FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'order_manager'::app_role)
    OR public.has_role(auth.uid(), 'support_manager'::app_role)
  );

-- ─── courier_status_mapping ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courier_status_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  courier_status TEXT NOT NULL,
  internal_status TEXT NOT NULL,
  timeline_description TEXT,
  is_terminal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_courier_status_mapping
  ON public.courier_status_mapping(provider, lower(courier_status));

ALTER TABLE public.courier_status_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view courier status mappings"
  ON public.courier_status_mapping FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'order_manager'::app_role)
    OR public.has_role(auth.uid(), 'support_manager'::app_role)
  );

CREATE POLICY "Admins manage courier status mappings"
  ON public.courier_status_mapping FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_courier_status_mapping_updated
  BEFORE UPDATE ON public.courier_status_mapping
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed common mappings
INSERT INTO public.courier_status_mapping (provider, courier_status, internal_status, timeline_description, is_terminal) VALUES
  ('pathao', 'Pickup_Requested',     'sent_to_courier', 'Pickup requested from Pathao',           false),
  ('pathao', 'Assigned_for_Pickup',  'sent_to_courier', 'Rider assigned for pickup',              false),
  ('pathao', 'Picked',               'shipped',         'Parcel picked up by courier',            false),
  ('pathao', 'Pickup_Cancelled',     'cancelled',       'Pickup cancelled by courier',            true),
  ('pathao', 'In_Transit',           'shipped',         'Parcel in transit',                      false),
  ('pathao', 'Received_at_Last_Mile_Hub', 'shipped',    'Arrived at last-mile hub',               false),
  ('pathao', 'Assigned_for_Delivery','out_for_delivery','Out for delivery',                       false),
  ('pathao', 'Delivered',            'delivered',       'Parcel delivered',                       true),
  ('pathao', 'Partial_Delivery',     'delivered',       'Partially delivered',                    true),
  ('pathao', 'Returned',             'returned',        'Parcel returned to merchant',            true),
  ('pathao', 'Return',               'returned',        'Parcel returned to merchant',            true),
  ('pathao', 'Hold',                 'on_hold',         'Parcel on hold',                         false),
  ('steadfast', 'pending',           'sent_to_courier', 'Awaiting pickup',                        false),
  ('steadfast', 'in_review',         'sent_to_courier', 'Order in review',                        false),
  ('steadfast', 'on_hold',           'on_hold',         'Order on hold',                          false),
  ('steadfast', 'delivered_approval_pending', 'delivered', 'Delivered, approval pending',         false),
  ('steadfast', 'partial_delivered_approval_pending', 'delivered', 'Partial delivery pending approval', false),
  ('steadfast', 'cancelled_approval_pending','cancelled','Cancellation pending',                  false),
  ('steadfast', 'unknown_approval_pending',  'sent_to_courier', 'Status pending',                 false),
  ('steadfast', 'delivered',         'delivered',       'Parcel delivered',                       true),
  ('steadfast', 'partial_delivered', 'delivered',       'Partially delivered',                    true),
  ('steadfast', 'cancelled',         'cancelled',       'Parcel cancelled',                       true),
  ('steadfast', 'in_transit',        'shipped',         'Parcel in transit',                      false),
  ('steadfast', 'pickup',            'shipped',         'Parcel picked up',                       false),
  ('steadfast', 'returned',          'returned',        'Parcel returned',                        true),
  ('shiprocket', 'NEW',              'sent_to_courier', 'Order created at Shiprocket',            false),
  ('shiprocket', 'AWB ASSIGNED',     'sent_to_courier', 'AWB assigned',                           false),
  ('shiprocket', 'PICKUP SCHEDULED', 'sent_to_courier', 'Pickup scheduled',                       false),
  ('shiprocket', 'PICKED UP',        'shipped',         'Parcel picked up',                       false),
  ('shiprocket', 'IN TRANSIT',       'shipped',         'In transit',                             false),
  ('shiprocket', 'OUT FOR DELIVERY', 'out_for_delivery','Out for delivery',                       false),
  ('shiprocket', 'DELIVERED',        'delivered',       'Parcel delivered',                       true),
  ('shiprocket', 'RTO INITIATED',    'returned',        'Return to origin initiated',             false),
  ('shiprocket', 'RTO DELIVERED',    'returned',        'Returned to merchant',                   true),
  ('shiprocket', 'CANCELED',         'cancelled',       'Order cancelled',                        true),
  ('shiprocket', 'CANCELLED',        'cancelled',       'Order cancelled',                        true)
ON CONFLICT DO NOTHING;

-- ─── helper RPC: append timeline + update order ──────────────────────
CREATE OR REPLACE FUNCTION public.mark_courier_dispatch_succeeded(
  _order_id UUID,
  _provider TEXT,
  _tracking_number TEXT,
  _description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'order_manager'::app_role)
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  UPDATE public.orders
  SET carrier = _provider,
      tracking_number = COALESCE(NULLIF(_tracking_number, ''), tracking_number),
      status = CASE WHEN status IN ('pending','processing') THEN 'sent_to_courier' ELSE status END,
      updated_at = now()
  WHERE id = _order_id;

  INSERT INTO public.order_tracking_events (order_id, status, location, description, created_at)
  VALUES (
    _order_id,
    'sent_to_courier',
    _provider,
    COALESCE(_description, 'Order dispatched to ' || _provider || COALESCE(' (tracking: ' || _tracking_number || ')', '')),
    now()
  );
END;
$$;
