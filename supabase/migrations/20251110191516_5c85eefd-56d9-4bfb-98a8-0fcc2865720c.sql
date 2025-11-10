-- Function to change user role
CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id uuid, new_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can change roles
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  
  -- Prevent users from removing their own admin role if they're the only admin
  IF target_user_id = auth.uid() AND new_role != 'admin' THEN
    IF (SELECT COUNT(*) FROM user_roles WHERE role = 'admin') <= 1 THEN
      RAISE EXCEPTION 'Cannot remove admin role from the last admin';
    END IF;
  END IF;
  
  -- Delete existing roles for this user
  DELETE FROM user_roles WHERE user_id = target_user_id;
  
  -- Insert new role
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, new_role);
END;
$$;

-- Create a view for admins to see user information with roles
CREATE OR REPLACE VIEW public.user_management AS
SELECT 
  au.id,
  au.email,
  au.created_at,
  COALESCE(
    (SELECT ur.role 
     FROM user_roles ur 
     WHERE ur.user_id = au.id 
     AND ur.role = 'admin' 
     LIMIT 1),
    'user'::app_role
  ) as role
FROM auth.users au
ORDER BY au.created_at DESC;

-- Grant access to admins only
GRANT SELECT ON public.user_management TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.user_management SET (security_invoker = on);