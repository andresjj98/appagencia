
BEGIN
  RETURN QUERY
  SELECT
    cr.id,
    cr.reservation_id,
    cr.requested_by_id,
    u.name AS requested_by_name,
    cr.request_reason,
    cr.created_at,
    EXISTS(
      SELECT 1
      FROM public.change_request_documents crd
      WHERE crd.change_request_id = cr.id
    ) AS has_documents
  FROM public.change_requests cr
  LEFT JOIN public.usuarios u ON u.id = cr.requested_by_id
  WHERE cr.section_to_change = 'cancellation'
    AND cr.status = 'pending'
  ORDER BY cr.created_at ASC;
END;
