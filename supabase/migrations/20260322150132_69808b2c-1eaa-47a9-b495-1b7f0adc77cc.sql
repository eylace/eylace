CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON public.return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON public.return_requests(status);
CREATE INDEX IF NOT EXISTS idx_return_requests_user_id ON public.return_requests(user_id);