-- Crear tabla para traslados de reservas
CREATE TABLE IF NOT EXISTS reservation_transfers (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  segment_id BIGINT REFERENCES reservation_segments(id) ON DELETE CASCADE,
  transfer_type VARCHAR(50) NOT NULL CHECK (transfer_type IN ('arrival', 'departure', 'inter_hotel')),
  pickup_location VARCHAR(255),
  dropoff_location VARCHAR(255),
  transfer_date DATE,
  transfer_time TIME,
  cost DECIMAL(10,2) DEFAULT 0,
  include_cost BOOLEAN DEFAULT FALSE,
  vehicle_type VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_transfers_reservation ON reservation_transfers(reservation_id);
CREATE INDEX idx_transfers_segment ON reservation_transfers(segment_id);
CREATE INDEX idx_transfers_type ON reservation_transfers(transfer_type);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_transfer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_transfer_timestamp
BEFORE UPDATE ON reservation_transfers
FOR EACH ROW
EXECUTE FUNCTION update_transfer_updated_at();

-- Comentarios de documentación
COMMENT ON TABLE reservation_transfers IS 'Almacena los traslados asociados a cada segmento de una reserva';
COMMENT ON COLUMN reservation_transfers.transfer_type IS 'Tipo de traslado: arrival (llegada), departure (salida), inter_hotel (entre hoteles)';
COMMENT ON COLUMN reservation_transfers.include_cost IS 'Indica si el costo del traslado se suma al total de la reserva';
