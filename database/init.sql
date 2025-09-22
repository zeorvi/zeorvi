-- Inicialización de la base de datos del sistema de restaurantes
-- Reemplaza completamente Firebase Firestore

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    
    -- Configuración del restaurante
    config JSONB DEFAULT '{}',
    
    -- Plan de suscripción
    plan VARCHAR(20) DEFAULT 'basic',
    plan_expires_at TIMESTAMP,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'active',
    
    -- Configuración de IA/Retell
    retell_config JSONB DEFAULT '{}',
    twilio_config JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- USUARIOS DEL SISTEMA (EMPLEADOS)
-- =============================================
CREATE TABLE restaurant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Datos del usuario
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    
    -- Rol y permisos
    role VARCHAR(20) DEFAULT 'employee',
    permissions JSONB DEFAULT '[]',
    
    -- Estado
    status VARCHAR(20) DEFAULT 'active',
    last_login TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(restaurant_id, email)
);

-- =============================================
-- FUNCIÓN PARA CREAR SCHEMA DE RESTAURANTE
-- =============================================
CREATE OR REPLACE FUNCTION create_restaurant_schema(restaurant_uuid UUID)
RETURNS VOID AS $$
DECLARE
    schema_name TEXT;
BEGIN
    schema_name := 'restaurant_' || replace(restaurant_uuid::text, '-', '_');
    
    -- Crear schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    
    -- Tabla de mesas
    EXECUTE format('
        CREATE TABLE %I.tables (
            id SERIAL PRIMARY KEY,
            number VARCHAR(10) NOT NULL,
            name VARCHAR(50),
            capacity INTEGER NOT NULL,
            location VARCHAR(100),
            status VARCHAR(20) DEFAULT ''available'',
            position_x INTEGER DEFAULT 0,
            position_y INTEGER DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )', schema_name);
    
    -- Tabla de clientes
    EXECUTE format('
        CREATE TABLE %I.clients (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            email VARCHAR(255),
            notes TEXT,
            preferences JSONB DEFAULT ''[]'',
            total_visits INTEGER DEFAULT 0,
            total_spent DECIMAL(10,2) DEFAULT 0,
            last_visit DATE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )', schema_name);
    
    -- Tabla de reservas
    EXECUTE format('
        CREATE TABLE %I.reservations (
            id SERIAL PRIMARY KEY,
            table_id INTEGER REFERENCES %I.tables(id),
            client_id INTEGER REFERENCES %I.clients(id),
            
            -- Datos de la reserva
            client_name VARCHAR(255) NOT NULL,
            client_phone VARCHAR(20),
            client_email VARCHAR(255),
            
            -- Fecha y hora
            reservation_date DATE NOT NULL,
            reservation_time TIME NOT NULL,
            duration_minutes INTEGER DEFAULT 120,
            
            -- Detalles
            party_size INTEGER NOT NULL,
            status VARCHAR(20) DEFAULT ''confirmed'',
            notes TEXT,
            special_requests TEXT,
            
            -- Origen de la reserva
            source VARCHAR(50) DEFAULT ''manual'',
            source_data JSONB DEFAULT ''{}'',
            
            -- Timestamps
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )', schema_name, schema_name, schema_name);
    
    -- Tabla de pedidos
    EXECUTE format('
        CREATE TABLE %I.orders (
            id SERIAL PRIMARY KEY,
            table_id INTEGER REFERENCES %I.tables(id),
            reservation_id INTEGER REFERENCES %I.reservations(id),
            
            -- Datos del pedido
            items JSONB NOT NULL DEFAULT ''[]'',
            subtotal DECIMAL(10,2) DEFAULT 0,
            tax_amount DECIMAL(10,2) DEFAULT 0,
            tip_amount DECIMAL(10,2) DEFAULT 0,
            total_amount DECIMAL(10,2) DEFAULT 0,
            
            -- Estado
            status VARCHAR(20) DEFAULT ''pending'',
            
            -- Timestamps
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )', schema_name, schema_name, schema_name);
    
    -- Tabla de estadísticas diarias
    EXECUTE format('
        CREATE TABLE %I.daily_stats (
            id SERIAL PRIMARY KEY,
            date DATE NOT NULL,
            
            -- Estadísticas de reservas
            total_reservations INTEGER DEFAULT 0,
            confirmed_reservations INTEGER DEFAULT 0,
            cancelled_reservations INTEGER DEFAULT 0,
            no_show_reservations INTEGER DEFAULT 0,
            
            -- Estadísticas de mesas
            table_occupancy_rate DECIMAL(5,2) DEFAULT 0,
            average_table_turnover DECIMAL(5,2) DEFAULT 0,
            
            -- Estadísticas financieras
            total_revenue DECIMAL(10,2) DEFAULT 0,
            average_order_value DECIMAL(10,2) DEFAULT 0,
            
            -- Datos adicionales
            peak_hours JSONB DEFAULT ''[]'',
            popular_tables JSONB DEFAULT ''[]'',
            
            created_at TIMESTAMP DEFAULT NOW(),
            
            UNIQUE(date)
        )', schema_name);
    
    -- Tabla de logs de actividad
    EXECUTE format('
        CREATE TABLE %I.activity_logs (
            id SERIAL PRIMARY KEY,
            user_id UUID,
            action VARCHAR(100) NOT NULL,
            entity_type VARCHAR(50),
            entity_id INTEGER,
            details JSONB DEFAULT ''{}'',
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )', schema_name);
    
    -- Índices para performance
    EXECUTE format('CREATE INDEX idx_%s_reservations_date ON %I.reservations(reservation_date)', replace(restaurant_uuid::text, '-', '_'), schema_name);
    EXECUTE format('CREATE INDEX idx_%s_reservations_status ON %I.reservations(status)', replace(restaurant_uuid::text, '-', '_'), schema_name);
    EXECUTE format('CREATE INDEX idx_%s_tables_status ON %I.tables(status)', replace(restaurant_uuid::text, '-', '_'), schema_name);
    EXECUTE format('CREATE INDEX idx_%s_clients_phone ON %I.clients(phone)', replace(restaurant_uuid::text, '-', '_'), schema_name);
    EXECUTE format('CREATE INDEX idx_%s_orders_created_at ON %I.orders(created_at)', replace(restaurant_uuid::text, '-', '_'), schema_name);
    
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCIÓN PARA ACTUALIZAR TIMESTAMPS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_restaurant_users_updated_at BEFORE UPDATE ON restaurant_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DATOS DE EJEMPLO PARA DESARROLLO
-- =============================================
INSERT INTO restaurants (name, slug, owner_email, owner_name, phone, address, city, config) VALUES 
(
    'El Buen Sabor', 
    'el-buen-sabor',
    'admin@elbuensabor.com',
    'Juan García',
    '+34 91 123 45 67',
    'Calle Mayor 123',
    'Madrid',
    '{"cuisine": "española", "capacity": 80, "opens_at": "12:00", "closes_at": "23:00"}'
);

-- Crear schema para el restaurante de ejemplo
DO $$
DECLARE
    restaurant_uuid UUID;
BEGIN
    SELECT id INTO restaurant_uuid FROM restaurants WHERE slug = 'el-buen-sabor';
    PERFORM create_restaurant_schema(restaurant_uuid);
END $$;

-- Usuario administrador para el restaurante de ejemplo
INSERT INTO restaurant_users (restaurant_id, email, password_hash, name, role) VALUES 
(
    (SELECT id FROM restaurants WHERE slug = 'el-buen-sabor'),
    'admin@elbuensabor.com',
    crypt('admin123', gen_salt('bf')),
    'Juan García',
    'admin'
);

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista para estadísticas generales
CREATE VIEW restaurant_overview AS
SELECT 
    r.id,
    r.name,
    r.slug,
    r.plan,
    r.status,
    r.created_at,
    (SELECT COUNT(*) FROM restaurant_users ru WHERE ru.restaurant_id = r.id) as total_users
FROM restaurants r;

COMMENT ON DATABASE restaurant_platform IS 'Base de datos principal del sistema de restaurantes - Reemplaza Firebase Firestore';

