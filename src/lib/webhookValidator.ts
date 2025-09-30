import crypto from 'crypto'
import { logger } from './logger'
import twilio from 'twilio'

// Interfaces
export interface WebhookValidationResult {
  valid: boolean
  error?: string
  timestamp?: number
}

export interface TwilioWebhookData {
  [key: string]: string
}

export interface StripeWebhookData {
  id: string
  object: string
  created: number
  data: Record<string, unknown>
  type: string
}

// Validador base para webhooks
export abstract class WebhookValidator {
  protected secret: string

  constructor(secret: string) {
    this.secret = secret
  }

  abstract validate(
    signature: string,
    payload: string | Buffer,
    options?: Record<string, unknown>
  ): WebhookValidationResult
}

// Validador para webhooks de Twilio
export class TwilioWebhookValidator extends WebhookValidator {
  validate(
    signature: string,
    url: string,
    params: TwilioWebhookData
  ): WebhookValidationResult {
    try {
      if (!this.secret) {
        logger.warn('Twilio webhook secret not configured, skipping validation')
        return { valid: true }
      }

      const isValid = twilio.validateRequest(this.secret, signature, url, params)

      if (!isValid) {
        logger.warn('Invalid Twilio webhook signature', {
          url,
          signature: signature.substring(0, 10) + '...' // Log solo parte de la firma por seguridad
        })
        return {
          valid: false,
          error: 'Invalid Twilio webhook signature'
        }
      }

      logger.debug('Twilio webhook signature validated successfully')
      return { valid: true }
    } catch (error) {
      logger.error('Error validating Twilio webhook signature', { error, url })
      return {
        valid: false,
        error: `Twilio validation error: ${(error as Error).message}`
      }
    }
  }
}

// Validador para webhooks de Stripe
export class StripeWebhookValidator extends WebhookValidator {
  private tolerance: number

  constructor(secret: string, tolerance: number = 300) {
    super(secret)
    this.tolerance = tolerance // 5 minutos por defecto
  }

  validate(
    signature: string,
    payload: string | Buffer,
    options: { timestamp?: number } = {}
  ): WebhookValidationResult {
    try {
      if (!this.secret) {
        logger.warn('Stripe webhook secret not configured, skipping validation')
        return { valid: true }
      }

      const elements = signature.split(',')
      const signatureElements: { [key: string]: string } = {}

      for (const element of elements) {
        const [key, value] = element.split('=')
        if (key && value) {
          signatureElements[key] = value
        }
      }

      if (!signatureElements.t || !signatureElements.v1) {
        return {
          valid: false,
          error: 'Invalid Stripe signature format'
        }
      }

      const timestamp = parseInt(signatureElements.t, 10)
      const expectedSignature = signatureElements.v1

      // Verificar timestamp para prevenir ataques de replay
      const currentTime = options.timestamp || Math.floor(Date.now() / 1000)
      if (Math.abs(currentTime - timestamp) > this.tolerance) {
        return {
          valid: false,
          error: 'Stripe webhook timestamp too old'
        }
      }

      // Crear la cadena de firma
      const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8')
      const signedPayload = `${timestamp}.${payloadString}`

      // Generar la firma esperada
      const computedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(signedPayload, 'utf8')
        .digest('hex')

      // Comparar firmas de forma segura
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(computedSignature, 'hex')
      )

      if (!isValid) {
        logger.warn('Invalid Stripe webhook signature')
        return {
          valid: false,
          error: 'Invalid Stripe webhook signature'
        }
      }

      logger.debug('Stripe webhook signature validated successfully')
      return { valid: true, timestamp }
    } catch (error) {
      logger.error('Error validating Stripe webhook signature', { error })
      return {
        valid: false,
        error: `Stripe validation error: ${(error as Error).message}`
      }
    }
  }
}

// Validador genérico para webhooks con HMAC SHA256
export class HMACWebhookValidator extends WebhookValidator {
  private algorithm: string
  private headerName: string
  private prefix: string

  constructor(
    secret: string,
    algorithm: string = 'sha256',
    headerName: string = 'x-signature',
    prefix: string = 'sha256='
  ) {
    super(secret)
    this.algorithm = algorithm
    this.headerName = headerName
    this.prefix = prefix
  }

  validate(
    signature: string,
    payload: string | Buffer
  ): WebhookValidationResult {
    try {
      if (!this.secret) {
        logger.warn(`${this.headerName} webhook secret not configured, skipping validation`)
        return { valid: true }
      }

      // Remover prefijo si existe
      const cleanSignature = signature.startsWith(this.prefix)
        ? signature.substring(this.prefix.length)
        : signature

      // Generar la firma esperada
      const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8')
      const computedSignature = crypto
        .createHmac(this.algorithm, this.secret)
        .update(payloadString, 'utf8')
        .digest('hex')

      // Comparar firmas de forma segura
      const isValid = crypto.timingSafeEqual(
        Buffer.from(cleanSignature, 'hex'),
        Buffer.from(computedSignature, 'hex')
      )

      if (!isValid) {
        logger.warn(`Invalid ${this.headerName} webhook signature`)
        return {
          valid: false,
          error: `Invalid ${this.headerName} webhook signature`
        }
      }

      logger.debug(`${this.headerName} webhook signature validated successfully`)
      return { valid: true }
    } catch (error) {
      logger.error(`Error validating ${this.headerName} webhook signature`, { error })
      return {
        valid: false,
        error: `${this.headerName} validation error: ${(error as Error).message}`
      }
    }
  }
}

// Validador para webhooks de Retell AI
export class RetellWebhookValidator extends HMACWebhookValidator {
  constructor(secret: string) {
    super(secret, 'sha256', 'x-retell-signature', 'sha256=')
  }
}

// Validador genérico para webhooks HMAC SHA256
export class GenericHMACValidator extends HMACWebhookValidator {
  constructor(secret: string, headerName: string = 'x-signature-256', prefix: string = 'sha256=') {
    super(secret, 'sha256', headerName, prefix)
  }
}

// Factory para crear validadores
export class WebhookValidatorFactory {
  static createTwilioValidator(secret?: string): TwilioWebhookValidator {
    return new TwilioWebhookValidator(secret || process.env.TWILIO_AUTH_TOKEN || '')
  }

  static createStripeValidator(secret?: string, tolerance?: number): StripeWebhookValidator {
    return new StripeWebhookValidator(
      secret || process.env.STRIPE_WEBHOOK_SECRET || '',
      tolerance
    )
  }

  static createRetellValidator(secret?: string): RetellWebhookValidator {
    return new RetellWebhookValidator(secret || process.env.RETELL_WEBHOOK_SECRET || '')
  }

  static createGenericValidator(secret?: string, headerName?: string, prefix?: string): GenericHMACValidator {
    return new GenericHMACValidator(secret || process.env.GENERIC_WEBHOOK_SECRET || '', headerName, prefix)
  }

  static createHMACValidator(
    secret: string,
    algorithm?: string,
    headerName?: string,
    prefix?: string
  ): HMACWebhookValidator {
    return new HMACWebhookValidator(secret, algorithm, headerName, prefix)
  }
}

// Middleware para validación de webhooks
export const createWebhookValidationMiddleware = (
  validator: WebhookValidator,
  getSignature: (headers: Headers) => string,
  getPayload: (request: Request) => string | Buffer | Promise<string | Buffer>,
  options: Record<string, unknown> = {}
) => {
  return async (request: Request) => {
    try {
      const signature = getSignature(request.headers)
      if (!signature) {
        logger.warn('Webhook signature header missing')
        throw new Error('Webhook signature header missing')
      }

      const payload = await getPayload(request)
      const result = validator.validate(signature, payload, options)

      if (!result.valid) {
        logger.warn('Webhook validation failed', { error: result.error })
        throw new Error(result.error || 'Webhook validation failed')
      }

      logger.debug('Webhook validation successful')
      return result
    } catch (error) {
      logger.error('Webhook validation middleware error', { error })
      throw error
    }
  }
}

// Middlewares predefinidos
export const twilioWebhookMiddleware = createWebhookValidationMiddleware(
  WebhookValidatorFactory.createTwilioValidator(),
  (headers) => headers.get('x-twilio-signature') || '',
  async (request) => {
    const formData = await request.formData()
    const params: { [key: string]: string } = {}
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString()
    }
    return request.url // Twilio necesita la URL completa
  }
)

export const stripeWebhookMiddleware = createWebhookValidationMiddleware(
  WebhookValidatorFactory.createStripeValidator(),
  (headers) => headers.get('stripe-signature') || '',
  async (request) => await request.text()
)

export const retellWebhookMiddleware = createWebhookValidationMiddleware(
  WebhookValidatorFactory.createRetellValidator(),
  (headers) => headers.get('x-retell-signature') || '',
  async (request) => await request.text()
)

export const genericWebhookMiddleware = createWebhookValidationMiddleware(
  WebhookValidatorFactory.createGenericValidator(),
  (headers) => headers.get('x-signature-256') || '',
  async (request) => await request.text()
)

// Helper para aplicar validación a handlers de webhook
export const withWebhookValidation = (
  validator: WebhookValidator,
  getSignature: (headers: Headers) => string,
  getPayload: (request: Request) => string | Buffer | Promise<string | Buffer>,
  handler: (request: Request, ...args: unknown[]) => Promise<Response>,
  options: Record<string, unknown> = {}
) => {
  return async (request: Request, ...args: unknown[]) => {
    // Validar webhook
    const middleware = createWebhookValidationMiddleware(validator, getSignature, getPayload, options)
    await middleware(request)

    // Ejecutar handler si la validación es exitosa
    return handler(request, ...args)
  }
}

// Instancias singleton de validadores
export const webhookValidators = {
  twilio: WebhookValidatorFactory.createTwilioValidator(),
  stripe: WebhookValidatorFactory.createStripeValidator(),
  retell: WebhookValidatorFactory.createRetellValidator(),
  generic: WebhookValidatorFactory.createGenericValidator()
}

// Función de compatibilidad para importaciones existentes
export const verifyRetellWebhook = (signature: string, payload: string | Buffer): WebhookValidationResult => {
  const validator = WebhookValidatorFactory.createRetellValidator();
  return validator.validate(signature, payload);
};

export default WebhookValidatorFactory
