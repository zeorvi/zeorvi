'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { InventoryItem } from '@/lib/types/restaurant';

interface InventoryManagementProps {
  restaurantId: string;
  restaurantName: string;
  restaurantType: string;
}

export default function InventoryManagement({ restaurantId, restaurantName, restaurantType }: InventoryManagementProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock data - en producción vendría de Firebase
  useEffect(() => {
    const mockInventory: InventoryItem[] = [
      {
        id: 'inv_001',
        name: 'Tomate fresco',
        category: 'ingredients',
        currentStock: 2,
        minStock: 5,
        maxStock: 20,
        unit: 'kg',
        costPerUnit: 25,
        supplier: 'Verduras del Campo',
        supplierContact: '+52-555-0001',
        expirationDate: '2025-09-25',
        location: 'Refrigerador',
        lastRestocked: '2025-09-20',
        autoReorder: true,
        reorderPoint: 5,
        status: 'low_stock'
      },
      {
        id: 'inv_002',
        name: 'Queso mozzarella',
        category: 'ingredients',
        currentStock: 0,
        minStock: 3,
        maxStock: 15,
        unit: 'kg',
        costPerUnit: 45,
        supplier: 'Lácteos Premium',
        supplierContact: '+52-555-0002',
        expirationDate: '2025-09-22',
        location: 'Refrigerador',
        lastRestocked: '2025-09-18',
        autoReorder: true,
        reorderPoint: 3,
        status: 'out_of_stock'
      },
      {
        id: 'inv_003',
        name: 'Aceite de oliva',
        category: 'ingredients',
        currentStock: 8,
        minStock: 2,
        maxStock: 12,
        unit: 'litros',
        costPerUnit: 35,
        supplier: 'Aceites del Sur',
        supplierContact: '+52-555-0003',
        expirationDate: '2026-01-15',
        location: 'Almacén',
        lastRestocked: '2025-09-15',
        autoReorder: false,
        reorderPoint: 2,
        status: 'in_stock'
      }
    ];

    setInventory(mockInventory);
    setLoading(false);
  }, []);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    let matchesFilter = true;
    switch (filter) {
      case 'low_stock':
        matchesFilter = item.currentStock <= item.minStock && item.currentStock > 0;
        break;
      case 'out_of_stock':
        matchesFilter = item.currentStock === 0;
        break;
      case 'expired':
        matchesFilter = item.expirationDate ? new Date(item.expirationDate) < new Date() : false;
        break;
      default:
        matchesFilter = true;
    }

    return matchesSearch && matchesCategory && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock': return 'En Stock';
      case 'low_stock': return 'Stock Bajo';
      case 'out_of_stock': return 'Sin Stock';
      default: return 'Desconocido';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Inventario</h2>
          <p className="text-gray-600">Control de stock y productos</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              + Agregar Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Producto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-name">Nombre del Producto</Label>
                <Input id="product-name" placeholder="Ej: Tomate fresco" />
              </div>
              <div>
                <Label htmlFor="product-category">Categoría</Label>
                <Input id="product-category" placeholder="Ej: ingredients" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current-stock">Stock Actual</Label>
                  <Input id="current-stock" type="number" placeholder="0" />
                </div>
                <div>
                  <Label htmlFor="min-stock">Stock Mínimo</Label>
                  <Input id="min-stock" type="number" placeholder="0" />
                </div>
              </div>
              <Button className="w-full">Agregar Producto</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="category">Categoría</Label>
            <select
              id="category"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Todas las categorías</option>
              <option value="ingredients">Ingredientes</option>
              <option value="beverages">Bebidas</option>
              <option value="supplies">Suministros</option>
              <option value="cleaning">Limpieza</option>
            </select>
          </div>
          <div>
            <Label htmlFor="filter">Filtro</Label>
            <select
              id="filter"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="all">Todos</option>
              <option value="low_stock">Stock Bajo</option>
              <option value="out_of_stock">Sin Stock</option>
              <option value="expired">Vencidos</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setFilter('all');
              }}
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de productos */}
      <div className="grid gap-4">
        {filteredInventory.map((item) => (
          <Card key={item.id} className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <Badge className={getStatusColor(item.status)}>
                    {getStatusText(item.status)}
                  </Badge>
                  {item.autoReorder && (
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      Auto-reorder
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Stock:</span> {item.currentStock} {item.unit}
                  </div>
                  <div>
                    <span className="font-medium">Mínimo:</span> {item.minStock} {item.unit}
                  </div>
                  <div>
                    <span className="font-medium">Proveedor:</span> {item.supplier}
                  </div>
                  <div>
                    <span className="font-medium">Ubicación:</span> {item.location}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <span className="font-medium">Vence:</span> {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : 'No especificado'}
                  <span className="mx-2">•</span>
                  <span className="font-medium">Última reposición:</span> {item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : 'No especificado'}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Editar
                </Button>
                <Button variant="outline" size="sm">
                  Reponer
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredInventory.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No se encontraron productos
          </h3>
          <p className="text-gray-600">
            Ajusta los filtros o agrega nuevos productos al inventario.
          </p>
        </Card>
      )}
    </div>
  );
}
