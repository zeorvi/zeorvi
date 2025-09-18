'use client'

import { Loader2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

// Loading Spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <Loader2 
      className={cn('animate-spin', sizeClasses[size], className)} 
    />
  )
}

// Loading Button
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function LoadingButton({ 
  loading = false, 
  loadingText, 
  children, 
  disabled,
  className,
  variant = 'default',
  size = 'default',
  ...props 
}: LoadingButtonProps) {
  return (
    <Button
      disabled={loading || disabled}
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {loading ? (loadingText || 'Cargando...') : children}
    </Button>
  )
}

// Loading Overlay
interface LoadingOverlayProps {
  loading: boolean
  children: React.ReactNode
  className?: string
  message?: string
}

export function LoadingOverlay({ loading, children, className, message }: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-2">
            <LoadingSpinner size="lg" />
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Empty State
interface EmptyStateProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    loading?: boolean
  }
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({ 
  title, 
  description, 
  action, 
  icon, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      )}
      {action && (
        <LoadingButton
          onClick={action.onClick}
          loading={action.loading}
          variant="outline"
        >
          {action.label}
        </LoadingButton>
      )}
    </div>
  )
}

// Error State
interface ErrorStateProps {
  title?: string
  description?: string
  retry?: {
    label?: string
    onClick: () => void
    loading?: boolean
  }
  className?: string
}

export function ErrorState({ 
  title = 'Algo salió mal',
  description = 'Ocurrió un error inesperado. Por favor intenta de nuevo.',
  retry,
  className 
}: ErrorStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {retry && (
        <LoadingButton
          onClick={retry.onClick}
          loading={retry.loading}
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {retry.label || 'Reintentar'}
        </LoadingButton>
      )}
    </div>
  )
}

// Success State
interface SuccessStateProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function SuccessState({ 
  title, 
  description, 
  action, 
  className 
}: SuccessStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Loading Card
interface LoadingCardProps {
  title?: string
  description?: string
  className?: string
}

export function LoadingCard({ title, description, className }: LoadingCardProps) {
  return (
    <div className={cn(
      'rounded-lg border p-6 flex flex-col items-center justify-center space-y-4',
      className
    )}>
      <LoadingSpinner size="lg" />
      {title && <h3 className="text-lg font-medium">{title}</h3>}
      {description && <p className="text-muted-foreground text-center">{description}</p>}
    </div>
  )
}

// Progress Bar
interface ProgressBarProps {
  progress: number // 0-100
  label?: string
  className?: string
  showPercentage?: boolean
}

export function ProgressBar({ 
  progress, 
  label, 
  className, 
  showPercentage = true 
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className={cn('space-y-2', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-sm font-medium">{label}</span>}
          {showPercentage && <span className="text-sm text-muted-foreground">{Math.round(clampedProgress)}%</span>}
        </div>
      )}
      <div className="w-full bg-secondary rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}

// Inline Loading
interface InlineLoadingProps {
  text?: string
  className?: string
}

export function InlineLoading({ text = 'Cargando', className }: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <LoadingSpinner size="sm" />
      <span className="text-sm text-muted-foreground">{text}...</span>
    </div>
  )
}

// Refresh Button
interface RefreshButtonProps {
  onRefresh: () => void
  loading?: boolean
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function RefreshButton({ onRefresh, loading, className, size = 'icon' }: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      size={size}
      onClick={onRefresh}
      disabled={loading}
      className={className}
    >
      <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
      {size !== 'icon' && <span className="ml-2">Actualizar</span>}
    </Button>
  )
}
