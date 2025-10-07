'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, MapPin, Phone, Search, RefreshCw } from 'lucide-react';

interface Reservation {
  id: string;
  date: string;
  time: string;
  clientName: string;
  partySize: number;
  table?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
  phone?: string;
}

interface ReservationsManagementProps {
  restaurantId: string;
  isDarkMode?: boolean;
}

export default function ReservationsManagement({ 
  restaurantId, 
  isDarkMode = false 
}: ReservationsManagementProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  // Función para cargar todas las reservas
  const loadAllReservations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/google-sheets/reservas?restaurantId=${restaurantId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const allReservations = data.reservas
            .sort((a: any, b: any) => {
              // Ordenar por fecha primero, luego por hora
              if (a.Fecha !== b.Fecha) {
                return a.Fecha.localeCompare(b.Fecha);
              }
              return a.Hora.localeCompare(b.Hora);
            })
            .map((reserva: any) => ({
              id: reserva.ID,
              date: reserva.Fecha,
              time: reserva.Hora,
              clientName: reserva.Cliente,
              partySize: reserva.Personas,
              table: reserva.Mesa || 'Por asignar',
              status: reserva.Estado === 'Confirmada' ? 'confirmed' : 
                     reserva.Estado === 'Pendiente' ? 'pending' : 'cancelled',
              notes: reserva.Notas || '',
              phone: reserva.Telefono || ''
            }));
          
          setReservations(allReservations);
          console.log('📅 ReservationsManagement: Todas las reservas cargadas:', allReservations);
        } else {
          console.error('Error cargando reservas:', data.error);
          setReservations([]);
        }
      } else {
        console.error('Error en la respuesta de la API');
        setReservations([]);
      }
    } catch (error) {
      console.error('Error cargando reservas:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  // Cargar reservas al montar el componente
  useEffect(() => {
    loadAllReservations();
  }, [loadAllReservations]);

  // Filtrar reservas por fecha seleccionada
  const filteredReservations = reservations.filter(reservation => 
    reservation.date === selectedDate
  );

  // Filtrar por término de búsqueda
  const searchFilteredReservations = filteredReservations.filter(reservation =>
    reservation.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reservation.phone?.includes(searchTerm) ||
    reservation.table?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Hoy';
    } else if (dateStr === tomorrow.toISOString().split('T')[0]) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Gestión de Reservas
        </h2>
        <Button 
          onClick={loadAllReservations}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Selector de fecha */}
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`w-full sm:w-auto ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}`}
          />
        </div>

        {/* Búsqueda */}
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar por cliente, teléfono o mesa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
          />
        </div>
      </div>

      {/* Información del día seleccionado */}
      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>
          {formatDate(selectedDate)}
        </h3>
        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-blue-700'}`}>
          {searchFilteredReservations.length} reserva{searchFilteredReservations.length !== 1 ? 's' : ''} 
          {searchTerm && ` (filtradas de ${filteredReservations.length} total)`}
        </p>
      </div>

      {/* Lista de reservas */}
      {searchFilteredReservations.length === 0 ? (
        <Card className={`p-8 text-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <div className="text-slate-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay reservas para esta fecha</p>
            <p className="text-sm">Selecciona otra fecha o verifica los filtros de búsqueda</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {searchFilteredReservations.map((reservation) => (
            <Card 
              key={reservation.id} 
              className={`p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                {/* Información principal */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Hora */}
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {reservation.time}
                    </span>
                  </div>

                  {/* Cliente */}
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-slate-500" />
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {reservation.clientName}
                    </span>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                      ({reservation.partySize} {reservation.partySize === 1 ? 'persona' : 'personas'})
                    </span>
                  </div>

                  {/* Mesa */}
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                      Mesa {reservation.table}
                    </span>
                  </div>
                </div>

                {/* Información secundaria */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  {/* Teléfono */}
                  {reservation.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                        {reservation.phone}
                      </span>
                    </div>
                  )}

                  {/* Estado */}
                  <Badge className={`${getStatusColor(reservation.status)} text-white`}>
                    {getStatusText(reservation.status)}
                  </Badge>
                </div>
              </div>

              {/* Notas */}
              {reservation.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className={`text-sm italic ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                    {reservation.notes}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
