-- Fix the get_users_list function to properly cast email type
CREATE OR REPLACE FUNCTION public.get_users_list()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  role app_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can get the user list
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can view user list';
  END IF;

  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,  -- Explicitly cast email to text
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
END;
$$;