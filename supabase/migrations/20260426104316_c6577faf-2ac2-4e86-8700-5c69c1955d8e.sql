-- Add a column on expense to link back to the originating payslip
ALTER TABLE public.expense
  ADD COLUMN IF NOT EXISTS payslip_id uuid;

CREATE INDEX IF NOT EXISTS idx_expense_payslip_id ON public.expense(payslip_id);

-- Trigger function: keep an expense row in sync with each payslip
CREATE OR REPLACE FUNCTION public.sync_payslip_expense()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff_name text;
  v_net numeric;
  v_date date;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    DELETE FROM public.expense WHERE payslip_id = OLD.id;
    RETURN OLD;
  END IF;

  SELECT name INTO v_staff_name FROM public.staff WHERE id = NEW.staff_id;
  v_net := COALESCE(NEW.basic_salary, 0) + COALESCE(NEW.bonus, 0) - COALESCE(NEW.deductions, 0);
  v_date := COALESCE(NEW.payment_date, CURRENT_DATE);

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.expense (title, amount, category, date, staff_id, notes, payslip_id)
    VALUES (
      'Salary - ' || COALESCE(v_staff_name, 'Staff') || ' (' || NEW.month || ')',
      v_net,
      'salary',
      v_date,
      NEW.staff_id,
      NEW.notes,
      NEW.id
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    UPDATE public.expense
       SET title    = 'Salary - ' || COALESCE(v_staff_name, 'Staff') || ' (' || NEW.month || ')',
           amount   = v_net,
           category = 'salary',
           date     = v_date,
           staff_id = NEW.staff_id,
           notes    = NEW.notes
     WHERE payslip_id = NEW.id;

    -- If no matching expense exists yet (e.g. legacy payslip), create one
    IF NOT FOUND THEN
      INSERT INTO public.expense (title, amount, category, date, staff_id, notes, payslip_id)
      VALUES (
        'Salary - ' || COALESCE(v_staff_name, 'Staff') || ' (' || NEW.month || ')',
        v_net, 'salary', v_date, NEW.staff_id, NEW.notes, NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payslip_sync_expense ON public.payslip;
CREATE TRIGGER trg_payslip_sync_expense
AFTER INSERT OR UPDATE OR DELETE ON public.payslip
FOR EACH ROW EXECUTE FUNCTION public.sync_payslip_expense();

-- Backfill: create expense rows for any existing payslips that don't have one
INSERT INTO public.expense (title, amount, category, date, staff_id, notes, payslip_id)
SELECT
  'Salary - ' || COALESCE(s.name, 'Staff') || ' (' || p.month || ')',
  COALESCE(p.basic_salary,0) + COALESCE(p.bonus,0) - COALESCE(p.deductions,0),
  'salary',
  COALESCE(p.payment_date, CURRENT_DATE),
  p.staff_id,
  p.notes,
  p.id
FROM public.payslip p
LEFT JOIN public.staff s ON s.id = p.staff_id
LEFT JOIN public.expense e ON e.payslip_id = p.id
WHERE e.id IS NULL;