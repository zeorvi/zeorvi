'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableManagementSystem, Mesa } from '@/lib/tableManagementSystem';

interface TableStatusBoardProps {
  restaurantId: string;
}

export default function TableStatusBoard({ restaurantId }: TableStatusBoardProps) {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadTableStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cron/liberar-mesas?restaurantId=${restaurantId}`);
      const data = await response.json();
      
      if (data.success) {
        setMesas(data.estadoMesas.mesas);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error cargando estado de mesas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTableStatus();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadTableStatus, 30000);
    
    return () => clearInterval(interval);
  }, [restaurantId]);

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'libre':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ocupada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reservada':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'libre':
        return 'Libre';
      case 'ocupada':
        return 'Ocupada';
      case 'reservada':
        return 'Reservada';
      default:
        return 'Desconocido';
    }
  };

  const mesasLibres = mesas.filter(m => m.estado === 'libre').length;
  const mesasOcupadas = mesas.filter(m => m.estado === 'ocupada').length;
  const totalMesas = mesas.length;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estado de mesas...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Estado de Mesas</h2>
        <div className="flex items-center space-x-4">
          <Button 
            onClick={loadTableStatus}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            🔄 Actualizar
          </Button>
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Actualizado: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{mesasLibres}</div>
          <div className="text-sm text-green-700">Mesas Libres</div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">{mesasOcupadas}</div>
          <div className="text-sm text-red-700">Mesas Ocupadas</div>
        </div>
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{totalMesas}</div>
          <div className="text-sm text-blue-700">Total Mesas</div>
        </div>
      </div>

      {/* Lista de Mesas */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalle de Mesas</h3>
        
        {/* Mesas por Ubicación */}
        {['Interior', 'Terraza', 'Privada'].map(ubicacion => {
          const mesasUbicacion = mesas.filter(m => m.ubicacion === ubicacion);
          if (mesasUbicacion.length === 0) return null;

          return (
            <div key={ubicacion} className="mb-4">
              <h4 className="text-md font-medium text-gray-700 mb-2">{ubicacion}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {mesasUbicacion.map(mesa => (
                  <div 
                    key={mesa.id}
                    className={`p-3 rounded-lg border-2 ${getStatusColor(mesa.estado)}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">Mesa {mesa.numero}</span>
                      <Badge className={getStatusColor(mesa.estado)}>
                        {getStatusText(mesa.estado)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Capacidad: {mesa.capacidad} personas
                    </div>
                    {mesa.estado === 'ocupada' && mesa.reservaActual && (
                      <div className="text-xs text-gray-500 mt-1">
                        <div>Cliente: {mesa.reservaActual.cliente}</div>
                        <div>Hasta: {mesa.reservaActual.horaFin}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Información de Liberación Automática */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600">ℹ️</span>
          <div>
            <h4 className="text-sm font-medium text-blue-800">Liberación Automática</h4>
            <p className="text-xs text-blue-700">
              Las mesas se liberan automáticamente después de 2 horas de uso. 
              El sistema se actualiza cada 30 segundos.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
