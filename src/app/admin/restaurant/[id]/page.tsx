'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Key, 
  Calendar,
  TrendingUp,
  Clock,
  Users,
  PhoneCall,
  Copy,
  Eye,
  EyeOff,
  Edit,
  Save,
  X,
  UserCheck
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getRestaurantById, updateRestaurantCredentials, updateRestaurantOwnerInfo } from '@/lib/restaurantServicePostgres';


export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [ownerData, setOwnerData] = useState({
    ownerName: '',
    personalPhone: '',
    position: '',
    notes: ''
  });
  const [credentialsData, setCredentialsData] = useState({
    username: '',
    password: ''
  });

  useEffect(() => {
    const loadRestaurantData = async () => {
      if (params.id) {
        const id = params.id as string;
        console.log('🔍 Loading restaurant with ID:', id);
        
        try {
          const data = await getRestaurantById(id);
          console.log('📊 Restaurant data:', data);
          
          if (!data) {
            console.error('❌ Restaurant not found for ID:', id);
            toast.error(`Restaurante no encontrado: ${id}`);
          } else {
            // Inicializar datos del propietario
            setOwnerData({
              ownerName: data.owner_name || '',
              personalPhone: data.phone || '',
              position: data.config?.owner_position || 'Propietario',
              notes: data.config?.owner_notes || ''
            });
            
            // Inicializar datos de credenciales (usar email como username)
            setCredentialsData({
              username: data.owner_email,
              password: 'restaurante123' // Contraseña por defecto
            });
          }
          
          setRestaurantData(data);
        } catch (error) {
          console.error('❌ Error loading restaurant:', error);
          toast.error('Error al cargar los datos del restaurante');
        }
      }
    };

    loadRestaurantData();
  }, [params.id]);

  const handleBack = () => {
    router.push('/admin');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const handleSaveOwnerInfo = async () => {
    if (!restaurantData?.id) {
      toast.error('Error: ID de restaurante no encontrado');
      return;
    }

    try {
      console.log('💾 Saving owner info:', ownerData);
      
      // Actualizar en PostgreSQL
      const success = await updateRestaurantOwnerInfo(restaurantData.id, ownerData);
      
      if (success) {
        // Actualizar datos locales
        setRestaurantData({
          ...restaurantData,
          owner_name: ownerData.ownerName,
          phone: ownerData.personalPhone,
          config: {
            ...restaurantData.config,
            owner_position: ownerData.position,
            owner_notes: ownerData.notes
          }
        });
        
        setIsEditingOwner(false);
        toast.success('✅ Información del propietario guardada');
      }
    } catch (error) {
      console.error('❌ Error saving owner info:', error);
      toast.error('Error al guardar la información del propietario');
    }
  };

  const handleCancelEdit = () => {
    // Restaurar datos originales
    setOwnerData({
      ownerName: restaurantData.owner_name || '',
      personalPhone: restaurantData.phone || '',
      position: restaurantData.config?.owner_position || 'Propietario',
      notes: restaurantData.config?.owner_notes || ''
    });
    setIsEditingOwner(false);
  };

  const handleSaveCredentials = async () => {
    if (!restaurantData?.id) {
      toast.error('Error: ID de restaurante no encontrado');
      return;
    }

    // Validar que el username tenga al menos 3 caracteres
    if (credentialsData.username.length < 3) {
      toast.error('❌ El username debe tener al menos 3 caracteres');
      return;
    }

    // Validar que la contraseña no esté vacía
    if (!credentialsData.password || credentialsData.password.trim() === '') {
      toast.error('❌ La contraseña no puede estar vacía');
      return;
    }

    try {
      console.log('💾 Saving credentials:', credentialsData);
      
      // Actualizar en PostgreSQL
      const success = await updateRestaurantCredentials(restaurantData.id, credentialsData);
      
      if (success) {
        // Actualizar datos locales
        setRestaurantData({
          ...restaurantData,
          owner_email: credentialsData.username
        });
        
        setIsEditingCredentials(false);
        toast.success('✅ Credenciales actualizadas correctamente');
      }
    } catch (error) {
      console.error('❌ Error saving credentials:', error);
      
      // Mostrar mensaje de error más específico
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('caracteres')) {
        toast.error('❌ El username debe tener al menos 3 caracteres');
      } else if (errorMessage.includes('requeridos')) {
        toast.error('❌ Username y contraseña son requeridos');
      } else {
        toast.error('❌ Error al guardar las credenciales: ' + errorMessage);
      }
    }
  };

  const handleCancelCredentialsEdit = () => {
    // Restaurar datos originales
    setCredentialsData({
      username: restaurantData.owner_email,
      password: 'restaurante123'
    });
    setIsEditingCredentials(false);
  };

  if (!restaurantData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-300">Cargando detalles del restaurante...</p>
          <p className="text-gray-400 text-sm mt-2">ID: {params.id}</p>
          <Button
            variant="outline"
            onClick={() => router.push('/admin')}
            className="mt-4 bg-transparent border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Button
                variant="outline"
                onClick={handleBack}
                className="bg-transparent border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400 flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver al Panel Admin</span>
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {restaurantData.name}
                </h1>
                <p className="text-gray-300 mt-2">Detalles administrativos y estadísticas</p>
              </div>
              <Badge className={`${restaurantData.status === 'active' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                {restaurantData.status === 'active' ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            
            {/* Información Básica */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <Card className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-blue-400/30 shadow-2xl shadow-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-white text-xl font-bold flex items-center space-x-2">
                    <User className="h-5 w-5 text-blue-400" />
                    <span>Información del Restaurante</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-300">Email:</span>
                      <span className="text-white font-medium">{restaurantData.owner_email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-300">Teléfono:</span>
                      <span className="text-white font-medium">{restaurantData.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-300">Dirección:</span>
                      <span className="text-white font-medium">{restaurantData.address}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span className="text-gray-300">Creado:</span>
                      <span className="text-white font-medium">{new Date(restaurantData.created_at).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Credenciales de Acceso */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <Card className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-purple-400/30 shadow-2xl shadow-purple-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-xl font-bold flex items-center space-x-2">
                      <Key className="h-5 w-5 text-purple-400" />
                      <span>Credenciales de Acceso</span>
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => isEditingCredentials ? handleCancelCredentialsEdit() : setIsEditingCredentials(true)}
                      className="bg-transparent border-purple-400/50 text-purple-300 hover:bg-purple-400/20 hover:border-purple-400"
                    >
                      {isEditingCredentials ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </>
                      )}
                    </Button>
                  </div>
                  <CardDescription className="text-gray-300">
                    Usuario y contraseña para acceder al sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditingCredentials ? (
                    // Modo edición
                    <div className="space-y-4">
                      <div>
                        <Label className="text-purple-300 font-medium">Usuario</Label>
                        <Input
                          type="text"
                          value={credentialsData.username}
                          onChange={(e) => setCredentialsData({...credentialsData, username: e.target.value})}
                          placeholder="nombre_usuario"
                          className={`bg-slate-700/50 border-purple-400/30 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400/20 mt-1 ${
                            credentialsData.username && credentialsData.username.length < 3
                              ? 'border-red-400 focus:border-red-400'
                              : ''
                          }`}
                        />
                        {credentialsData.username && credentialsData.username.length < 3 && (
                          <p className="text-red-400 text-sm mt-1">
                            ⚠️ El username debe tener al menos 3 caracteres
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-purple-300 font-medium">Contraseña</Label>
                        <Input
                          type="password"
                          value={credentialsData.password}
                          onChange={(e) => setCredentialsData({...credentialsData, password: e.target.value})}
                          placeholder="Nueva contraseña"
                          className="bg-slate-700/50 border-purple-400/30 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400/20 mt-1"
                        />
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          onClick={handleSaveCredentials}
                          disabled={!credentialsData.username || !credentialsData.password || credentialsData.username.length < 3}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Cambios
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelCredentialsEdit}
                          className="bg-transparent border-red-400/50 text-red-300 hover:bg-red-400/20 hover:border-red-400"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Modo visualización
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-purple-300 font-medium">Usuario</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex-1 px-3 py-2 bg-slate-700/50 border border-purple-400/30 rounded text-white font-mono">
                            {credentialsData.username || 'No configurado'}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(credentialsData.username || '', 'Usuario')}
                            className="bg-transparent border-purple-400/50 text-purple-300 hover:bg-purple-400/20"
                            disabled={!credentialsData.username}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm text-purple-300 font-medium">Contraseña</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex-1 px-3 py-2 bg-slate-700/50 border border-purple-400/30 rounded text-white font-mono">
                            {credentialsData.password 
                              ? (showPassword ? credentialsData.password : '••••••••••')
                              : 'No configurado'
                            }
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                            className="bg-transparent border-purple-400/50 text-purple-300 hover:bg-purple-400/20"
                            disabled={!credentialsData.password}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(credentialsData.password || '', 'Contraseña')}
                            className="bg-transparent border-purple-400/50 text-purple-300 hover:bg-purple-400/20"
                            disabled={!credentialsData.password}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-purple-400/20">
                        <div className="flex items-center space-x-3">
                          <Clock className="h-4 w-4 text-purple-400" />
                          <span className="text-gray-300">Último acceso:</span>
                          <span className="text-white font-medium">
                            Nunca
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Información del Propietario */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <Card className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-yellow-400/30 shadow-2xl shadow-yellow-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-xl font-bold flex items-center space-x-2">
                      <UserCheck className="h-5 w-5 text-yellow-400" />
                      <span>Información del Propietario</span>
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => isEditingOwner ? handleCancelEdit() : setIsEditingOwner(true)}
                      className="bg-transparent border-yellow-400/50 text-yellow-300 hover:bg-yellow-400/20 hover:border-yellow-400"
                    >
                      {isEditingOwner ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </>
                      )}
                    </Button>
                  </div>
                  <CardDescription className="text-gray-300">
                    Datos de contacto del propietario o encargado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditingOwner ? (
                    // Modo edición
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-yellow-300 font-medium">Nombre del propietario</Label>
                          <Input
                            value={ownerData.ownerName}
                            onChange={(e) => setOwnerData({...ownerData, ownerName: e.target.value})}
                            placeholder="Nombre completo"
                            className="bg-slate-700/50 border-yellow-400/30 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20"
                          />
                        </div>
                        <div>
                          <Label className="text-yellow-300 font-medium">Teléfono personal</Label>
                          <Input
                            value={ownerData.personalPhone}
                            onChange={(e) => setOwnerData({...ownerData, personalPhone: e.target.value})}
                            placeholder="+34 666 123 456"
                            className="bg-slate-700/50 border-yellow-400/30 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-yellow-300 font-medium">Cargo/Posición</Label>
                        <Input
                          value={ownerData.position}
                          onChange={(e) => setOwnerData({...ownerData, position: e.target.value})}
                          placeholder="Ej: Propietario y Chef"
                          className="bg-slate-700/50 border-yellow-400/30 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20"
                        />
                      </div>
                      <div>
                        <Label className="text-yellow-300 font-medium">Notas adicionales</Label>
                        <textarea
                          value={ownerData.notes}
                          onChange={(e) => setOwnerData({...ownerData, notes: e.target.value})}
                          placeholder="Horarios de disponibilidad, especialidades, etc."
                          className="w-full bg-slate-700/50 border border-yellow-400/30 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-yellow-400/20 rounded-md px-3 py-2 resize-none"
                          rows={3}
                        />
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          onClick={handleSaveOwnerInfo}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Cambios
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="bg-transparent border-red-400/50 text-red-300 hover:bg-red-400/20 hover:border-red-400"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Modo visualización
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <User className="h-4 w-4 text-yellow-400" />
                          <span className="text-gray-300">Propietario:</span>
                          <span className="text-white font-medium">{ownerData.ownerName || 'No especificado'}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Phone className="h-4 w-4 text-yellow-400" />
                          <span className="text-gray-300">Teléfono personal:</span>
                          <span className="text-white font-medium">{ownerData.personalPhone || 'No especificado'}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <UserCheck className="h-4 w-4 text-yellow-400" />
                        <span className="text-gray-300">Cargo:</span>
                        <span className="text-white font-medium">{ownerData.position || 'No especificado'}</span>
                      </div>
                      {ownerData.notes && (
                        <div className="p-3 bg-slate-700/30 rounded-lg border border-yellow-400/20">
                          <span className="text-yellow-300 font-medium text-sm">Notas:</span>
                          <p className="text-gray-300 mt-1">{ownerData.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Estadísticas de Llamadas */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <Card className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-green-400/30 shadow-2xl shadow-green-500/20">
                <CardHeader>
                  <CardTitle className="text-white text-xl font-bold flex items-center space-x-2">
                    <PhoneCall className="h-5 w-5 text-green-400" />
                    <span>Estadísticas de Llamadas</span>
                  </CardTitle>
                  <CardDescription className="text-gray-300">Resumen semanal de actividad telefónica</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {restaurantData.callStats ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-slate-700/30 rounded-lg border border-green-400/20">
                          <div className="text-2xl font-bold text-green-400">{restaurantData.callStats.thisWeek}</div>
                          <div className="text-sm text-gray-300">Esta semana</div>
                        </div>
                        <div className="text-center p-3 bg-slate-700/30 rounded-lg border border-green-400/20">
                          <div className="text-2xl font-bold text-white">{restaurantData.callStats.lastWeek}</div>
                          <div className="text-sm text-gray-300">Semana anterior</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Promedio por día:</span>
                          <span className="text-white font-semibold">{restaurantData.callStats.avgPerDay}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Hora pico:</span>
                          <span className="text-white font-semibold">{restaurantData.callStats.peakHour}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Tasa de éxito:</span>
                          <Badge className="bg-green-500 text-white">{restaurantData.callStats.successRate}%</Badge>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-green-400/20">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-green-400" />
                          <span className="text-green-400 font-medium">
                            +{((restaurantData.callStats.thisWeek - restaurantData.callStats.lastWeek) / restaurantData.callStats.lastWeek * 100).toFixed(1)}% vs semana anterior
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">📊 Sin datos de llamadas</div>
                      <p className="text-sm text-gray-500">Las estadísticas aparecerán una vez que el sistema esté en funcionamiento</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Información de Clientes */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <Card className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-orange-400/30 shadow-2xl shadow-orange-500/20">
                <CardHeader>
                  <CardTitle className="text-white text-xl font-bold flex items-center space-x-2">
                    <Users className="h-5 w-5 text-orange-400" />
                    <span>Información de Clientes</span>
                  </CardTitle>
                  <CardDescription className="text-gray-300">Datos de la base de clientes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {restaurantData.clientInfo ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-slate-700/30 rounded-lg border border-orange-400/20">
                          <div className="text-2xl font-bold text-orange-400">{restaurantData.clientInfo.totalClients}</div>
                          <div className="text-sm text-gray-300">Total clientes</div>
                        </div>
                        <div className="text-center p-3 bg-slate-700/30 rounded-lg border border-orange-400/20">
                          <div className="text-2xl font-bold text-white">{restaurantData.clientInfo.newThisWeek}</div>
                          <div className="text-sm text-gray-300">Nuevos esta semana</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Clientes recurrentes:</span>
                          <span className="text-white font-semibold">{restaurantData.clientInfo.returningClients}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Tamaño promedio reserva:</span>
                          <span className="text-white font-semibold">{restaurantData.clientInfo.avgReservationSize} personas</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">👥 Sin datos de clientes</div>
                      <p className="text-sm text-gray-500">Los datos de clientes se irán acumulando con el uso del sistema</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mesas Configuradas */}
          <div className="mt-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <Card className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-cyan-400/30 shadow-2xl shadow-cyan-500/20">
                <CardHeader>
                  <CardTitle className="text-white text-xl font-bold">Mesas Gestionadas por Llamada</CardTitle>
                  <CardDescription className="text-gray-300">Configuración actual de mesas disponibles para reservas telefónicas</CardDescription>
                </CardHeader>
                <CardContent>
                  {restaurantData.tables && restaurantData.tables.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {restaurantData.tables.map((table: any, index: number) => (
                        <div key={index} className="p-3 bg-slate-700/30 rounded-lg border border-cyan-400/20 text-center">
                          <div className="text-cyan-400 font-semibold">{table.name}</div>
                          <div className="text-white text-sm">{table.capacity} personas</div>
                          <div className="text-gray-400 text-xs">{table.location}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">🪑 Sin mesas configuradas</div>
                      <p className="text-sm text-gray-500">Las mesas se configurarán según las especificaciones del restaurante</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
