'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Phone, User, FileText } from 'lucide-react';

interface OccupyTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    cliente: string;
    telefono: string;
    personas: number;
    notas?: string;
  }) => void;
  tableName: string;
  tableCapacity: number;
}

export default function OccupyTableDialog({
  isOpen,
  onClose,
  onConfirm,
  tableName,
  tableCapacity
}: OccupyTableDialogProps) {
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [personas, setPersonas] = useState(2);
  const [notas, setNotas] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cliente.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }
    
    if (personas < 1 || personas > tableCapacity) {
      alert(`El número de personas debe estar entre 1 y ${tableCapacity}`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onConfirm({
        cliente: cliente.trim(),
        telefono: telefono.trim() || 'Sin teléfono',
        personas,
        notas: notas.trim()
      });
      
      // Limpiar el formulario
      setCliente('');
      setTelefono('');
      setPersonas(2);
      setNotas('');
      
    } catch (error) {
      console.error('Error al ocupar mesa:', error);
      alert('Error al ocupar la mesa. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ocupar Mesa {tableName}</DialogTitle>
          <DialogDescription>
            Ingresa los datos del cliente. La mesa se liberará automáticamente en 2 horas.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Cliente */}
            <div className="grid gap-2">
              <Label htmlFor="cliente" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Nombre del Cliente *
              </Label>
              <Input
                id="cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Ej: Juan Pérez"
                required
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            {/* Teléfono */}
            <div className="grid gap-2">
              <Label htmlFor="telefono" className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                Teléfono (opcional)
              </Label>
              <Input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: +34 600 123 456"
                disabled={isSubmitting}
              />
            </div>

            {/* Número de Personas */}
            <div className="grid gap-2">
              <Label htmlFor="personas" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Número de Personas * (máx: {tableCapacity})
              </Label>
              <Input
                id="personas"
                type="number"
                min="1"
                max={tableCapacity}
                value={personas}
                onChange={(e) => setPersonas(parseInt(e.target.value) || 1)}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Notas */}
            <div className="grid gap-2">
              <Label htmlFor="notas" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Notas (opcional)
              </Label>
              <Textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: Cliente habitual, cumpleaños, etc."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* Información sobre liberación automática */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
              <p className="font-semibold mb-1">⏰ Liberación Automática</p>
              <p className="text-xs">
                Esta mesa se liberará automáticamente después de 2 horas de ocupación.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? 'Ocupando...' : 'Ocupar Mesa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

