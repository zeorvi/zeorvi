'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Save, 
  Wand2,
  MapPin,
  Users,
  CheckCircle,
  Copy,
  Download,
  Eye,
  Settings,
  Lightbulb,
  ArrowRight,
  Calculator
} from 'lucide-react';

interface TableSpec {
  capacity: number;
  count: number;
}

interface LocationSpec {
  name: string;
  tables: TableSpec[];
}

interface GeneratedTable {
  id: string;
  name: string;
  capacity: number;
  location: string;
  position: { x: number; y: number };
  notes: string;
}

export default function AutoTableGenerator() {
  const [restaurantName, setRestaurantName] = useState('Mi Restaurante');
  const [locations, setLocations] = useState<LocationSpec[]>([
    { name: 'Comedor 1', tables: [{ capacity: 2, count: 2 }, { capacity: 4, count: 4 }, { capacity: 6, count: 2 }] },
    { name: 'Comedor 2', tables: [{ capacity: 4, count: 3 }, { capacity: 8, count: 2 }] },
    { name: 'Terraza', tables: [{ capacity: 4, count: 4 }, { capacity: 6, count: 2 }] }
  ]);
  const [generatedTables, setGeneratedTables] = useState<GeneratedTable[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Plantillas predefinidas
  const templates = {
    'Restaurante Pequeño': {
      name: 'Restaurante Pequeño',
      locations: [
        { name: 'Comedor Principal', tables: [{ capacity: 2, count: 4 }, { capacity: 4, count: 6 }] },
        { name: 'Terraza', tables: [{ capacity: 2, count: 3 }, { capacity: 4, count: 4 }] }
      ]
    },
    'Restaurante Mediano': {
      name: 'Restaurante Mediano',
      locations: [
        { name: 'Comedor 1', tables: [{ capacity: 2, count: 3 }, { capacity: 4, count: 6 }, { capacity: 6, count: 3 }] },
        { name: 'Comedor 2', tables: [{ capacity: 4, count: 4 }, { capacity: 8, count: 2 }] },
        { name: 'Terraza', tables: [{ capacity: 4, count: 6 }, { capacity: 6, count: 3 }] }
      ]
    },
    'Restaurante Grande': {
      name: 'Restaurante Grande',
      locations: [
        { name: 'Comedor 1', tables: [{ capacity: 2, count: 4 }, { capacity: 4, count: 8 }, { capacity: 6, count: 4 }] },
        { name: 'Comedor 2', tables: [{ capacity: 4, count: 6 }, { capacity: 8, count: 4 }] },
        { name: 'Terraza', tables: [{ capacity: 4, count: 8 }, { capacity: 6, count: 4 }, { capacity: 10, count: 2 }] },
        { name: 'Salón Privado', tables: [{ capacity: 12, count: 2 }, { capacity: 15, count: 1 }] }
      ]
    }
  };

  const applyTemplate = (templateKey: string) => {
    const template = templates[templateKey as keyof typeof templates];
    setRestaurantName(template.name);
    setLocations(template.locations);
    setIsGenerated(false);
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
    const tables: GeneratedTable[] = [];
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

    setGeneratedTables(tables);
    setIsGenerated(true);
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

  const getLocationColor = (location: string) => {
    const colors: { [key: string]: string } = {
      'Terraza': 'bg-green-100 text-green-800',
      'Comedor 1': 'bg-blue-100 text-blue-800',
      'Comedor 2': 'bg-purple-100 text-purple-800',
      'Salón Principal': 'bg-orange-100 text-orange-800',
      'Salón Privado': 'bg-pink-100 text-pink-800'
    };
    return colors[location] || 'bg-gray-100 text-gray-800';
  };

  const getCapacityColor = (capacity: number) => {
    if (capacity <= 2) return 'bg-blue-100 text-blue-800';
    if (capacity <= 4) return 'bg-green-100 text-green-800';
    if (capacity <= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Aquí podrías agregar una notificación de éxito
  };

  const generateCode = () => {
    const restaurantId = restaurantName.toLowerCase().replace(/\s+/g, '_') + '_001';
    const locationsList = Array.from(new Set(generatedTables.map(t => `'${t.location}'`))).join(', ');
    
    return `export const ${restaurantId.replace(/_/g, '')}Config: RestaurantLayout = {
  restaurantId: '${restaurantId}',
  restaurantName: '${restaurantName}',
  locations: [${locationsList}],
  tables: [
${generatedTables.map(table => `    { id: '${table.id}', name: '${table.name}', capacity: ${table.capacity}, location: '${table.location}', position: { x: ${table.position.x}, y: ${table.position.y} }, notes: '${table.notes}' }`).join(',\n')}
  ]
};`;
  };

  return (
    <div className="space-y-6">
      {/* Header con plantillas */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Generador Inteligente de Mesas</h1>
          <p className="text-gray-600 mt-1">
            Crea la configuración de mesas de tu restaurante de forma automática
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowPreview(!showPreview)} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Ocultar' : 'Vista'} Previa
          </Button>
          <Button onClick={generateTables} className="bg-orange-600 hover:bg-orange-700">
            <Wand2 className="h-4 w-4 mr-2" />
            Generar Mesas
          </Button>
        </div>
      </div>

      {/* Plantillas rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5" />
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
                <div className="font-semibold">{template.name}</div>
                <div className="text-sm text-gray-600">
                  {template.locations.length} ubicaciones, {template.locations.reduce((sum, loc) => sum + loc.tables.reduce((s, t) => s + t.count, 0), 0)} mesas
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuración del restaurante */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuración del Restaurante</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="restaurant-name">Nombre del Restaurante</Label>
              <Input
                id="restaurant-name"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Ej: Restaurante El Buen Sabor"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas en tiempo real */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Calculator className="h-8 w-8 text-green-600" />
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
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio por Mesa</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getTotalTables() > 0 ? Math.round(getTotalCapacity() / getTotalTables()) : 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-600" />
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

              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTableSpec(locationIndex)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Tipo de Mesa
                </Button>
              </div>
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

      {/* Resultado generado */}
      {isGenerated && generatedTables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Mesas Generadas Automáticamente</span>
              <Badge className="bg-green-100 text-green-800">
                {generatedTables.length} mesas
              </Badge>
            </CardTitle>
            <CardDescription>
              El sistema ha generado automáticamente todas las mesas según tus especificaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Vista previa compacta */}
              {showPreview && (
                <div className="space-y-4">
                  {Array.from(new Set(generatedTables.map(t => t.location))).map(location => (
                    <div key={location}>
                      <h3 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                        <MapPin className="h-5 w-5" />
                        <span>{location}</span>
                        <Badge className={getLocationColor(location)}>
                          {generatedTables.filter(t => t.location === location).length} mesas
                        </Badge>
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {generatedTables
                          .filter(table => table.location === location)
                          .map(table => (
                            <div key={table.id} className="border rounded p-2 text-center">
                              <div className="font-semibold text-sm">{table.name}</div>
                              <Badge className={getCapacityColor(table.capacity)} size="sm">
                                {table.capacity}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Código generado */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Código para implementar:</h4>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generateCode())}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([generateCode()], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${restaurantName.replace(/\s+/g, '_')}_config.ts`;
                        a.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
                <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code>{generateCode()}</code>
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}