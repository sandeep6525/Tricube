-- Admin-only function to set a user's role (promote/demote)
CREATE OR REPLACE FUNCTION public.set_user_role(_user_id uuid, _new_role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;

  -- Prevent an admin from demoting themselves if they are the last admin
  IF _user_id = auth.uid() AND _new_role <> 'admin' THEN
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot demote the last remaining admin';
    END IF;
  END IF;

  -- Remove any existing roles for this user, then insert the new one
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _new_role);

  RETURN TRUE;
END;
$$;