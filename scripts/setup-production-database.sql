-- Tablas para sistema de gestión de restaurantes en producción
-- Base de datos PostgreSQL

-- Tabla de estados de mesas en tiempo real
CREATE TABLE IF NOT EXISTS table_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id VARCHAR(50) NOT NULL,
    table_id VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    location VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('libre', 'ocupada', 'reservada', 'ocupado_todo_dia', 'mantenimiento')),
    current_reservation_id UUID,
    client_name VARCHAR(100),
    client_phone VARCHAR(20),
    party_size INTEGER,
    notes TEXT,
    occupied_at TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(restaurant_id, table_id)
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id VARCHAR(50) NOT NULL,
    table_id VARCHAR(50),
    client_name VARCHAR(100) NOT NULL,
    client_phone VARCHAR(20) NOT NULL,
    client_email VARCHAR(100),
    party_size INTEGER NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmada' CHECK (status IN ('pendiente', 'confirmada', 'ocupada', 'cancelada', 'completada')),
    special_requests TEXT,
    location_preference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    notes TEXT
);

-- Tabla de horarios del restaurante
CREATE TABLE IF NOT EXISTS restaurant_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id VARCHAR(50) NOT NULL,
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    is_open BOOLEAN NOT NULL DEFAULT true,
    opening_time TIME,
    closing_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(restaurant_id, day_of_week)
);

-- Tabla de métricas del restaurante
CREATE TABLE IF NOT EXISTS restaurant_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
    total_tables INTEGER NOT NULL,
    occupied_tables INTEGER NOT NULL DEFAULT 0,
    reserved_tables INTEGER NOT NULL DEFAULT 0,
    free_tables INTEGER NOT NULL DEFAULT 0,
    occupancy_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    revenue DECIMAL(10,2) DEFAULT 0.00,
    average_table_time INTEGER DEFAULT 0, -- en minutos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(restaurant_id, date, hour)
);

-- Tabla de predicciones de ocupación
CREATE TABLE IF NOT EXISTS occupancy_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id VARCHAR(50) NOT NULL,
    prediction_date DATE NOT NULL,
    prediction_hour INTEGER NOT NULL CHECK (prediction_hour >= 0 AND prediction_hour <= 23),
    predicted_occupancy DECIMAL(5,2) NOT NULL,
    confidence_score DECIMAL(5,2) NOT NULL,
    factors JSONB, -- factores que influyeron en la predicción
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(restaurant_id, prediction_date, prediction_hour)
);

-- Tabla de eventos del sistema (para auditoría)
CREATE TABLE IF NOT EXISTS system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    user_id VARCHAR(50),
    source VARCHAR(50) NOT NULL, -- 'dashboard', 'retell', 'api', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    preferences JSONB, -- preferencias del cliente
    total_visits INTEGER DEFAULT 0,
    last_visit DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(restaurant_id, phone)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_table_states_restaurant_id ON table_states(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_table_states_status ON table_states(status);
CREATE INDEX IF NOT EXISTS idx_table_states_last_updated ON table_states(last_updated);

CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_id ON reservations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_phone ON reservations(client_phone);

CREATE INDEX IF NOT EXISTS idx_metrics_restaurant_date ON restaurant_metrics(restaurant_id, date);
CREATE INDEX IF NOT EXISTS idx_predictions_restaurant_date ON occupancy_predictions(restaurant_id, prediction_date);

CREATE INDEX IF NOT EXISTS idx_events_restaurant_id ON system_events(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON system_events(created_at);

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar timestamps
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON restaurant_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para calcular métricas automáticamente
CREATE OR REPLACE FUNCTION calculate_restaurant_metrics()
RETURNS TRIGGER AS $$
DECLARE
    current_hour INTEGER;
    current_date DATE;
BEGIN
    current_hour := EXTRACT(HOUR FROM CURRENT_TIMESTAMP);
    current_date := CURRENT_DATE;
    
    INSERT INTO restaurant_metrics (
        restaurant_id, 
        date, 
        hour, 
        total_tables, 
        occupied_tables, 
        reserved_tables, 
        free_tables, 
        occupancy_rate
    )
    SELECT 
        NEW.restaurant_id,
        current_date,
        current_hour,
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'ocupada'),
        COUNT(*) FILTER (WHERE status = 'reservada'),
        COUNT(*) FILTER (WHERE status = 'libre'),
        ROUND(
            (COUNT(*) FILTER (WHERE status IN ('ocupada', 'reservada'))::DECIMAL / COUNT(*)) * 100, 
            2
        )
    FROM table_states 
    WHERE restaurant_id = NEW.restaurant_id
    ON CONFLICT (restaurant_id, date, hour) 
    DO UPDATE SET
        total_tables = EXCLUDED.total_tables,
        occupied_tables = EXCLUDED.occupied_tables,
        reserved_tables = EXCLUDED.reserved_tables,
        free_tables = EXCLUDED.free_tables,
        occupancy_rate = EXCLUDED.occupancy_rate;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para calcular métricas cuando cambia el estado de una mesa
CREATE TRIGGER calculate_metrics_trigger 
    AFTER INSERT OR UPDATE ON table_states
    FOR EACH ROW EXECUTE FUNCTION calculate_restaurant_metrics();

-- Datos iniciales para La Gaviota (rest_003)
INSERT INTO restaurant_schedules (restaurant_id, day_of_week, is_open, opening_time, closing_time) VALUES
('rest_003', 'monday', true, '12:00', '23:00'),
('rest_003', 'tuesday', true, '12:00', '23:00'),
('rest_003', 'wednesday', true, '12:00', '23:00'),
('rest_003', 'thursday', true, '12:00', '23:00'),
('rest_003', 'friday', true, '12:00', '00:00'),
('rest_003', 'saturday', true, '12:00', '00:00'),
('rest_003', 'sunday', true, '12:00', '22:00')
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;

-- Datos iniciales para El Buen Sabor (rest_001)
INSERT INTO restaurant_schedules (restaurant_id, day_of_week, is_open, opening_time, closing_time) VALUES
('rest_001', 'monday', true, '12:00', '23:00'),
('rest_001', 'tuesday', true, '12:00', '23:00'),
('rest_001', 'wednesday', true, '12:00', '23:00'),
('rest_001', 'thursday', true, '12:00', '23:00'),
('rest_001', 'friday', true, '12:00', '00:00'),
('rest_001', 'saturday', true, '12:00', '00:00'),
('rest_001', 'sunday', true, '12:00', '22:00')
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;
