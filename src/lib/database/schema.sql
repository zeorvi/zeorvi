-- Schema optimizado para 30+ restaurantes
-- Configuración de PostgreSQL para alta disponibilidad y rendimiento

-- Configuración de conexiones
-- ALTER SYSTEM SET max_connections = 200;
-- ALTER SYSTEM SET shared_buffers = '256MB';
-- ALTER SYSTEM SET effective_cache_size = '1GB';
-- ALTER SYSTEM SET maintenance_work_mem = '64MB';
-- ALTER SYSTEM SET checkpoint_completion_target = 0.9;
-- ALTER SYSTEM SET wal_buffers = '16MB';
-- ALTER SYSTEM SET default_statistics_target = 100;

-- Índices optimizados para múltiples restaurantes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_status ON restaurants(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_plan ON restaurants(plan);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_created_at ON restaurants(created_at);

-- Índices para table_states (tabla más consultada)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_table_states_restaurant_status ON table_states(restaurant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_table_states_restaurant_location ON table_states(restaurant_id, location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_table_states_last_updated ON table_states(last_updated);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_table_states_reservation ON table_states(current_reservation_id) WHERE current_reservation_id IS NOT NULL;

-- Índices para reservations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_restaurant_date ON reservations(restaurant_id, reservation_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_restaurant_status ON reservations(restaurant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_phone ON reservations(client_phone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reservations_date_time ON reservations(reservation_date, reservation_time);

-- Índices para metrics (para reportes y analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_restaurant_date ON restaurant_metrics(restaurant_id, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_restaurant_hour ON restaurant_metrics(restaurant_id, hour);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_date_hour ON restaurant_metrics(date, hour);

-- Índices para system_events (para auditoría)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_events_restaurant ON system_events(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_events_type ON system_events(event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_events_created_at ON system_events(created_at);

-- Índices para clients
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_restaurant ON clients(restaurant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_email ON clients(email) WHERE email IS NOT NULL;

-- Particionado por fecha para tablas grandes (opcional para alta escala)
-- CREATE TABLE reservations_2024 PARTITION OF reservations FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
-- CREATE TABLE reservations_2025 PARTITION OF reservations FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Vistas materializadas para consultas frecuentes
CREATE MATERIALIZED VIEW IF NOT EXISTS restaurant_daily_stats AS
SELECT 
    restaurant_id,
    date,
    COUNT(*) as total_reservations,
    COUNT(CASE WHEN status = 'confirmada' THEN 1 END) as confirmed_reservations,
    COUNT(CASE WHEN status = 'cancelada' THEN 1 END) as cancelled_reservations,
    AVG(party_size) as avg_party_size
FROM reservations 
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY restaurant_id, date;

CREATE UNIQUE INDEX ON restaurant_daily_stats (restaurant_id, date);
REFRESH MATERIALIZED VIEW CONCURRENTLY restaurant_daily_stats;

-- Función para limpiar datos antiguos (ejecutar diariamente)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Limpiar métricas antiguas (mantener solo 1 año)
    DELETE FROM restaurant_metrics 
    WHERE date < CURRENT_DATE - INTERVAL '1 year';
    
    -- Limpiar eventos del sistema antiguos (mantener solo 6 meses)
    DELETE FROM system_events 
    WHERE created_at < CURRENT_DATE - INTERVAL '6 months';
    
    -- Limpiar reservas completadas antiguas (mantener solo 2 años)
    DELETE FROM reservations 
    WHERE status = 'completada' 
    AND reservation_date < CURRENT_DATE - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Configurar limpieza automática (requiere pg_cron)
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');

-- Configuración de conexiones por restaurante
CREATE OR REPLACE FUNCTION get_restaurant_connection_pool_size(restaurant_count integer)
RETURNS integer AS $$
BEGIN
    -- Cálculo dinámico del pool de conexiones basado en el número de restaurantes
    RETURN GREATEST(10, LEAST(50, restaurant_count * 2));
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de rendimiento
CREATE OR REPLACE FUNCTION get_database_performance_stats()
RETURNS TABLE (
    total_restaurants integer,
    total_reservations bigint,
    total_tables bigint,
    avg_reservations_per_restaurant numeric,
    db_size_mb numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM restaurants WHERE status = 'active')::integer,
        (SELECT COUNT(*) FROM reservations)::bigint,
        (SELECT COUNT(*) FROM table_states)::bigint,
        (SELECT AVG(restaurant_reservations.count) FROM (
            SELECT COUNT(*) as count 
            FROM reservations 
            GROUP BY restaurant_id
        ) restaurant_reservations)::numeric,
        (SELECT pg_database_size(current_database()) / 1024 / 1024)::numeric;
END;
$$ LANGUAGE plpgsql;
