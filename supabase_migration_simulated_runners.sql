-- ============================================
-- Migración: Crear tablas para runners simulados
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- 1) Crear tabla r4w_simulated_runners
CREATE TABLE IF NOT EXISTS r4w_simulated_runners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  speed_factor NUMERIC(3, 2) NOT NULL CHECK (speed_factor >= 0.3 AND speed_factor <= 1.8),
  race_type TEXT NOT NULL DEFAULT '7d_mvp',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) Crear tabla r4w_simulated_positions
CREATE TABLE IF NOT EXISTS r4w_simulated_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  runner_id UUID NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 7),
  answered BOOLEAN NOT NULL DEFAULT true,
  positions_gained INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign Key a r4w_simulated_runners
  CONSTRAINT fk_runner
    FOREIGN KEY (runner_id)
    REFERENCES r4w_simulated_runners(id)
    ON DELETE CASCADE
);

-- 3) Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_simulated_runners_race_type
ON r4w_simulated_runners(race_type);

CREATE INDEX IF NOT EXISTS idx_simulated_positions_runner_day
ON r4w_simulated_positions(runner_id, day_number);

CREATE INDEX IF NOT EXISTS idx_simulated_positions_day
ON r4w_simulated_positions(day_number);

-- 4) Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5) Trigger para actualizar updated_at en r4w_simulated_runners
CREATE TRIGGER update_r4w_simulated_runners_updated_at
BEFORE UPDATE ON r4w_simulated_runners
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verificación (opcional)
-- ============================================
-- SELECT * FROM r4w_simulated_runners LIMIT 0;
-- SELECT * FROM r4w_simulated_positions LIMIT 0;


