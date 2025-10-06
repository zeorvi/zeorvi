'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/lib/auth';
import { addUserMappingWithUsername } from '@/lib/userMapping';
import { createRestaurant } from '@/lib/restaurantServicePostgres';
import { generateAgentPromptForRestaurant } from '@/lib/retellConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge'; // Unused
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

interface IndividualTable {
  name: string; // "Mesa 1", "Mesa 8", etc.
  capacity: number;
  // Solo creamos mesas gestionadas por llamada
}

interface GeneratedTable {
  id: string;
  name: string;
  capacity: number;
  location: string;
  position: { x: number; y: number };
  notes: string;
  // Todas las mesas son gestionadas por llamada
}

interface LocationSpec {
  name: string;
  tables: IndividualTable[];
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
    twilioNumber: '',
    // Configuración específica para el prompt
    horarioLunesJueves: '12:00 - 23:00',
    horarioViernesSabado: '12:00 - 00:00',
    horarioDomingo: '12:00 - 22:00',
    ubicaciones: ['Comedor Principal', 'Terraza', 'Salón Privado'],
    descripcionUbicaciones: {
      'Comedor Principal': 'Área principal del restaurante',
      'Terraza': 'Área al aire libre',
      'Salón Privado': 'Área privada para eventos especiales'
    }
  });

  // Configuración de mesas (solo las que se gestionan por llamada)
  const [locations, setLocations] = useState<LocationSpec[]>([
    { 
      name: 'Comedor 1', 
      tables: [
        { name: 'Mesa 1', capacity: 4 },
        { name: 'Mesa 2', capacity: 2 },
        { name: 'Mesa 6', capacity: 6 }
      ] 
    },
    { 
      name: 'Terraza', 
      tables: [
        { name: 'Mesa 8', capacity: 4 },
        { name: 'Mesa 10', capacity: 4 }
      ] 
    }
  ]);

  // Credenciales generadas
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string;
    email: string;
    password: string;
    restaurantName: string;
    configCode: string;
  } | null>(null);

  // Plantillas predefinidas (solo mesas por llamada)
  const templates = {
    'Restaurante Pequeño': [
      { name: 'Comedor Principal', tables: [
        { name: 'Mesa 1', capacity: 2 },
        { name: 'Mesa 2', capacity: 4 },
        { name: 'Mesa 4', capacity: 4 }
      ]},
      { name: 'Terraza', tables: [
        { name: 'Mesa 8', capacity: 4 },
        { name: 'Mesa 10', capacity: 2 }
      ]}
    ],
    'Restaurante Mediano': [
      { name: 'Comedor 1', tables: [
        { name: 'Mesa 1', capacity: 4 },
        { name: 'Mesa 2', capacity: 4 },
        { name: 'Mesa 3', capacity: 6 },
        { name: 'Mesa 5', capacity: 2 }
      ]},
      { name: 'Comedor 2', tables: [
        { name: 'Mesa 10', capacity: 6 },
        { name: 'Mesa 11', capacity: 8 },
        { name: 'Mesa 12', capacity: 4 }
      ]},
      { name: 'Terraza', tables: [
        { name: 'Mesa 20', capacity: 4 },
        { name: 'Mesa 21', capacity: 6 }
      ]}
    ],
    'Restaurante Grande': [
      { name: 'Comedor 1', tables: [
        { name: 'Mesa 1', capacity: 4 },
        { name: 'Mesa 2', capacity: 4 },
        { name: 'Mesa 3', capacity: 6 },
        { name: 'Mesa 4', capacity: 2 },
        { name: 'Mesa 6', capacity: 2 }
      ]},
      { name: 'Comedor 2', tables: [
        { name: 'Mesa 10', capacity: 6 },
        { name: 'Mesa 11', capacity: 8 },
        { name: 'Mesa 12', capacity: 4 },
        { name: 'Mesa 14', capacity: 4 }
      ]},
      { name: 'Terraza', tables: [
        { name: 'Mesa 20', capacity: 4 },
        { name: 'Mesa 21', capacity: 6 },
        { name: 'Mesa 22', capacity: 4 }
      ]},
      { name: 'Salón Privado', tables: [
        { name: 'Mesa 30', capacity: 12 },
        { name: 'Mesa 31', capacity: 15 }
      ]}
    ]
  };

  const applyTemplate = (templateKey: string) => {
    setLocations(templates[templateKey as keyof typeof templates]);
    toast.success(`Plantilla "${templateKey}" aplicada`);
  };

  const addLocation = () => {
    const nextTableNumber = getNextTableNumber();
    setLocations([...locations, { name: '', tables: [{ name: `Mesa ${nextTableNumber}`, capacity: 4 }] }]);
  };

  const removeLocation = (index: number) => {
    setLocations(locations.filter((_, i) => i !== index));
  };

  const updateLocationName = (index: number, name: string) => {
    const newLocations = [...locations];
    newLocations[index].name = name;
    setLocations(newLocations);
  };

  const addTable = (locationIndex: number) => {
    const newLocations = [...locations];
    const nextTableNumber = getNextTableNumber();
    newLocations[locationIndex].tables.push({ 
      name: `Mesa ${nextTableNumber}`, 
      capacity: 4
    });
    setLocations(newLocations);
  };

  const removeTable = (locationIndex: number, tableIndex: number) => {
    const newLocations = [...locations];
    newLocations[locationIndex].tables.splice(tableIndex, 1);
    setLocations(newLocations);
  };

  const updateTable = (locationIndex: number, tableIndex: number, field: 'name' | 'capacity', value: string | number) => {
    const newLocations = [...locations];
    if (field === 'name') {
      newLocations[locationIndex].tables[tableIndex].name = value as string;
    } else if (field === 'capacity') {
      newLocations[locationIndex].tables[tableIndex].capacity = value as number;
    }
    setLocations(newLocations);
  };

  // Ya no necesitamos toggle porque todas las mesas son por llamada

  const getNextTableNumber = () => {
    const allTables = locations.flatMap(loc => loc.tables);
    const usedNumbers = allTables
      .map(table => parseInt(table.name.replace('Mesa ', '')))
      .filter(num => !isNaN(num));
    
    let nextNumber = 1;
    while (usedNumbers.includes(nextNumber)) {
      nextNumber++;
    }
    return nextNumber;
  };

  const generateTables = (): GeneratedTable[] => {
    const tables: GeneratedTable[] = [];

    locations.forEach((location) => {
      if (!location.name.trim()) return;

      let positionX = 1;
      let positionY = 1;
      const maxTablesPerRow = 4;

      location.tables.forEach((table) => {
        tables.push({
          id: table.name.toLowerCase().replace(/\s+/g, '_'),
          name: table.name,
          capacity: table.capacity,
          location: location.name,
          position: { x: positionX, y: positionY },
          notes: generateTableNotes(table.capacity, location.name)
        });

        positionX++;
        if (positionX > maxTablesPerRow) {
          positionX = 1;
          positionY++;
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
    console.log('🔍 Debug getTotalTables:', locations);
    const total = locations.reduce((total, location) => {
      const locationTables = location.tables.length;
      console.log(`📍 ${location.name}: ${locationTables} mesas`);
      return total + locationTables;
    }, 0);
    console.log('🎯 Total final:', total);
    return total;
  };

  const getTotalCapacity = () => {
    return locations.reduce((total, location) => {
      return total + location.tables.reduce((sum, table) => sum + table.capacity, 0);
    }, 0);
  };

  // Función removida - no se usa

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

      // 2. Crear usuario en nuestro sistema
      const registerResult = await authService.register({
        email: restaurantData.email,
        password: tempPassword,
        name: restaurantData.name,
        role: 'restaurant',
        restaurantId: undefined // Se asignará después de crear el restaurante      
      });

      if (!registerResult.user) {
        throw new Error('Failed to create user');
      }

      // 3. Agregar al mapeo de usuarios
      const newUserMapping = {
        username,
        email: restaurantData.email,
        role: 'restaurant' as const,
        restaurantId: registerResult.user.id,
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

      // 4. Generar mesas configuradas
      const generatedTables = generateTables();
      console.log('🪑 Generated tables for restaurant:', generatedTables);
      
      // 5. Guardar restaurante en la base de datos usando la nueva API
      const restaurantResponse = await fetch('/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: restaurantData.name,
          slug: username,
          owner_email: restaurantData.email,
          owner_name: restaurantData.name,
          phone: restaurantData.phone,
          address: restaurantData.address,
          city: 'Ciudad',
          country: 'España',
          config: {
            theme: 'modern',
            features: ['reservations', 'tables', 'menu', 'analytics']
          },
          plan: 'premium',
          retell_config: newUserMapping.retellConfig,
          twilio_config: newUserMapping.twilioConfig,
          admin_email: restaurantData.email,
          admin_password: tempPassword,
          admin_name: restaurantData.name
        })
      });

      if (!restaurantResponse.ok) {
        const errorData = await restaurantResponse.json();
        throw new Error(errorData.error || 'Error al crear el restaurante');
      }

      const restaurantResult = await restaurantResponse.json();
      console.log('✅ Restaurante creado:', restaurantResult);

      // 6. Generar código de configuración
      const configCode = generateConfigCode();
      
      // 7. Generar configuración de Retell con prompt personalizado
      const retellConfig = generateRetellConfig();
      
      // 8. Generar prompt personalizado usando la configuración específica
      const promptPersonalizado = generateAgentPromptForRestaurant(
        restaurantData.name, 
        'Restaurante Tradicional', 
        {
          restaurantId: restaurantResult.restaurant.id,
          horarioLunesJueves: restaurantData.horarioLunesJueves,
          horarioViernesSabado: restaurantData.horarioViernesSabado,
          horarioDomingo: restaurantData.horarioDomingo,
          ubicaciones: restaurantData.ubicaciones,
          descripcionUbicaciones: restaurantData.descripcionUbicaciones
        }
      );

      // 9. Mostrar credenciales con prompt personalizado
      setGeneratedCredentials({
        username,
        email: restaurantData.email,
        password: tempPassword,
        restaurantName: restaurantData.name,
        configCode: configCode + '\n\n' + retellConfig + '\n\n' + '// PROMPT PERSONALIZADO:\n' + promptPersonalizado
      });

      setStep(3);
      toast.success('✅ Restaurante creado exitosamente');
      
      // Mostrar mensaje de que el dashboard está listo
      setTimeout(() => {
        toast.success('🎉 Dashboard del restaurante está listo para usar');
      }, 1500);

    } catch (error: unknown) {
      console.error('Error al crear restaurante:', error);
      if (error instanceof Error) {
        if ('code' in error && error.code === 'auth/email-already-in-use') {
          toast.error('Este email ya está registrado');
        } else {
          toast.error(error.message || 'Error al crear restaurante');
        }
      } else {
        toast.error('Error al crear restaurante');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin')}
              className="bg-transparent border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400 flex items-center space-x-2"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              <span>Volver al Panel Admin</span>
            </Button>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Crear Restaurante Completo
          </h1>
          <p className="text-gray-300 mt-2">
            Crea un restaurante con sus mesas y genera credenciales automáticamente
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-cyan-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                1
              </div>
              <span className="font-medium">Datos del Restaurante</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-500" />
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-cyan-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                2
              </div>
              <span className="font-medium">Configurar Mesas</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-500" />
            <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-cyan-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                3
              </div>
              <span className="font-medium">Credenciales</span>
            </div>
          </div>
        </div>

        {/* Step 1: Datos del Restaurante */}
        {step === 1 && (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <Card className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-cyan-400/30 shadow-2xl shadow-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white text-xl font-bold">Información del Restaurante</CardTitle>
                <CardDescription className="text-gray-300">
                  Completa los datos básicos del restaurante
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-cyan-300 font-medium">Nombre del Restaurante</Label>
                  <Input
                    id="name"
                    value={restaurantData.name}
                    onChange={(e) => setRestaurantData({ ...restaurantData, name: e.target.value })}
                    placeholder="Ej: Restaurante El Buen Sabor"
                    className="bg-slate-700/50 border-cyan-400/30 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-cyan-300 font-medium">Email del Administrador</Label>
                  <Input
                    id="email"
                    type="email"
                    value={restaurantData.email}
                    onChange={(e) => setRestaurantData({ ...restaurantData, email: e.target.value })}
                    placeholder="admin@restaurante.com"
                    className="bg-slate-700/50 border-cyan-400/30 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-cyan-300 font-medium">Teléfono del Restaurante</Label>
                  <Input
                    id="phone"
                    value={restaurantData.phone}
                    onChange={(e) => setRestaurantData({ ...restaurantData, phone: e.target.value })}
                    placeholder="+34 912 345 678"
                    className="bg-slate-700/50 border-cyan-400/30 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twilioNumber" className="text-cyan-300 font-medium">Número Twilio</Label>
                  <Input
                    id="twilioNumber"
                    value={restaurantData.twilioNumber}
                    onChange={(e) => setRestaurantData({ ...restaurantData, twilioNumber: e.target.value })}
                    placeholder="+1234567890"
                    className="bg-slate-700/50 border-cyan-400/30 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-cyan-300 font-medium">Dirección</Label>
                <Input
                  id="address"
                  value={restaurantData.address}
                  onChange={(e) => setRestaurantData({ ...restaurantData, address: e.target.value })}
                  placeholder="Calle Principal 123, Ciudad"
                  className="bg-slate-700/50 border-cyan-400/30 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                  required
                />
              </div>

              {/* Configuración de Horarios */}
              <div className="border-t border-slate-600 pt-6">
                <h3 className="text-lg font-semibold text-cyan-300 mb-4">🕒 Horarios del Restaurante</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-cyan-300 font-medium">Lunes a Jueves</Label>
                    <Input
                      value={restaurantData.horarioLunesJueves}
                      onChange={(e) => setRestaurantData({...restaurantData, horarioLunesJueves: e.target.value})}
                      placeholder="12:00 - 23:00"
                      className="bg-slate-700/50 border-cyan-400/30 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-cyan-300 font-medium">Viernes y Sábado</Label>
                    <Input
                      value={restaurantData.horarioViernesSabado}
                      onChange={(e) => setRestaurantData({...restaurantData, horarioViernesSabado: e.target.value})}
                      placeholder="12:00 - 00:00"
                      className="bg-slate-700/50 border-cyan-400/30 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-cyan-300 font-medium">Domingo</Label>
                    <Input
                      value={restaurantData.horarioDomingo}
                      onChange={(e) => setRestaurantData({...restaurantData, horarioDomingo: e.target.value})}
                      placeholder="12:00 - 22:00"
                      className="bg-slate-700/50 border-cyan-400/30 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                    />
                  </div>
                </div>
              </div>

              {/* Configuración de Ubicaciones */}
              <div className="border-t border-slate-600 pt-6">
                <h3 className="text-lg font-semibold text-cyan-300 mb-4">🍽️ Ubicaciones del Restaurante</h3>
                <div className="space-y-3">
                  {restaurantData.ubicaciones.map((ubicacion, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={ubicacion}
                        onChange={(e) => {
                          const newUbicaciones = [...restaurantData.ubicaciones];
                          newUbicaciones[index] = e.target.value;
                          setRestaurantData({...restaurantData, ubicaciones: newUbicaciones});
                        }}
                        placeholder="Nombre de la ubicación"
                        className="bg-slate-700/50 border-cyan-400/30 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                      />
                      <Input
                        value={restaurantData.descripcionUbicaciones[ubicacion] || ''}
                        onChange={(e) => {
                          const newDescripciones = {...restaurantData.descripcionUbicaciones};
                          newDescripciones[ubicacion] = e.target.value;
                          setRestaurantData({...restaurantData, descripcionUbicaciones: newDescripciones});
                        }}
                        placeholder="Descripción de la ubicación"
                        className="bg-slate-700/50 border-cyan-400/30 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/20"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          const newUbicaciones = restaurantData.ubicaciones.filter((_, i) => i !== index);
                          const newDescripciones = {...restaurantData.descripcionUbicaciones};
                          delete newDescripciones[ubicacion];
                          setRestaurantData({...restaurantData, ubicaciones: newUbicaciones, descripcionUbicaciones: newDescripciones});
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const nuevaUbicacion = `Ubicación ${restaurantData.ubicaciones.length + 1}`;
                      setRestaurantData({
                        ...restaurantData, 
                        ubicaciones: [...restaurantData.ubicaciones, nuevaUbicacion],
                        descripcionUbicaciones: {...restaurantData.descripcionUbicaciones, [nuevaUbicacion]: ''}
                      });
                    }}
                    className="w-full border-dashed border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/10"
                  >
                    + Agregar Ubicación
                  </Button>
                </div>
              </div>
              <Button 
                onClick={() => setStep(2)} 
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold shadow-lg"
                disabled={!restaurantData.name || !restaurantData.email || !restaurantData.phone}
              >
                Siguiente: Configurar Mesas
              </Button>
            </CardContent>
          </Card>
          </div>
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
                        {template.length} ubicaciones, {template.reduce((sum, loc) => sum + loc.tables.length, 0)} mesas
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <Card className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-blue-400/30 shadow-2xl shadow-blue-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-300">Total Mesas</p>
                        <p className="text-2xl font-bold text-white">{getTotalTables()}</p>
                        <div className="text-xs text-gray-400 mt-1">
                          📞 Solo mesas gestionadas por llamada
                        </div>
                      </div>
                      <Users className="h-8 w-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <Card className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-green-400/30 shadow-2xl shadow-green-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-300">Capacidad Total</p>
                        <p className="text-2xl font-bold text-white">{getTotalCapacity()}</p>
                        <div className="text-xs text-gray-400 mt-1">personas</div>
                      </div>
                      <MapPin className="h-8 w-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <Card className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-purple-400/30 shadow-2xl shadow-purple-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-300">Ubicaciones</p>
                        <p className="text-2xl font-bold text-white">{locations.length}</p>
                        <div className="text-xs text-gray-400 mt-1">
                          {locations.map(loc => loc.name).join(', ')}
                        </div>
                      </div>
                      <CheckCircle className="h-8 w-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Configuración de ubicaciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {locations.map((location, locationIndex) => (
                <div key={locationIndex} className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                  <Card className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-purple-400/30 shadow-2xl shadow-purple-500/20">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Input
                            value={location.name}
                            onChange={(e) => updateLocationName(locationIndex, e.target.value)}
                            placeholder="Nombre de la ubicación (ej: Comedor 1)"
                            className="text-lg font-semibold bg-slate-700/50 border-purple-400/30 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400/20"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeLocation(locationIndex)}
                          className="text-red-400 hover:text-red-300 border-red-400/30 hover:bg-red-400/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-purple-300">Especificación de Mesas</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTable(locationIndex)}
                        className="bg-transparent border-purple-400/50 text-purple-300 hover:bg-purple-400/20 hover:border-purple-400"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar Mesa
                      </Button>
                    </div>

                    {location.tables.map((table, tableIndex) => (
                      <div key={tableIndex} className="flex items-center space-x-3 p-4 border rounded-xl bg-slate-700/30 border-purple-400/20 hover:bg-slate-700/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs text-purple-300 font-medium">Nombre de mesa</Label>
                          <Input
                            type="text"
                            value={table.name}
                            onChange={(e) => updateTable(locationIndex, tableIndex, 'name', e.target.value)}
                            placeholder="Mesa 1"
                            className="w-full bg-slate-600/50 border-purple-400/30 text-white font-semibold focus:border-purple-400 focus:ring-purple-400/20"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs text-purple-300 font-medium">Capacidad</Label>
                          <Input
                            type="number"
                            value={table.capacity}
                            onChange={(e) => updateTable(locationIndex, tableIndex, 'capacity', parseInt(e.target.value) || 2)}
                            min="1"
                            max="20"
                            className="w-full bg-slate-600/50 border-purple-400/30 text-white text-center font-semibold focus:border-purple-400 focus:ring-purple-400/20"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label className="text-xs text-cyan-300 font-medium">Gestión</Label>
                          <div className="px-3 py-2 bg-cyan-500/20 border border-cyan-400/30 rounded text-xs font-semibold text-cyan-300 text-center">
                            📞 Por llamada
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTable(locationIndex, tableIndex)}
                          className="text-red-400 hover:text-red-300 border-red-400/30 hover:bg-red-400/20 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {location.tables.length === 0 && (
                      <div className="text-center py-6 text-gray-400">
                        <p className="text-purple-300">No hay mesas especificadas</p>
                        <p className="text-sm text-gray-500">Haz clic en &quot;Agregar Mesa&quot; para empezar</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                </div>
              ))}

              {/* Botón para agregar ubicación */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <Card className="relative border-dashed border-2 border-cyan-400/30 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl">
                  <CardContent className="flex items-center justify-center h-full min-h-[200px]">
                    <Button
                      variant="outline"
                      onClick={addLocation}
                      className="h-auto p-6 flex flex-col items-center space-y-2 bg-transparent border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400"
                    >
                      <Plus className="h-8 w-8" />
                      <span className="font-semibold">Agregar Ubicación</span>
                      <span className="text-sm text-gray-400">Comedor, Terraza, etc.</span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex-1 bg-transparent border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400"
              >
                ← Anterior
              </Button>
              <Button 
                onClick={handleCreateRestaurant}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg"
                disabled={isLoading || getTotalTables() === 0}
              >
                {isLoading ? '⏳ Creando...' : '🚀 Crear Restaurante'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Credenciales */}
        {step === 3 && generatedCredentials && (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <Card className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-green-400/30 shadow-2xl shadow-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white text-xl font-bold">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span>Restaurante Creado Exitosamente</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStep(1);
                    setGeneratedCredentials(null);
                    setRestaurantData({ name: '', email: '', phone: '', address: '', twilioNumber: '' });
                    setLocations([
                      { 
                        name: 'Comedor 1', 
                        tables: [
                          { name: 'Mesa 1', capacity: 4 },
                          { name: 'Mesa 2', capacity: 2 }
                        ] 
                      },
                      { 
                        name: 'Terraza', 
                        tables: [
                          { name: 'Mesa 8', capacity: 4 }
                        ] 
                      }
                    ]);
                  }}
                  className="bg-transparent border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400"
                >
                  Crear Otro Restaurante
                </Button>
                <Button 
                  onClick={() => {
                    // Abrir el dashboard del restaurante en una nueva pestaña
                    toast.success('🚀 Abriendo dashboard del restaurante...');
                    window.open('/login', '_blank');
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg"
                >
                  🎯 Probar Dashboard
                </Button>
                <Button 
                  onClick={() => router.push('/admin')}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold shadow-lg"
                >
                  Volver al Admin
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
