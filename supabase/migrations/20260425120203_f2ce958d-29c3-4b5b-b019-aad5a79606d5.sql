-- Fix function search path
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Tighten ticket insert: require a non-empty customer email and customer_id matches auth user when authenticated
DROP POLICY IF EXISTS "tickets_insert" ON public.support_tickets;
CREATE POLICY "tickets_insert" ON public.support_tickets
  FOR INSERT WITH CHECK (
    customer_email IS NOT NULL
    AND length(trim(customer_email)) > 0
    AND (customer_id IS NULL OR customer_id = auth.uid() OR public.is_support_staff(auth.uid()))
  );

-- Tighten message insert: ensure sender_type matches sender role
DROP POLICY IF EXISTS "messages_insert" ON public.support_messages;
CREATE POLICY "messages_insert" ON public.support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
        AND (
          (sender_type = 'customer' AND (t.customer_id = auth.uid() OR t.customer_id IS NULL))
          OR (sender_type IN ('admin','manager','system') AND public.is_support_staff(auth.uid()))
        )
    )
  );