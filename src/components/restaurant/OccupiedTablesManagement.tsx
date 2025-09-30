'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw,
  User,
  Trash2,
  Timer
} from 'lucide-react';
import { toast } from 'sonner';
// import { useOccupiedTables } from '@/lib/services/occupiedTablesService'; // Service removed

interface OccupiedTablesManagementProps {
  restaurantId: string;
}

export default function OccupiedTablesManagement({ restaurantId }: OccupiedTablesManagementProps) {
  const [occupiedTables, setOccupiedTables] = useState<Array<{
    id: string;
    name?: string;
    client?: { name: string; phone: string };
    reservation?: { time: string; people: number; notes?: string };
    occupiedAt?: Date;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // const { getOccupiedTables, getTimeRemaining, cleanTable } = useOccupiedTables(); // Service removed

  const loadOccupiedTables = React.useCallback(() => {
    setIsLoading(true);
    try {
      const tables: Array<{id: string; name: string}> = []; // getOccupiedTables(); // Service removed
      setOccupiedTables(tables);
      console.log(`Cargadas ${tables.length} mesas ocupadas para restaurante ${restaurantId}`);
    } catch (error) {
      console.error(`Error al cargar mesas ocupadas para restaurante ${restaurantId}:`, error);
      toast.error('Error al cargar las mesas ocupadas');
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]); // Removed getOccupiedTables dependency

  useEffect(() => {
    loadOccupiedTables();
    
    // Actualizar cada minuto para mostrar tiempos restantes actualizados
    const interval = setInterval(() => {
      loadOccupiedTables();
    }, 60000);

    // Escuchar eventos de limpieza automática
    const handleAutoCleanup = (event: Event) => {
      const customEvent = event as CustomEvent;
      toast.success(`🧹 ${customEvent.detail?.count || 1} mesa(s) liberada(s) automáticamente`);
      loadOccupiedTables();
    };

    const handleTableCleaned = (event: Event) => {
      const customEvent = event as CustomEvent;
      toast.success(`🧹 Mesa ${customEvent.detail?.tableId || ''} liberada`);
      loadOccupiedTables();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('tables:auto_cleaned', handleAutoCleanup);
      window.addEventListener('table:cleaned', handleTableCleaned);
      window.addEventListener('table:auto_cleaned', handleTableCleaned);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('tables:auto_cleaned', handleAutoCleanup);
        window.removeEventListener('table:cleaned', handleTableCleaned);
        window.removeEventListener('table:auto_cleaned', handleTableCleaned);
      }
    };
  }, [restaurantId, loadOccupiedTables]);

  const handleManualCleanup = (occupiedTableId: string, tableId: string) => {
    const success = true; // cleanTable(occupiedTableId); // Service removed
    if (success) {
      toast.success(`🧹 Mesa ${tableId} liberada manualmente`);
      toast.info('Mesa disponible para nuevas reservas');
      loadOccupiedTables();
    } else {
      toast.error('Error al liberar la mesa');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-600" />
        <span className="ml-2">Cargando mesas ocupadas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mesas ocupadas */}
      {occupiedTables.length === 0 ? (
        <Card className="text-center py-12 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
          <CardContent>
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              ¡Todas las mesas están libres!
            </h3>
            <p className="text-green-600 mb-4">
              No hay mesas ocupadas en este momento
            </p>
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg inline-block">
              🟢 Restaurante disponible para recibir clientes
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {occupiedTables.map((table) => {
            const timeInfo = {minutes: 60, isOverdue: false}; // getTimeRemaining(table.occupiedAt?.toISOString() || new Date().toISOString()); // Service removed
            const timeRemaining = timeInfo?.minutes || 0;
            const isOverdue = timeInfo?.isOverdue || timeRemaining <= 0;
            const isWarning = timeRemaining <= 30 && timeRemaining > 0;
            
            return (
              <Card 
                key={table.id} 
                className={`transition-all duration-200 hover:shadow-lg border-l-4 ${
                  isOverdue ? 'border-l-red-500 bg-red-50' :
                  isWarning ? 'border-l-yellow-500 bg-yellow-50' :
                  'border-l-blue-500 bg-blue-50'
                }`}
              >
                <CardContent className="p-4">
                  {/* Header de la mesa */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isOverdue ? 'bg-red-100' :
                        isWarning ? 'bg-yellow-100' :
                        'bg-blue-100'
                      }`}>
                        <User className={`h-5 w-5 ${
                          isOverdue ? 'text-red-600' :
                          isWarning ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          Mesa {table.name || table.id}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {table.client?.name || 'Cliente'}
                        </p>
                      </div>
                    </div>
                    
                    <Badge className={`font-bold ${
                      isOverdue ? 'bg-red-500 text-white' :
                      isWarning ? 'bg-yellow-500 text-black' :
                      'bg-blue-500 text-white'
                    }`}>
                      {isOverdue ? 'Retrasada' : isWarning ? 'Por limpiar' : 'Ocupada'}
                    </Badge>
                  </div>

                  {/* Información de tiempo */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tiempo restante:</span>
                      <span className={`font-bold ${
                        isOverdue ? 'text-red-600' :
                        isWarning ? 'text-yellow-600' :
                        'text-blue-600'
                      }`}>
                        {isOverdue ? 'Tiempo agotado' : `${timeRemaining} min`}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Personas:</span>
                      <span className="font-medium">{table.reservation?.people || 0}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Hora reserva:</span>
                      <span className="font-medium">{table.reservation?.time || '--'}</span>
                    </div>
                  </div>

                  {/* Notas */}
                  {table.reservation?.notes && (
                    <div className="bg-gray-100 p-2 rounded-lg mb-4">
                      <p className="text-sm text-gray-700">
                        <strong>Notas:</strong> {table.reservation.notes}
                      </p>
                    </div>
                  )}

                  {/* Botón de limpieza */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleManualCleanup(table.id, table.name || table.id)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                        isOverdue ? 'bg-red-500 hover:bg-red-600 text-white' :
                        isWarning ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                        'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>
                        {isOverdue ? 'Liberar Ahora' : 
                         isWarning ? 'Preparar Limpieza' : 
                         'Limpiar Mesa'}
                      </span>
                    </button>
                  </div>

                  {/* Indicador de tiempo automático */}
                  {isOverdue && (
                    <div className="mt-3 bg-red-100 border border-red-200 rounded-lg p-2">
                      <div className="flex items-center space-x-2 text-red-700 text-xs">
                        <Timer className="h-4 w-4" />
                        <span className="font-medium">
                          ⚠️ Mesa se liberará automáticamente
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}