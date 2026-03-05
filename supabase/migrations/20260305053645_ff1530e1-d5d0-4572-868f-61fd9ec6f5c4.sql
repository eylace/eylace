
INSERT INTO public.user_roles (user_id, role) 
VALUES ('9ae90fce-b7cc-40b5-96d4-e0ce51316d37', 'admin') 
ON CONFLICT (user_id, role) DO NOTHING;
