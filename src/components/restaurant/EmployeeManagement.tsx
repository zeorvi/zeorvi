'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Employee } from '@/lib/types/restaurant';

interface EmployeeManagementProps {
  restaurantId: string;
  restaurantName: string;
  restaurantType: string;
}

export default function EmployeeManagement({ restaurantId, restaurantName, restaurantType }: EmployeeManagementProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'vacation' | 'sick_leave'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Mock data - en producción vendría de Firebase
  useEffect(() => {
    const mockEmployees: Employee[] = [
      {
        id: 'emp_001',
        firstName: 'María',
        lastName: 'González',
        email: 'maria.gonzalez@restaurant.com',
        phone: '+52-555-0101',
        role: 'manager',
        status: 'active',
        schedule: {
          monday: { start: '08:00', end: '17:00', break: '13:00-14:00', off: false },
          tuesday: { start: '08:00', end: '17:00', break: '13:00-14:00', off: false },
          wednesday: { start: '08:00', end: '17:00', break: '13:00-14:00', off: false },
          thursday: { start: '08:00', end: '17:00', break: '13:00-14:00', off: false },
          friday: { start: '08:00', end: '17:00', break: '13:00-14:00', off: false },
          saturday: { off: true },
          sunday: { off: true }
        },
        salary: {
          type: 'monthly',
          amount: 25000,
          currency: 'MXN'
        },
        performance: {
          rating: 4.8,
          reviews: ['Excelente liderazgo', 'Muy organizada', 'Gran comunicación con el equipo'],
          attendance: 98
        },
        hiredDate: '2023-01-15',
        emergencyContact: {
          name: 'Carlos González',
          phone: '+52-555-0102',
          relationship: 'Esposo'
        }
      },
      {
        id: 'emp_002',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@restaurant.com',
        phone: '+52-555-0201',
        role: 'waiter',
        status: 'active',
        schedule: {
          monday: { start: '14:00', end: '22:00', off: false },
          tuesday: { start: '14:00', end: '22:00', off: false },
          wednesday: { start: '14:00', end: '22:00', off: false },
          thursday: { start: '14:00', end: '22:00', off: false },
          friday: { start: '14:00', end: '23:00', off: false },
          saturday: { start: '14:00', end: '23:00', off: false },
          sunday: { off: true }
        },
        salary: {
          type: 'hourly',
          amount: 85,
          currency: 'MXN'
        },
        performance: {
          rating: 4.5,
          reviews: ['Muy atento con los clientes', 'Rápido en el servicio'],
          attendance: 95
        },
        hiredDate: '2023-03-10',
        emergencyContact: {
          name: 'Ana Pérez',
          phone: '+52-555-0202',
          relationship: 'Madre'
        }
      },
      {
        id: 'emp_003',
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        email: 'carlos.rodriguez@restaurant.com',
        phone: '+52-555-0301',
        role: 'chef',
        status: 'active',
        schedule: {
          monday: { start: '10:00', end: '18:00', break: '15:00-16:00', off: false },
          tuesday: { start: '10:00', end: '18:00', break: '15:00-16:00', off: false },
          wednesday: { start: '10:00', end: '18:00', break: '15:00-16:00', off: false },
          thursday: { start: '10:00', end: '18:00', break: '15:00-16:00', off: false },
          friday: { start: '10:00', end: '20:00', break: '15:00-16:00', off: false },
          saturday: { start: '10:00', end: '20:00', break: '15:00-16:00', off: false },
          sunday: { off: true }
        },
        salary: {
          type: 'monthly',
          amount: 22000,
          currency: 'MXN'
        },
        performance: {
          rating: 4.9,
          reviews: ['Excelente chef', 'Muy creativo', 'Mantiene la cocina impecable'],
          attendance: 97
        },
        hiredDate: '2022-11-20',
        emergencyContact: {
          name: 'Laura Rodríguez',
          phone: '+52-555-0302',
          relationship: 'Esposa'
        }
      },
      {
        id: 'emp_004',
        firstName: 'Ana',
        lastName: 'López',
        email: 'ana.lopez@restaurant.com',
        phone: '+52-555-0401',
        role: 'host',
        status: 'vacation',
        schedule: {
          monday: { start: '12:00', end: '20:00', off: false },
          tuesday: { start: '12:00', end: '20:00', off: false },
          wednesday: { start: '12:00', end: '20:00', off: false },
          thursday: { start: '12:00', end: '20:00', off: false },
          friday: { start: '12:00', end: '21:00', off: false },
          saturday: { start: '12:00', end: '21:00', off: false },
          sunday: { start: '12:00', end: '20:00', off: false }
        },
        salary: {
          type: 'hourly',
          amount: 75,
          currency: 'MXN'
        },
        performance: {
          rating: 4.6,
          reviews: ['Muy amable con los clientes', 'Excelente presentación'],
          attendance: 92
        },
        hiredDate: '2023-05-01',
        emergencyContact: {
          name: 'Miguel López',
          phone: '+52-555-0402',
          relationship: 'Padre'
        }
      },
      {
        id: 'emp_005',
        firstName: 'Luis',
        lastName: 'Martínez',
        email: 'luis.martinez@restaurant.com',
        phone: '+52-555-0501',
        role: 'cleaner',
        status: 'sick_leave',
        schedule: {
          monday: { start: '06:00', end: '14:00', break: '10:00-10:30', off: false },
          tuesday: { start: '06:00', end: '14:00', break: '10:00-10:30', off: false },
          wednesday: { start: '06:00', end: '14:00', break: '10:00-10:30', off: false },
          thursday: { start: '06:00', end: '14:00', break: '10:00-10:30', off: false },
          friday: { start: '06:00', end: '14:00', break: '10:00-10:30', off: false },
          saturday: { start: '07:00', end: '15:00', break: '11:00-11:30', off: false },
          sunday: { off: true }
        },
        salary: {
          type: 'hourly',
          amount: 65,
          currency: 'MXN'
        },
        performance: {
          rating: 4.3,
          reviews: ['Muy responsable', 'Siempre puntual'],
          attendance: 88
        },
        hiredDate: '2023-02-14',
        emergencyContact: {
          name: 'Rosa Martínez',
          phone: '+52-555-0502',
          relationship: 'Esposa'
        }
      }
    ];

    setEmployees(mockEmployees);
    setLoading(false);
  }, [restaurantId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'vacation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sick_leave': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'vacation': return 'Vacaciones';
      case 'sick_leave': return 'Incapacidad';
      default: return status;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager': return '👔';
      case 'waiter': return '🍽️';
      case 'chef': return '👨‍🍳';
      case 'host': return '🙋‍♀️';
      case 'cleaner': return '🧹';
      default: return '👤';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'manager': return 'Gerente';
      case 'waiter': return 'Mesero';
      case 'chef': return 'Chef';
      case 'host': return 'Anfitrión';
      case 'cleaner': return 'Limpieza';
      default: return role;
    }
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTodaySchedule = (employee: Employee) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof Employee['schedule'];
    const schedule = employee.schedule[today];
    
    if (schedule?.off) return 'Día libre';
    if (schedule?.start && schedule?.end) {
      return `${schedule.start} - ${schedule.end}`;
    }
    return 'No programado';
  };

  const isCurrentlyWorking = (employee: Employee) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof Employee['schedule'];
    const schedule = employee.schedule[today];
    
    if (!schedule || schedule.off || !schedule.start || !schedule.end) return false;
    
    const [startHour, startMin] = schedule.start.split(':').map(Number);
    const [endHour, endMin] = schedule.end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    return currentTime >= startTime && currentTime <= endTime && employee.status === 'active';
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesFilter = filter === 'all' || employee.status === filter;
    const matchesSearch = employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || employee.role === selectedRole;
    
    return matchesFilter && matchesSearch && matchesRole;
  });

  const roles = Array.from(new Set(employees.map(emp => emp.role)));
  const activeEmployees = employees.filter(emp => emp.status === 'active');
  const currentlyWorking = employees.filter(emp => isCurrentlyWorking(emp));

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            👥 Gestión de Personal
          </h1>
          <p className="text-gray-600 mt-1">
            Administra el equipo de {restaurantName}
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              ➕ Agregar Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input id="firstName" placeholder="Juan" />
                </div>
                <div>
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input id="lastName" placeholder="Pérez" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="juan@restaurant.com" />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" placeholder="+52-555-0000" />
              </div>
              <div>
                <Label htmlFor="role">Puesto</Label>
                <select id="role" className="w-full p-2 border rounded-md">
                  <option value="waiter">Mesero</option>
                  <option value="chef">Chef</option>
                  <option value="host">Anfitrión</option>
                  <option value="cleaner">Limpieza</option>
                  <option value="manager">Gerente</option>
                </select>
              </div>
              <Button className="w-full">Agregar Empleado</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 text-sm font-medium">Empleados Activos</p>
              <p className="text-3xl font-bold text-green-900">{activeEmployees.length}</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 text-sm font-medium">En Turno Ahora</p>
              <p className="text-3xl font-bold text-blue-900">{currentlyWorking.length}</p>
            </div>
            <div className="text-3xl">⏰</div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 text-sm font-medium">Asistencia Promedio</p>
              <p className="text-3xl font-bold text-purple-900">
                {Math.round(employees.reduce((acc, emp) => acc + emp.performance.attendance, 0) / employees.length)}%
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-700 text-sm font-medium">Rating Promedio</p>
              <p className="text-3xl font-bold text-orange-900">
                {(employees.reduce((acc, emp) => acc + emp.performance.rating, 0) / employees.length).toFixed(1)}
              </p>
            </div>
            <div className="text-3xl">⭐</div>
          </div>
        </Card>
      </div>

      {/* Empleados Trabajando Ahora */}
      {currentlyWorking.length > 0 && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            ⏰ Personal en Turno ({currentlyWorking.length})
          </h3>
          <div className="flex flex-wrap gap-3">
            {currentlyWorking.map(employee => (
              <div key={employee.id} className="flex items-center gap-2 bg-white p-3 rounded-lg">
                <span className="text-xl">{getRoleIcon(employee.role)}</span>
                <div>
                  <span className="font-medium text-blue-900">
                    {employee.firstName} {employee.lastName}
                  </span>
                  <p className="text-sm text-blue-700">{getRoleText(employee.role)}</p>
                </div>
                <div className="ml-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          {['all', 'active', 'vacation', 'sick_leave', 'inactive'].map(status => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status as any)}
            >
              {status === 'all' ? 'Todos' : getStatusText(status)}
            </Button>
          ))}
        </div>
        
        <select 
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="all">Todos los puestos</option>
          {roles.map(role => (
            <option key={role} value={role}>
              {getRoleText(role)}
            </option>
          ))}
        </select>
        
        <Input
          placeholder="Buscar empleados..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Lista de Empleados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map(employee => (
          <Card key={employee.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* Header del empleado */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getRoleIcon(employee.role)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{getRoleText(employee.role)}</p>
                    <p className="text-xs text-gray-400">{employee.email}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={getStatusColor(employee.status)}>
                    {getStatusText(employee.status)}
                  </Badge>
                  {isCurrentlyWorking(employee) && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600">En turno</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de contacto */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Teléfono:</span>
                  <a href={`tel:${employee.phone}`} className="text-blue-600 hover:underline">
                    {employee.phone}
                  </a>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Horario hoy:</span>
                  <span className="text-gray-900 font-medium">
                    {getTodaySchedule(employee)}
                  </span>
                </div>
              </div>

              {/* Información de rendimiento */}
              <div className="space-y-2 text-sm border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Calificación:</span>
                  <div className="flex items-center gap-1">
                    <span className={`font-bold ${getPerformanceColor(employee.performance.rating)}`}>
                      {employee.performance.rating}
                    </span>
                    <span className="text-yellow-500">⭐</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Asistencia:</span>
                  <span className={`font-bold ${employee.performance.attendance >= 95 ? 'text-green-600' : employee.performance.attendance >= 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {employee.performance.attendance}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Salario:</span>
                  <span className="text-gray-900 font-medium">
                    ${employee.salary.amount.toLocaleString()} {employee.salary.type === 'hourly' ? '/hr' : '/mes'}
                  </span>
                </div>
              </div>

              {/* Información adicional */}
              <div className="space-y-2 text-sm border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Contratado:</span>
                  <span className="text-gray-900">
                    {new Date(employee.hiredDate).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Contacto emergencia:</span>
                  <div className="text-right">
                    <p className="text-gray-900 font-medium">{employee.emergencyContact.name}</p>
                    <p className="text-gray-500 text-xs">{employee.emergencyContact.relationship}</p>
                  </div>
                </div>
              </div>

              {/* Últimas reseñas */}
              {employee.performance.reviews.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600 mb-2">Últimas reseñas:</p>
                  <div className="space-y-1">
                    {employee.performance.reviews.slice(0, 2).map((review, index) => (
                      <p key={index} className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                        "{review}"
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="flex-1">
                      ✏️ Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar {employee.firstName} {employee.lastName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Estado</Label>
                        <select className="w-full p-2 border rounded-md" defaultValue={employee.status}>
                          <option value="active">Activo</option>
                          <option value="vacation">Vacaciones</option>
                          <option value="sick_leave">Incapacidad</option>
                          <option value="inactive">Inactivo</option>
                        </select>
                      </div>
                      <div>
                        <Label>Salario</Label>
                        <Input type="number" defaultValue={employee.salary.amount} />
                      </div>
                      <div>
                        <Label>Calificación</Label>
                        <Input type="number" step="0.1" min="1" max="5" defaultValue={employee.performance.rating} />
                      </div>
                      <Button className="w-full">Guardar Cambios</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(`tel:${employee.phone}`)}
                >
                  📞
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No se encontraron empleados
          </h3>
          <p className="text-gray-600">
            Ajusta los filtros o agrega nuevos empleados al equipo.
          </p>
        </Card>
      )}
    </div>
  );
}
