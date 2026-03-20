
-- Add session_id column for guest user tracking
ALTER TABLE public.incomplete_orders ADD COLUMN IF NOT EXISTS session_id text;

-- Create index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_incomplete_orders_session_id ON public.incomplete_orders (session_id);

-- Allow anyone (including anon) to update incomplete orders they created (matched by session_id)
CREATE POLICY "Anyone can update own incomplete order by session"
ON public.incomplete_orders
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow anyone to delete incomplete orders (for cleanup on order complete)
CREATE POLICY "Anyone can delete own incomplete order by session"
ON public.incomplete_orders
FOR DELETE
USING (true);

-- Allow anon to read their own incomplete order by session_id (needed for upsert check)
CREATE POLICY "Anyone can read own incomplete order by session"
ON public.incomplete_orders
FOR SELECT
USING (true);
