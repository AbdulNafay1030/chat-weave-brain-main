-- Create the sequence fresh, starting at 1
CREATE SEQUENCE IF NOT EXISTS public.waitlist_join_number_seq START 1;

-- Bring the sequence current (only if there's existing data)
DO $$
DECLARE
  max_num integer;
BEGIN
  SELECT MAX(join_number) INTO max_num FROM public.waitlist;
  IF max_num IS NOT NULL AND max_num >= 1 THEN
    PERFORM setval('public.waitlist_join_number_seq', max_num, true);
  END IF;
END
$$;

-- Use the sequence as default
ALTER TABLE public.waitlist
  ALTER COLUMN join_number SET DEFAULT nextval('public.waitlist_join_number_seq');

-- Remove old trigger-based approach if present
DROP TRIGGER IF EXISTS set_waitlist_join_number_trigger ON public.waitlist;
DROP FUNCTION IF EXISTS public.set_waitlist_join_number();

-- Public RPC to join waitlist (keeps table private; works without login)
CREATE OR REPLACE FUNCTION public.join_waitlist(_name text, _email text)
RETURNS TABLE (join_number integer, already_joined boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := trim(coalesce(_name, ''));
  v_email text := lower(trim(coalesce(_email, '')));
  existing_join_number integer;
BEGIN
  IF length(v_name) = 0 OR length(v_name) > 100 THEN
    RAISE EXCEPTION 'Please enter a valid name.' USING ERRCODE = '22023';
  END IF;

  IF length(v_email) = 0 OR length(v_email) > 255 OR v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'Please enter a valid email address.' USING ERRCODE = '22023';
  END IF;

  SELECT w.join_number
  INTO existing_join_number
  FROM public.waitlist w
  WHERE w.email = v_email
  LIMIT 1;

  IF existing_join_number IS NOT NULL THEN
    UPDATE public.waitlist
    SET name = v_name
    WHERE email = v_email;

    RETURN QUERY SELECT existing_join_number, true;
    RETURN;
  END IF;

  INSERT INTO public.waitlist (name, email)
  VALUES (v_name, v_email)
  RETURNING public.waitlist.join_number, false
  INTO join_number, already_joined;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_waitlist(text, text) TO anon, authenticated;