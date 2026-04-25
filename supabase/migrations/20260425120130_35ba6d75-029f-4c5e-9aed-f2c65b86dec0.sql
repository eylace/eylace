-- Helper timestamp function (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE DEFAULT ('TKT-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')),
  customer_id UUID,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_avatar TEXT,
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting_customer','resolved','closed')),
  assigned_to UUID,
  order_id UUID,
  tags TEXT[] DEFAULT '{}',
  last_message_at TIMESTAMPTZ DEFAULT now(),
  last_message_preview TEXT,
  unread_admin_count INT DEFAULT 0,
  unread_customer_count INT DEFAULT 0,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer ON public.support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_last_msg ON public.support_tickets(last_message_at DESC);

-- Messages
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer','admin','manager','system')),
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_internal_note BOOLEAN DEFAULT false,
  read_by_customer BOOLEAN DEFAULT false,
  read_by_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON public.support_messages(ticket_id, created_at);

-- Managers
CREATE TABLE IF NOT EXISTS public.support_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'support_agent' CHECK (role IN ('support_agent','support_lead','support_manager')),
  is_active BOOLEAN DEFAULT true,
  max_concurrent_tickets INT DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_managers_user ON public.support_managers(user_id);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_managers ENABLE ROW LEVEL SECURITY;

-- Helper
CREATE OR REPLACE FUNCTION public.is_support_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','super_admin')
  ) OR EXISTS (
    SELECT 1 FROM public.support_managers WHERE user_id = _user_id AND is_active = true
  );
$$;

-- Policies
DROP POLICY IF EXISTS "tickets_select" ON public.support_tickets;
CREATE POLICY "tickets_select" ON public.support_tickets
  FOR SELECT USING (auth.uid() = customer_id OR public.is_support_staff(auth.uid()));

DROP POLICY IF EXISTS "tickets_insert" ON public.support_tickets;
CREATE POLICY "tickets_insert" ON public.support_tickets
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "tickets_update" ON public.support_tickets;
CREATE POLICY "tickets_update" ON public.support_tickets
  FOR UPDATE USING (public.is_support_staff(auth.uid()));

DROP POLICY IF EXISTS "tickets_delete" ON public.support_tickets;
CREATE POLICY "tickets_delete" ON public.support_tickets
  FOR DELETE USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "messages_select" ON public.support_messages;
CREATE POLICY "messages_select" ON public.support_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
        AND (t.customer_id = auth.uid() OR public.is_support_staff(auth.uid()))
        AND (NOT is_internal_note OR public.is_support_staff(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "messages_insert" ON public.support_messages;
CREATE POLICY "messages_insert" ON public.support_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id
        AND (t.customer_id = auth.uid() OR public.is_support_staff(auth.uid()) OR t.customer_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "messages_update" ON public.support_messages;
CREATE POLICY "messages_update" ON public.support_messages
  FOR UPDATE USING (public.is_support_staff(auth.uid()));

DROP POLICY IF EXISTS "managers_all" ON public.support_managers;
CREATE POLICY "managers_all" ON public.support_managers
  FOR ALL USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "managers_view" ON public.support_managers;
CREATE POLICY "managers_view" ON public.support_managers
  FOR SELECT USING (public.is_support_staff(auth.uid()));

-- Triggers
DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_support_managers_updated_at ON public.support_managers;
CREATE TRIGGER trg_support_managers_updated_at
  BEFORE UPDATE ON public.support_managers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE OR REPLACE FUNCTION public.support_message_after_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.support_tickets
  SET last_message_at = NEW.created_at,
      last_message_preview = LEFT(NEW.message, 200),
      unread_admin_count = CASE WHEN NEW.sender_type = 'customer' THEN unread_admin_count + 1 ELSE unread_admin_count END,
      unread_customer_count = CASE WHEN NEW.sender_type IN ('admin','manager') AND NOT NEW.is_internal_note THEN unread_customer_count + 1 ELSE unread_customer_count END,
      status = CASE
                 WHEN status = 'open' AND NEW.sender_type IN ('admin','manager') THEN 'in_progress'
                 WHEN status = 'waiting_customer' AND NEW.sender_type = 'customer' THEN 'in_progress'
                 ELSE status
               END,
      updated_at = now()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_message_after_insert ON public.support_messages;
CREATE TRIGGER trg_support_message_after_insert
  AFTER INSERT ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.support_message_after_insert();

-- Realtime
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Seed demo tickets
INSERT INTO public.support_tickets (customer_name, customer_email, subject, description, priority, status, last_message_preview)
SELECT * FROM (VALUES
  ('Cameron Williamson','cameron@example.com','Hey, How are you?','Need help with my recent order delivery status','high','open','Hey, How are you?'),
  ('Esther Howard','esther@example.com','Thanks for reply','Refund request follow-up','medium','in_progress','Thanks for reply'),
  ('Jane Cooper','jane@example.com','Hey, Whats up?','Product return question','low','open','Hey, Whats up?'),
  ('Ronald Richards','ronald@example.com','Im ready','Ready to confirm my order','medium','waiting_customer','Im ready'),
  ('Darlene Robertson','darlene@example.com','Hey, How are you?','General inquiry about shipping','low','open','Hey, How are you?'),
  ('Darrell Steward','darrell@example.com','Whats going on?','Asking about discount codes','high','in_progress','Whats going on?')
) AS v(customer_name, customer_email, subject, description, priority, status, last_message_preview)
WHERE NOT EXISTS (SELECT 1 FROM public.support_tickets LIMIT 1);

-- Seed initial messages for first ticket
DO $$
DECLARE first_ticket UUID;
BEGIN
  SELECT id INTO first_ticket FROM public.support_tickets ORDER BY created_at LIMIT 1;
  IF first_ticket IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.support_messages WHERE ticket_id = first_ticket) THEN
    INSERT INTO public.support_messages (ticket_id, sender_type, sender_name, message) VALUES
      (first_ticket, 'customer', 'Cameron Williamson', 'Hi, I want a clean and modern look with a focus on user experience.'),
      (first_ticket, 'admin', 'Support Team', 'Absolutely! I''d be happy to assist you.'),
      (first_ticket, 'admin', 'Support Team', 'What kind of design aesthetic are you aiming for?'),
      (first_ticket, 'customer', 'Cameron Williamson', 'I''m thinking of using a combination of blues and grays.'),
      (first_ticket, 'admin', 'Support Team', 'Great! Do you have any specific color schemes in mind?');
  END IF;
END $$;