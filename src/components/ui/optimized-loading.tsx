/**
 * Componente de loading optimizado para mejor rendimiento
 * Sin cambiar nada visual, solo optimizaciones técnicas
 */

import { memo } from 'react';
import { RefreshCw } from 'lucide-react';

interface OptimizedLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  className?: string;
}

// Componente memoizado para evitar re-renders innecesarios
const OptimizedLoading = memo(function OptimizedLoading({
  message = 'Cargando...',
  size = 'md',
  color = 'blue',
  className = ''
}: OptimizedLoadingProps) {
  
  // Configuración de tamaños optimizada
  const sizeConfig = {
    sm: { icon: 'h-4 w-4', text: 'text-sm' },
    md: { icon: 'h-6 w-6', text: 'text-base' },
    lg: { icon: 'h-8 w-8', text: 'text-lg' }
  };

  // Configuración de colores optimizada
  const colorConfig = {
    blue: 'text-blue-600',
    green: 'text-green-600', 
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    red: 'text-red-600'
  };

  const currentSize = sizeConfig[size];
  const currentColor = colorConfig[color];

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <RefreshCw 
        className={`${currentSize.icon} ${currentColor} animate-spin`}
        aria-hidden="true"
      />
      <span className={`${currentSize.text} ${currentColor} font-medium`}>
        {message}
      </span>
    </div>
  );
});

export default OptimizedLoading;

// Componentes específicos para diferentes secciones (pre-renderizados)
export const ReservationLoading = memo(() => (
  <OptimizedLoading 
    message="Cargando reservas..." 
    color="blue" 
    size="md" 
  />
));
ReservationLoading.displayName = "ReservationLoading";

export const TableLoading = memo(() => (
  <OptimizedLoading 
    message="Cargando mesas..." 
    color="orange" 
    size="md" 
  />
));
TableLoading.displayName = "TableLoading";

export const AILoading = memo(() => (
  <OptimizedLoading 
    message="Conectando con IA..." 
    color="purple" 
    size="md" 
  />
));
AILoading.displayName = "AILoading";

export const DataLoading = memo(() => (
  <OptimizedLoading 
    message="Cargando datos..." 
    color="green" 
    size="md" 
  />
));
DataLoading.displayName = "DataLoading";
