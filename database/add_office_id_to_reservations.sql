ALTER TABLE public.reservations
ADD COLUMN office_id UUID,
ADD CONSTRAINT fk_reservations_office_id
  FOREIGN KEY (office_id)
  REFERENCES public.offices(id);
