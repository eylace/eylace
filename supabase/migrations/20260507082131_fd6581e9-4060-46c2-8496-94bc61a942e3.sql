
REVOKE ALL ON FUNCTION public.record_courier_advance_event(text,text,text,text,numeric,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_courier_advance_payment(uuid,uuid,text,text,numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.compute_courier_advance_amount(text,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.compute_courier_advance_amount(text,numeric) TO authenticated;
