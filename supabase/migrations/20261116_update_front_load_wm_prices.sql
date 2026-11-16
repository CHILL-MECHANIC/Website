-- Front load washing machine price cut. No-op if the live services table has no matching rows.
UPDATE public.services SET price = 999
WHERE service_type = 'washing-machine' AND name ILIKE '%front load%jet%';

UPDATE public.services SET price = 499
WHERE service_type = 'washing-machine' AND name ILIKE '%front load%service%' AND name NOT ILIKE '%jet%';
