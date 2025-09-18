'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { addUserMappingWithUsername } from '@/lib/userMapping';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Wand2,
  Users,
  MapPin,
  CheckCircle,
  ArrowRight,
  Copy,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface TableSpec {
  capacity: number;
  count: number;
}

interface LocationSpec {
  name: string;
  tables: TableSpec[];
}

export default function CreateRestaurantPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Datos del restaurante
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    twilioNumber: ''
  });

  // Configuración de mesas
  const [locations, setLocations] = useState<LocationSpec[]>([
    { name: 'Comedor 1', tables: [{ capacity: 2, count: 2 }, { capacity: 4, count: 4 }, { capacity: 6, count: 2 }] },
    { name: 'Comedor 2', tables: [{ capacity: 4, count: 3 }, { capacity: 8, count: 2 }] },
    { name: 'Terraza', tables: [{ capacity: 4, count: 4 }, { capacity: 6, count: 2 }] }
  ]);

  // Credenciales generadas
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string;
    email: string;
    password: string;
    restaurantName: string;
    configCode: string;
  } | null>(null);

  // Plantillas predefinidas
  const templates = {
    'Restaurante Pequeño': [
      { name: 'Comedor Principal', tables: [{ capacity: 2, count: 4 }, { capacity: 4, count: 6 }] },
      { name: 'Terraza', tables: [{ capacity: 2, count: 3 }, { capacity: 4, count: 4 }] }
    ],
    'Restaurante Mediano': [
      { name: 'Comedor 1', tables: [{ capacity: 2, count: 3 }, { capacity: 4, count: 6 }, { capacity: 6, count: 3 }] },
      { name: 'Comedor 2', tables: [{ capacity: 4, count: 4 }, { capacity: 8, count: 2 }] },
      { name: 'Terraza', tables: [{ capacity: 4, count: 6 }, { capacity: 6, count: 3 }] }
    ],
    'Restaurante Grande': [
      { name: 'Comedor 1', tables: [{ capacity: 2, count: 4 }, { capacity: 4, count: 8 }, { capacity: 6, count: 4 }] },
      { name: 'Comedor 2', tables: [{ capacity: 4, count: 6 }, { capacity: 8, count: 4 }] },
      { name: 'Terraza', tables: [{ capacity: 4, count: 8 }, { capacity: 6, count: 4 }, { capacity: 10, count: 2 }] },
      { name: 'Salón Privado', tables: [{ capacity: 12, count: 2 }, { capacity: 15, count: 1 }] }
    ]
  };

  const applyTemplate = (templateKey: string) => {
    setLocations(templates[templateKey as keyof typeof templates]);
    toast.success(`Plantilla "${templateKey}" aplicada`);
  };

  const addLocation = () => {
    setLocations([...locations, { name: '', tables: [{ capacity: 2, count: 1 }] }]);
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const updateLocationName = (index: number, name: string) => {
    const newLocations = [...locations];
    newLocations[index].name = name;
    setLocations(newLocations);
  };

  const addTableSpec = (locationIndex: number) => {
    const newLocations = [...locations];
    newLocations[locationIndex].tables.push({ capacity: 2, count: 1 });
    setLocations(newLocations);
  };

  const removeTableSpec = (locationIndex: number, tableIndex: number) => {
    const newLocations = [...locations];
    newLocations[locationIndex].tables.splice(tableIndex, 1);
    setLocations(newLocations);
  };

  const updateTableSpec = (locationIndex: number, tableIndex: number, field: 'capacity' | 'count', value: number) => {
    const newLocations = [...locations];
    newLocations[locationIndex].tables[tableIndex][field] = value;
    setLocations(newLocations);
  };

  const generateTables = () => {
    const tables: any[] = [];
    let tableCounter = 1;

    locations.forEach((location, locationIndex) => {
      if (!location.name.trim()) return;

      let positionX = 1;
      let positionY = 1;
      const maxTablesPerRow = 4;

      location.tables.forEach((tableSpec) => {
        for (let i = 0; i < tableSpec.count; i++) {
          const locationPrefix = location.name.replace(/\s+/g, '').substring(0, 2).toUpperCase();
          const tableId = `${locationPrefix}-${tableCounter}`;
          const tableName = `${locationPrefix}-${tableCounter}`;
          
          tables.push({
            id: tableId,
            name: tableName,
            capacity: tableSpec.capacity,
            location: location.name,
            position: { x: positionX, y: positionY },
            notes: generateTableNotes(tableSpec.capacity, location.name)
          });

          positionX++;
          if (positionX > maxTablesPerRow) {
            positionX = 1;
            positionY++;
          }
          tableCounter++;
        }
      });
    });

    return tables;
  };

  const generateTableNotes = (capacity: number, location: string) => {
    const capacityNotes = {
      1: 'Mesa individual',
      2: 'Mesa romántica',
      4: 'Mesa familiar',
      6: 'Mesa para grupos',
      8: 'Mesa grande',
      10: 'Mesa para eventos',
      12: 'Mesa para grandes eventos',
      15: 'Mesa para banquetes'
    };

    const locationNotes = {
      'Terraza': 'con vista exterior',
      'Comedor 1': 'interior principal',
      'Comedor 2': 'interior secundario',
      'Salón Principal': 'salón principal',
      'Salón Privado': 'salón privado'
    };

    const capacityNote = capacityNotes[capacity as keyof typeof capacityNotes] || `Mesa para ${capacity} personas`;
    const locationNote = locationNotes[location as keyof typeof locationNotes] || 'interior';

    return `${capacityNote} ${locationNote}`.trim();
  };

  const getTotalTables = () => {
    return locations.reduce((total, location) => {
      return total + location.tables.reduce((sum, table) => sum + table.count, 0);
    }, 0);
  };

  const getTotalCapacity = () => {
    return locations.reduce((total, location) => {
      return total + location.tables.reduce((sum, table) => sum + (table.capacity * table.count), 0);
    }, 0);
  };

  const generateConfigCode = () => {
    const restaurantId = restaurantData.name.toLowerCase().replace(/\s+/g, '_') + '_001';
    const locationsList = locations.map(loc => `'${loc.name}'`).join(', ');
    const tables = generateTables();
    
    return `export const ${restaurantId.replace(/_/g, '')}Config: RestaurantLayout = {
  restaurantId: '${restaurantId}',
  restaurantName: '${restaurantData.name}',
  locations: [${locationsList}],
  tables: [
${tables.map(table => `    { id: '${table.id}', name: '${table.name}', capacity: ${table.capacity}, location: '${table.location}', position: { x: ${table.position.x}, y: ${table.position.y} }, notes: '${table.notes}' }`).join(',\n')}
  ]
};`;
  };

  const generateRetellConfig = () => {
    const restaurantId = restaurantData.name.toLowerCase().replace(/\s+/g, '_') + '_001';
    const locationsList = locations.map(loc => loc.name);
    
    return `// Configuración de Retell AI para ${restaurantData.name}
export const retellConfig = {
  agentId: 'agent_${restaurantId}',
  restaurantId: '${restaurantId}',
  restaurantName: '${restaurantData.name}',
  locations: [${locationsList.map(loc => `'${loc}'`).join(', ')}],
  voiceId: 'es-ES-ElviraNeural',
  language: 'es-ES',
  webhookUrl: 'https://tu-dominio.com/api/retell/webhook',
  apiEndpoints: {
    tables: 'GET /api/retell/tables?restaurantId=${restaurantId}',
    availability: 'GET /api/retell/reservations?restaurantId=${restaurantId}&date=YYYY-MM-DD&time=HH:MM&people=N',
    createReservation: 'POST /api/retell/reservations'
  }
};

// Prompt del agente con ubicaciones específicas
export const agentPrompt = \`Eres el agente de voz de ${restaurantData.name}.

UBICACIONES DISPONIBLES:
${locationsList.map(loc => `- ${loc}: ${getLocationDescription(loc)}`).join('\n')}

IMPORTANTE:
- Solo menciona las ubicaciones: ${locationsList.join(', ')}
- NUNCA menciones números específicos de mesa
- El sistema asigna automáticamente la mesa específica\`;`;
  };

  const getLocationDescription = (location: string): string => {
    const descriptions: Record<string, string> = {
      'Terraza': 'Área al aire libre con vista exterior, perfecta para cenas románticas y grupos',
      'Comedor 1': 'Salón principal interior, ambiente elegante y acogedor',
      'Comedor 2': 'Salón secundario interior, ideal para grupos y celebraciones',
      'Salón Principal': 'Salón principal del restaurante, ambiente elegante',
      'Salón Privado': 'Salón privado para eventos especiales y grupos grandes',
      'Barra': 'Área de barra, perfecta para comidas informales',
      'Patio': 'Patio interior con ambiente relajado',
      'Jardín': 'Jardín exterior con ambiente natural'
    };
    
    return descriptions[location] || `Área ${location.toLowerCase()}`;
  };

  const handleCreateRestaurant = async () => {
    setIsLoading(true);

    try {
      // 1. Generar credenciales
      const username = restaurantData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);
      const tempPassword = 'Temp' + Math.random().toString(36).substring(2, 8) + '!';

      // 2. Crear usuario en Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        restaurantData.email,
        tempPassword
      );

      // 3. Agregar al mapeo de usuarios
      const newUserMapping = {
        username,
        email: restaurantData.email,
        role: 'restaurant' as const,
        restaurantId: userCredential.user.uid,
        restaurantName: restaurantData.name,
        restaurantType: 'Restaurante Tradicional',
        airtableBaseId: `app${username}${Date.now()}`,
        airtableUrl: `https://airtable.com/embed/app${username}${Date.now()}/tblReservas?backgroundColor=orange&view=viwReservasHoy`,
        retellConfig: {
          agentId: `agent_${username}_${Date.now()}`,
          apiKey: `retell_key_${username}_${Math.random().toString(36).substring(2, 8)}`,
          voiceId: 'es-ES-ElviraNeural',
          language: 'es-ES'
        },
        twilioConfig: {
          accountSid: `AC_${username}_${Date.now()}`,
          authToken: `auth_${username}_${Math.random().toString(36).substring(2, 8)}`,
          phoneNumber: restaurantData.twilioNumber,
          whatsappNumber: restaurantData.twilioNumber
        }
      };

      addUserMappingWithUsername(newUserMapping);

      // 4. Generar código de configuración
      const configCode = generateConfigCode();
      
      // 5. Generar configuración de Retell
      const retellConfig = generateRetellConfig();

      // 6. Mostrar credenciales
      setGeneratedCredentials({
        username,
        email: restaurantData.email,
        password: tempPassword,
        restaurantName: restaurantData.name,
        configCode: configCode + '\n\n' + retellConfig
      });

      setStep(3);
      toast.success('✅ Restaurante creado exitosamente');

    } catch (error: any) {
      console.error('Error al crear restaurante:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Este email ya está registrado');
      } else {
        toast.error(error.message || 'Error al crear restaurante');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Crear Restaurante Completo</h1>
          <p className="text-gray-600 mt-2">
            Crea un restaurante con sus mesas y genera credenciales automáticamente
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="font-medium">Datos del Restaurante</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="font-medium">Configurar Mesas</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="font-medium">Credenciales</span>
            </div>
          </div>
        </div>

        {/* Step 1: Datos del Restaurante */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Información del Restaurante</CardTitle>
              <CardDescription>
                Completa los datos básicos del restaurante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Restaurante</Label>
                  <Input
                    id="name"
                    value={restaurantData.name}
                    onChange={(e) => setRestaurantData({ ...restaurantData, name: e.target.value })}
                    placeholder="Ej: Restaurante El Buen Sabor"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email del Administrador</Label>
                  <Input
                    id="email"
                    type="email"
                    value={restaurantData.email}
                    onChange={(e) => setRestaurantData({ ...restaurantData, email: e.target.value })}
                    placeholder="admin@restaurante.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono del Restaurante</Label>
                  <Input
                    id="phone"
                    value={restaurantData.phone}
                    onChange={(e) => setRestaurantData({ ...restaurantData, phone: e.target.value })}
                    placeholder="+34 912 345 678"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twilioNumber">Número Twilio</Label>
                  <Input
                    id="twilioNumber"
                    value={restaurantData.twilioNumber}
                    onChange={(e) => setRestaurantData({ ...restaurantData, twilioNumber: e.target.value })}
                    placeholder="+1234567890"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={restaurantData.address}
                  onChange={(e) => setRestaurantData({ ...restaurantData, address: e.target.value })}
                  placeholder="Calle Principal 123, Ciudad"
                  required
                />
              </div>
              <Button 
                onClick={() => setStep(2)} 
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={!restaurantData.name || !restaurantData.email || !restaurantData.phone}
              >
                Siguiente: Configurar Mesas
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Configurar Mesas */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Plantillas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wand2 className="h-5 w-5" />
                  <span>Plantillas Rápidas</span>
                </CardTitle>
                <CardDescription>
                  Selecciona una plantilla para empezar rápidamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(templates).map(([key, template]) => (
                    <Button
                      key={key}
                      variant="outline"
                      onClick={() => applyTemplate(key)}
                      className="h-auto p-4 flex flex-col items-start space-y-2"
                    >
                      <div className="font-semibold">{key}</div>
                      <div className="text-sm text-gray-600">
                        {template.length} ubicaciones, {template.reduce((sum, loc) => sum + loc.tables.reduce((s, t) => s + t.count, 0), 0)} mesas
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Mesas</p>
                      <p className="text-2xl font-bold text-gray-900">{getTotalTables()}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Capacidad Total</p>
                      <p className="text-2xl font-bold text-gray-900">{getTotalCapacity()}</p>
                    </div>
                    <MapPin className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ubicaciones</p>
                      <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configuración de ubicaciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {locations.map((location, locationIndex) => (
                <Card key={locationIndex}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Input
                          value={location.name}
                          onChange={(e) => updateLocationName(locationIndex, e.target.value)}
                          placeholder="Nombre de la ubicación (ej: Comedor 1)"
                          className="text-lg font-semibold"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeLocation(locationIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Especificación de Mesas</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTableSpec(locationIndex)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </div>

                    {location.tables.map((table, tableIndex) => (
                      <div key={tableIndex} className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50">
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600">Capacidad</Label>
                          <Input
                            type="number"
                            value={table.capacity}
                            onChange={(e) => updateTableSpec(locationIndex, tableIndex, 'capacity', parseInt(e.target.value) || 2)}
                            min="1"
                            max="20"
                            className="w-20"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600">Cantidad</Label>
                          <Input
                            type="number"
                            value={table.count}
                            onChange={(e) => updateTableSpec(locationIndex, tableIndex, 'count', parseInt(e.target.value) || 1)}
                            min="1"
                            max="50"
                            className="w-20"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600">Total</Label>
                          <div className="px-3 py-2 bg-white rounded text-sm font-medium border">
                            {table.capacity * table.count} personas
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTableSpec(locationIndex, tableIndex)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {location.tables.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <p>No hay mesas especificadas</p>
                        <p className="text-sm">Haz clic en "Agregar" para empezar</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Botón para agregar ubicación */}
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="flex items-center justify-center h-full min-h-[200px]">
                  <Button
                    variant="outline"
                    onClick={addLocation}
                    className="h-auto p-6 flex flex-col items-center space-y-2"
                  >
                    <Plus className="h-8 w-8" />
                    <span className="font-semibold">Agregar Ubicación</span>
                    <span className="text-sm text-gray-600">Comedor, Terraza, etc.</span>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Anterior
              </Button>
              <Button 
                onClick={handleCreateRestaurant}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                disabled={isLoading || getTotalTables() === 0}
              >
                {isLoading ? 'Creando...' : 'Crear Restaurante'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Credenciales */}
        {step === 3 && generatedCredentials && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Restaurante Creado Exitosamente</span>
              </CardTitle>
              <CardDescription>
                Aquí tienes las credenciales y configuración del restaurante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Credenciales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Credenciales de Acceso</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Usuario (Email)</Label>
                      <div className="flex items-center space-x-2">
                        <Input value={generatedCredentials.email} readOnly className="bg-gray-50" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedCredentials.email)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Contraseña Temporal</Label>
                      <div className="flex items-center space-x-2">
                        <Input value={generatedCredentials.password} readOnly className="bg-gray-50" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedCredentials.password)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nombre del Restaurante</Label>
                      <div className="flex items-center space-x-2">
                        <Input value={generatedCredentials.restaurantName} readOnly className="bg-gray-50" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedCredentials.restaurantName)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Información del Sistema</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">URL de Acceso</p>
                      <p className="text-sm text-blue-600">https://tu-dominio.com/login</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Estado</p>
                      <p className="text-sm text-green-600">Activo y listo para usar</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm font-medium text-orange-800">Total Mesas</p>
                      <p className="text-sm text-orange-600">{getTotalTables()} mesas configuradas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Código de configuración */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Código de Configuración</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedCredentials.configCode)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([generatedCredentials.configCode], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${generatedCredentials.restaurantName.replace(/\s+/g, '_')}_config.ts`;
                        a.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
                <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code>{generatedCredentials.configCode}</code>
                </pre>
              </div>

              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStep(1);
                    setGeneratedCredentials(null);
                    setRestaurantData({ name: '', email: '', phone: '', address: '', twilioNumber: '' });
                    setLocations([
                      { name: 'Comedor 1', tables: [{ capacity: 2, count: 2 }, { capacity: 4, count: 4 }, { capacity: 6, count: 2 }] },
                      { name: 'Comedor 2', tables: [{ capacity: 4, count: 3 }, { capacity: 8, count: 2 }] },
                      { name: 'Terraza', tables: [{ capacity: 4, count: 4 }, { capacity: 6, count: 2 }] }
                    ]);
                  }}
                  className="flex-1"
                >
                  Crear Otro Restaurante
                </Button>
                <Button 
                  onClick={() => router.push('/admin')}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Volver al Admin
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
