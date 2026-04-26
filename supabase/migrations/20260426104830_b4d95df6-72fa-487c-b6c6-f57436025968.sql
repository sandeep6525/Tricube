CREATE TABLE public.project (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  description text,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  total_cost numeric NOT NULL DEFAULT 0,
  staff_salary numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'planned',
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_admin_all
  ON public.project
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY project_self_select
  ON public.project
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.id = project.staff_id AND s.user_id = auth.uid()
    )
  );

CREATE TRIGGER trg_project_touch
  BEFORE UPDATE ON public.project
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_project_staff_id ON public.project(staff_id);