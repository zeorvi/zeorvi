-- =============================================
-- ESQUEMA DE BASE DE DATOS PARA RESTAURANTE IA PLATAFORMA
-- Reemplaza completamente Firebase Firestore
-- =============================================

-- Crear base de datos principal
CREATE DATABASE restaurant_platform;

-- Conectar a la base de datos
\c restaurant_platform;

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA PRINCIPAL DE RESTAURANTES
-- =============================================

CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'España',
    config JSONB DEFAULT '{}',
    plan VARCHAR(20) DEFAULT 'basic' CHECK (plan IN ('basic', 'premium', 'enterprise')),
    plan_expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    retell_config JSONB DEFAULT '{}',
    twilio_config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para restaurantes
CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_restaurants_owner_email ON restaurants(owner_email);
CREATE INDEX idx_restaurants_status ON restaurants(status);

-- =============================================
-- TABLA DE USUARIOS DEL SISTEMA
-- =============================================

CREATE TABLE restaurant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'restaurant', 'manager', 'employee')),
    restaurant_name VARCHAR(255),
    permissions JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para usuarios
CREATE INDEX idx_restaurant_users_email ON restaurant_users(email);
CREATE INDEX idx_restaurant_users_restaurant_id ON restaurant_users(restaurant_id);
CREATE INDEX idx_restaurant_users_role ON restaurant_users(role);
CREATE INDEX idx_restaurant_users_status ON restaurant_users(status);

-- =============================================
-- FUNCIÓN PARA CREAR SCHEMA POR RESTAURANTE
-- =============================================

CREATE OR REPLACE FUNCTION create_restaurant_schema(restaurant_uuid UUID)
RETURNS VOID AS $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Crear nombre del schema basado en el UUID
    schema_name := 'restaurant_' || replace(restaurant_uuid::text, '-', '_');
    
    -- Crear el schema
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || schema_name;
    
    -- Crear tabla de mesas
    EXECUTE '
    CREATE TABLE IF NOT EXISTS ' || schema_name || '.tables (
        id SERIAL PRIMARY KEY,
        number VARCHAR(20) NOT NULL,
        name VARCHAR(100),
        capacity INTEGER NOT NULL DEFAULT 4,
        location VARCHAR(100),
        status VARCHAR(20) DEFAULT ''available'' CHECK (status IN (''available'', ''occupied'', ''reserved'', ''maintenance'')),
        position_x INTEGER DEFAULT 0,
        position_y INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )';
    
    -- Crear tabla de clientes
    EXECUTE '
    CREATE TABLE IF NOT EXISTS ' || schema_name || '.clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        notes TEXT,
        preferences JSONB DEFAULT ''[]'',
        total_visits INTEGER DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0,
        last_visit TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )';
    
    -- Crear tabla de reservas
    EXECUTE '
    CREATE TABLE IF NOT EXISTS ' || schema_name || '.reservations (
        id SERIAL PRIMARY KEY,
        table_id INTEGER REFERENCES ' || schema_name || '.tables(id) ON DELETE SET NULL,
        client_id INTEGER REFERENCES ' || schema_name || '.clients(id) ON DELETE SET NULL,
        client_name VARCHAR(255) NOT NULL,
        client_phone VARCHAR(20),
        client_email VARCHAR(255),
        reservation_date DATE NOT NULL,
        reservation_time TIME NOT NULL,
        duration_minutes INTEGER DEFAULT 120,
        party_size INTEGER NOT NULL DEFAULT 2,
        status VARCHAR(20) DEFAULT ''confirmed'' CHECK (status IN (''confirmed'', ''pending'', ''cancelled'', ''no_show'', ''completed'')),
        notes TEXT,
        special_requests TEXT,
        source VARCHAR(20) DEFAULT ''manual'' CHECK (source IN (''manual'', ''retell'', ''online'', ''phone'')),
        source_data JSONB DEFAULT ''{}'',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )';
    
    -- Crear tabla de configuración Retell
    EXECUTE '
    CREATE TABLE IF NOT EXISTS ' || schema_name || '.retell_config (
        id SERIAL PRIMARY KEY,
        agent_id VARCHAR(255),
        api_key VARCHAR(255),
        phone_number VARCHAR(20),
        config JSONB DEFAULT ''{}'',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )';
    
    -- Crear tabla de configuración Twilio
    EXECUTE '
    CREATE TABLE IF NOT EXISTS ' || schema_name || '.twilio_config (
        id SERIAL PRIMARY KEY,
        account_sid VARCHAR(255),
        auth_token VARCHAR(255),
        phone_number VARCHAR(20),
        config JSONB DEFAULT ''{}'',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )';
    
    -- Crear tabla de logs de actividad
    EXECUTE '
    CREATE TABLE IF NOT EXISTS ' || schema_name || '.activity_logs (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES restaurant_users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        table_id INTEGER REFERENCES ' || schema_name || '.tables(id) ON DELETE SET NULL,
        reservation_id INTEGER REFERENCES ' || schema_name || '.reservations(id) ON DELETE SET NULL,
        details JSONB DEFAULT ''{}'',
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    )';
    
    -- Crear índices para las tablas del schema
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_' || schema_name || '_tables_number ON ' || schema_name || '.tables(number)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_' || schema_name || '_tables_status ON ' || schema_name || '.tables(status)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_' || schema_name || '_clients_phone ON ' || schema_name || '.clients(phone)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_' || schema_name || '_clients_email ON ' || schema_name || '.clients(email)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_' || schema_name || '_reservations_date ON ' || schema_name || '.reservations(reservation_date)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_' || schema_name || '_reservations_status ON ' || schema_name || '.reservations(status)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_' || schema_name || '_reservations_table_id ON ' || schema_name || '.reservations(table_id)';
    
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS PARA ACTUALIZAR updated_at
-- =============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para restaurantes
CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers para usuarios
CREATE TRIGGER update_restaurant_users_updated_at
    BEFORE UPDATE ON restaurant_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar usuario administrador por defecto
INSERT INTO restaurant_users (
    email, 
    password_hash, 
    name, 
    role, 
    permissions,
    status
) VALUES (
    'admin@restauranteia.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5J5K5K5K5K', -- password: admin123
    'Administrador',
    'admin',
    '["restaurants:read", "restaurants:write", "restaurants:delete", "users:read", "users:write", "users:delete", "reports:read", "settings:read", "settings:write"]',
    'active'
);

-- Insertar restaurantes de ejemplo
INSERT INTO restaurants (
    name,
    slug,
    owner_email,
    owner_name,
    phone,
    address,
    city,
    retell_config,
    twilio_config
) VALUES 
(
    'Restaurante El Buen Sabor',
    'el-buen-sabor',
    'admin@elbuensabor.com',
    'María González',
    '+34123456789',
    'Calle Principal 123',
    'Madrid',
    '{"agent_id": "agent_2082fc7a622cdbd22441b22060", "api_key": "key_af2cbf1b9fb5a43ebc84bc56b27b", "phone_number": "+34984175959"}',
    '{"account_sid": "TKeeaa06c4cb6cc36135a403c046fef1f2", "auth_token": "8a1ec4fac38025b24b3945a48eb1b48d", "phone_number": "+34984175959"}'
),
(
    'Restaurante La Gaviota',
    'la-gaviota',
    'admin@lagaviota.com',
    'Carlos Rodríguez',
    '+34912345678',
    'Avenida del Mar 45',
    'Valencia',
    '{"agent_id": "agent_la_gaviota_001", "api_key": "key_la_gaviota_2024", "phone_number": "+34912345678"}',
    '{"account_sid": "TKeeaa06c4cb6cc36135a403c046fef1f2", "auth_token": "8a1ec4fac38025b24b3945a48eb1b48d", "phone_number": "+34912345678"}'
);

-- Crear usuarios para los restaurantes de ejemplo
INSERT INTO restaurant_users (
    restaurant_id,
    email,
    password_hash,
    name,
    role,
    restaurant_name,
    permissions,
    status
) VALUES 
(
    (SELECT id FROM restaurants WHERE slug = 'el-buen-sabor'),
    'admin@elbuensabor.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5J5K5K5K5K', -- password: restaurante123
    'Gerente El Buen Sabor',
    'restaurant',
    'Restaurante El Buen Sabor',
    '["tables:read", "tables:write", "reservations:read", "reservations:write", "clients:read", "clients:write", "reports:read"]',
    'active'
),
(
    (SELECT id FROM restaurants WHERE slug = 'la-gaviota'),
    'admin@lagaviota.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5J5K5K5K5K', -- password: restaurante123
    'Gerente La Gaviota',
    'restaurant',
    'Restaurante La Gaviota',
    '["tables:read", "tables:write", "reservations:read", "reservations:write", "clients:read", "clients:write", "reports:read"]',
    'active'
);

-- Crear schemas para los restaurantes de ejemplo
SELECT create_restaurant_schema((SELECT id FROM restaurants WHERE slug = 'el-buen-sabor'));
SELECT create_restaurant_schema((SELECT id FROM restaurants WHERE slug = 'la-gaviota'));

-- Insertar mesas para El Buen Sabor
INSERT INTO restaurant_el_buen_sabor.tables (number, name, capacity, location, status, position_x, position_y) VALUES
('M1', 'Mesa 1', 4, 'Terraza', 'available', 100, 100),
('M2', 'Mesa 2', 4, 'Terraza', 'available', 200, 100),
('M3', 'Mesa 3', 6, 'Interior', 'available', 100, 200),
('M4', 'Mesa 4', 6, 'Interior', 'available', 200, 200),
('M5', 'Mesa 5', 2, 'Barra', 'available', 300, 100),
('M6', 'Mesa 6', 8, 'Salón Principal', 'available', 100, 300);

-- Insertar mesas para La Gaviota
INSERT INTO restaurant_la_gaviota.tables (number, name, capacity, location, status, position_x, position_y) VALUES
('G1', 'Mesa Gaviota 1', 4, 'Terraza Mar', 'available', 100, 100),
('G2', 'Mesa Gaviota 2', 4, 'Terraza Mar', 'available', 200, 100),
('G3', 'Mesa Gaviota 3', 6, 'Salón Interior', 'available', 100, 200),
('G4', 'Mesa Gaviota 4', 6, 'Salón Interior', 'available', 200, 200),
('G5', 'Mesa Gaviota 5', 2, 'Barra Vista Mar', 'available', 300, 100),
('G6', 'Mesa Gaviota 6', 8, 'Salón Principal', 'available', 100, 300),
('G7', 'Mesa Gaviota 7', 4, 'Terraza Privada', 'available', 400, 100),
('G8', 'Mesa Gaviota 8', 6, 'Rincón Romántico', 'available', 200, 300);

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista para estadísticas de restaurantes
CREATE VIEW restaurant_stats AS
SELECT 
    r.id,
    r.name,
    r.slug,
    r.status,
    COUNT(DISTINCT ru.id) as user_count,
    COUNT(DISTINCT t.id) as table_count,
    COUNT(DISTINCT res.id) as reservation_count,
    r.created_at
FROM restaurants r
LEFT JOIN restaurant_users ru ON r.id = ru.restaurant_id AND ru.status = 'active'
LEFT JOIN restaurant_el_buen_sabor.tables t ON r.slug = 'el-buen-sabor' -- Esto se puede mejorar con una función dinámica
LEFT JOIN restaurant_el_buen_sabor.reservations res ON r.slug = 'el-buen-sabor'
GROUP BY r.id, r.name, r.slug, r.status, r.created_at;

-- =============================================
-- FUNCIONES DE UTILIDAD
-- =============================================

-- Función para obtener estadísticas de un restaurante
CREATE OR REPLACE FUNCTION get_restaurant_stats(restaurant_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    schema_name TEXT;
    result JSONB;
BEGIN
    schema_name := 'restaurant_' || replace(restaurant_uuid::text, '-', '_');
    
    EXECUTE format('
        SELECT jsonb_build_object(
            ''tables_total'', (SELECT COUNT(*) FROM %I.tables),
            ''tables_available'', (SELECT COUNT(*) FROM %I.tables WHERE status = ''available''),
            ''tables_occupied'', (SELECT COUNT(*) FROM %I.tables WHERE status = ''occupied''),
            ''tables_reserved'', (SELECT COUNT(*) FROM %I.tables WHERE status = ''reserved''),
            ''reservations_today'', (SELECT COUNT(*) FROM %I.reservations WHERE reservation_date = CURRENT_DATE),
            ''reservations_confirmed'', (SELECT COUNT(*) FROM %I.reservations WHERE status = ''confirmed''),
            ''clients_total'', (SELECT COUNT(*) FROM %I.clients)
        )
    ', schema_name, schema_name, schema_name, schema_name, schema_name, schema_name, schema_name)
    INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =============================================

COMMENT ON DATABASE restaurant_platform IS 'Base de datos principal para la plataforma de restaurantes con IA';
COMMENT ON TABLE restaurants IS 'Información principal de los restaurantes registrados';
COMMENT ON TABLE restaurant_users IS 'Usuarios del sistema (admin, restaurantes, empleados)';
COMMENT ON FUNCTION create_restaurant_schema(UUID) IS 'Crea un schema separado para cada restaurante con sus tablas específicas';
COMMENT ON FUNCTION get_restaurant_stats(UUID) IS 'Obtiene estadísticas completas de un restaurante específico';
