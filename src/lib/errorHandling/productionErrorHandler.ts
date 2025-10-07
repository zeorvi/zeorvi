import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export interface ErrorContext {
  restaurantId?: string;
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  timestamp?: Date;
}

export interface ErrorDetails {
  message: string;
  code?: string;
  stack?: string;
  context?: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'validation' | 'database' | 'network' | 'authentication' | 'authorization' | 'business' | 'system';
  retryable: boolean;
  metadata?: any;
}

class ProductionErrorHandler {
  private errorCounts: Map<string, number> = new Map();
  private recentErrors: Array<{ error: ErrorDetails; timestamp: Date }> = [];
  private maxRecentErrors = 1000;

  public handleError(
    error: Error | unknown,
    context: ErrorContext = {},
    customDetails?: Partial<ErrorDetails>
  ): ErrorDetails {
    const errorDetails = this.parseError(error, context, customDetails);
    
    // Agregar a errores recientes
    this.recentErrors.push({ error: errorDetails, timestamp: new Date() });
    
    // Mantener solo los errores más recientes
    if (this.recentErrors.length > this.maxRecentErrors) {
      this.recentErrors = this.recentErrors.slice(-this.maxRecentErrors);
    }
    
    // Incrementar contador de errores
    const errorKey = `${errorDetails.category}:${errorDetails.code || 'unknown'}`;
    this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    
    // Log según severidad
    this.logError(errorDetails);
    
    // Enviar alertas para errores críticos
    if (errorDetails.severity === 'critical') {
      this.sendCriticalAlert(errorDetails);
    }
    
    return errorDetails;
  }

  private parseError(
    error: Error | unknown,
    context: ErrorContext,
    customDetails?: Partial<ErrorDetails>
  ): ErrorDetails {
    let message = 'Unknown error occurred';
    let code: string | undefined;
    let category: ErrorDetails['category'] = 'system';
    let severity: ErrorDetails['severity'] = 'medium';
    let retryable = false;
    let stack: string | undefined;

    if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
      
      // Clasificar error por tipo
      if (error.name === 'ValidationError') {
        category = 'validation';
        severity = 'low';
      } else if (error.name === 'DatabaseError' || error.message.includes('database')) {
        category = 'database';
        severity = 'high';
        retryable = true;
      } else if (error.name === 'NetworkError' || error.message.includes('network')) {
        category = 'network';
        severity = 'medium';
        retryable = true;
      } else if (error.name === 'AuthenticationError' || error.message.includes('unauthorized')) {
        category = 'authentication';
        severity = 'medium';
      } else if (error.name === 'AuthorizationError' || error.message.includes('forbidden')) {
        category = 'authorization';
        severity = 'medium';
      } else if (error.message.includes('business logic')) {
        category = 'business';
        severity = 'low';
      }
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String((error as any).message);
    }

    // Detectar errores críticos por mensaje
    if (message.includes('out of memory') || message.includes('heap out of memory')) {
      severity = 'critical';
      category = 'system';
    } else if (message.includes('connection refused') || message.includes('timeout')) {
      severity = 'high';
      category = 'network';
      retryable = true;
    } else if (message.includes('rate limit') || message.includes('too many requests')) {
      severity = 'medium';
      category = 'system';
    }

    return {
      message,
      code,
      stack,
      context: {
        ...context,
        timestamp: new Date(),
      },
      severity,
      category,
      retryable,
      metadata: customDetails?.metadata,
      ...customDetails,
    };
  }

  private logError(errorDetails: ErrorDetails): void {
    const logData = {
      message: errorDetails.message,
      code: errorDetails.code,
      category: errorDetails.category,
      severity: errorDetails.severity,
      retryable: errorDetails.retryable,
      context: errorDetails.context,
      metadata: errorDetails.metadata,
    };

    switch (errorDetails.severity) {
      case 'critical':
        logger.error('Critical error', logData);
        break;
      case 'high':
        logger.error('High severity error', logData);
        break;
      case 'medium':
        logger.warn('Medium severity error', logData);
        break;
      case 'low':
        logger.info('Low severity error', logData);
        break;
    }
  }

  private sendCriticalAlert(errorDetails: ErrorDetails): void {
    // Aquí se podría integrar con servicios de alertas
    console.log(`🚨 CRITICAL ERROR ALERT: ${errorDetails.message}`);
    
    // Ejemplo de integración con Slack/Discord/etc
    // await sendSlackAlert(errorDetails);
  }

  public createErrorResponse(
    errorDetails: ErrorDetails,
    statusCode?: number
  ): NextResponse {
    const status = statusCode || this.getStatusCode(errorDetails);
    
    const response = {
      error: true,
      message: this.getPublicMessage(errorDetails),
      code: errorDetails.code,
      timestamp: errorDetails.context?.timestamp?.toISOString(),
      requestId: errorDetails.context?.requestId,
    };

    // No exponer información sensible en producción
    if (process.env.NODE_ENV === 'development') {
      (response as any).details = errorDetails;
    }

    return NextResponse.json(response, { status });
  }

  private getStatusCode(errorDetails: ErrorDetails): number {
    switch (errorDetails.category) {
      case 'validation':
        return 400;
      case 'authentication':
        return 401;
      case 'authorization':
        return 403;
      case 'database':
        return 500;
      case 'network':
        return 502;
      case 'business':
        return 422;
      case 'system':
      default:
        return 500;
    }
  }

  private getPublicMessage(errorDetails: ErrorDetails): string {
    // Mensajes amigables para el usuario
    switch (errorDetails.category) {
      case 'validation':
        return 'Invalid request data. Please check your input.';
      case 'authentication':
        return 'Authentication required. Please log in.';
      case 'authorization':
        return 'Access denied. You do not have permission to perform this action.';
      case 'database':
        return 'Service temporarily unavailable. Please try again later.';
      case 'network':
        return 'Network error. Please check your connection and try again.';
      case 'business':
        return errorDetails.message; // Los errores de negocio pueden ser mostrados directamente
      case 'system':
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }

  // Métodos de monitoreo y estadísticas
  public getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrorCount: number;
    topErrors: Array<{ key: string; count: number }>;
  } {
    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    
    for (const { error } of this.recentErrors) {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    }
    
    const topErrors = Array.from(this.errorCounts.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalErrors: this.recentErrors.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrorCount: this.recentErrors.length,
      topErrors,
    };
  }

  public getRecentErrors(limit: number = 50): Array<{ error: ErrorDetails; timestamp: Date }> {
    return this.recentErrors.slice(-limit);
  }

  public clearErrorHistory(): void {
    this.recentErrors = [];
    this.errorCounts.clear();
    logger.info('Error history cleared');
  }

  // Método para manejar errores en API routes
  public async handleApiError(
    request: NextRequest,
    error: Error | unknown,
    context: ErrorContext = {}
  ): Promise<NextResponse> {
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
    
    const errorContext: ErrorContext = {
      ...context,
      requestId,
      endpoint: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
    };

    const errorDetails = this.handleError(error, errorContext);
    return this.createErrorResponse(errorDetails);
  }
}

// Singleton instance
export const productionErrorHandler = new ProductionErrorHandler();
export default productionErrorHandler;

// Funciones de conveniencia para usar en API routes
export async function handleApiError(
  request: NextRequest,
  error: Error | unknown,
  context: ErrorContext = {}
): Promise<NextResponse> {
  return productionErrorHandler.handleApiError(request, error, context);
}

export function handleError(
  error: Error | unknown,
  context: ErrorContext = {},
  customDetails?: Partial<ErrorDetails>
): ErrorDetails {
  return productionErrorHandler.handleError(error, context, customDetails);
}
