import twilio from 'twilio'
import { logger } from '@/lib/logger'
import { validateData, twilioWebhookSchema } from '@/lib/validations'

// Configuración del cliente Twilio
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// Interfaces
export interface TwilioMessage {
  to: string
  from: string
  body: string
  mediaUrl?: string[]
}

export interface TwilioCall {
  to: string
  from: string
  url: string // TwiML URL
  method?: 'GET' | 'POST'
  statusCallback?: string
  statusCallbackMethod?: 'GET' | 'POST'
}

export interface TwilioWebhookData {
  From: string
  To: string
  Body: string
  MessageType?: string
  CallSid?: string
  CallStatus?: string
}

export interface CircuitBreakerState {
  failures: number
  lastFailureTime: number
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
}

// Circuit breaker para Twilio
class TwilioCircuitBreaker {
  private state: CircuitBreakerState = {
    failures: 0,
    lastFailureTime: 0,
    state: 'CLOSED'
  }

  private readonly maxFailures = 5
  private readonly timeout = 60000 // 1 minuto
  private readonly retryTimeout = 30000 // 30 segundos

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state.state === 'OPEN') {
      if (Date.now() - this.state.lastFailureTime > this.retryTimeout) {
        this.state.state = 'HALF_OPEN'
        logger.info('Twilio circuit breaker: transitioning to HALF_OPEN')
      } else {
        throw new Error('Twilio service temporarily unavailable (circuit breaker OPEN)')
      }
    }

    try {
      const result = await operation()
      
      if (this.state.state === 'HALF_OPEN') {
        this.reset()
        logger.info('Twilio circuit breaker: service recovered, transitioning to CLOSED')
      }
      
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }

  private recordFailure() {
    this.state.failures++
    this.state.lastFailureTime = Date.now()

    if (this.state.failures >= this.maxFailures) {
      this.state.state = 'OPEN'
      logger.warn('Twilio circuit breaker: too many failures, transitioning to OPEN', {
        failures: this.state.failures
      })
    }
  }

  private reset() {
    this.state.failures = 0
    this.state.lastFailureTime = 0
    this.state.state = 'CLOSED'
  }

  getState() {
    return { ...this.state }
  }
}

// Instancia del circuit breaker
const circuitBreaker = new TwilioCircuitBreaker()

// Adaptador principal de Twilio
export class TwilioAdapter {
  private client: twilio.Twilio

  constructor() {
    this.client = client
  }

  // Enviar mensaje SMS/WhatsApp
  async sendMessage(message: TwilioMessage): Promise<{ sid: string; status: string }> {
    return circuitBreaker.execute(async () => {
      try {
        logger.info('Sending Twilio message', {
          to: message.to,
          from: message.from,
          bodyLength: message.body.length
        })

        const twilioMessage = await this.client.messages.create({
          to: message.to,
          from: message.from,
          body: message.body,
          ...(message.mediaUrl && { mediaUrl: message.mediaUrl })
        })

        logger.info('Twilio message sent successfully', {
          sid: twilioMessage.sid,
          status: twilioMessage.status,
          to: message.to
        })

        return {
          sid: twilioMessage.sid,
          status: twilioMessage.status
        }
      } catch (error: any) {
        logger.error('Error sending Twilio message', {
          error: error.message,
          code: error.code,
          to: message.to
        })
        throw new Error(`Failed to send message: ${error.message}`)
      }
    })
  }

  // Realizar llamada telefónica
  async makeCall(call: TwilioCall): Promise<{ sid: string; status: string }> {
    return circuitBreaker.execute(async () => {
      try {
        logger.info('Making Twilio call', {
          to: call.to,
          from: call.from,
          url: call.url
        })

        const twilioCall = await this.client.calls.create({
          to: call.to,
          from: call.from,
          url: call.url,
          method: call.method || 'POST',
          ...(call.statusCallback && { statusCallback: call.statusCallback }),
          ...(call.statusCallbackMethod && { statusCallbackMethod: call.statusCallbackMethod })
        })

        logger.info('Twilio call initiated successfully', {
          sid: twilioCall.sid,
          status: twilioCall.status,
          to: call.to
        })

        return {
          sid: twilioCall.sid,
          status: twilioCall.status
        }
      } catch (error: any) {
        logger.error('Error making Twilio call', {
          error: error.message,
          code: error.code,
          to: call.to
        })
        throw new Error(`Failed to make call: ${error.message}`)
      }
    })
  }

  // Validar webhook de Twilio
  validateWebhook(signature: string, url: string, params: Record<string, string>): boolean {
    try {
      const authToken = process.env.TWILIO_AUTH_TOKEN
      if (!authToken) {
        logger.warn('Twilio auth token not configured, skipping webhook validation')
        return true // En desarrollo, permitir sin validación
      }

      const isValid = twilio.validateRequest(authToken, signature, url, params)
      
      if (!isValid) {
        logger.warn('Invalid Twilio webhook signature', { url })
      }

      return isValid
    } catch (error) {
      logger.error('Error validating Twilio webhook', { error, url })
      return false
    }
  }

  // Procesar datos de webhook
  processWebhookData(formData: FormData): TwilioWebhookData {
    const rawData = {
      From: formData.get('From') as string,
      To: formData.get('To') as string,
      Body: formData.get('Body') as string,
      MessageType: formData.get('MessageType') as string,
      CallSid: formData.get('CallSid') as string,
      CallStatus: formData.get('CallStatus') as string,
    }

    // Validar datos básicos
    const validatedData = validateData(twilioWebhookSchema, rawData)
    
    return validatedData as TwilioWebhookData
  }

  // Obtener estado del servicio
  async getServiceStatus(): Promise<{
    available: boolean
    circuitBreakerState: CircuitBreakerState
    lastCheck: Date
  }> {
    try {
      // Hacer una llamada simple para verificar el estado
      await this.client.api.accounts.list({ limit: 1 })
      
      return {
        available: true,
        circuitBreakerState: circuitBreaker.getState(),
        lastCheck: new Date()
      }
    } catch (error) {
      logger.error('Twilio service health check failed', { error })
      
      return {
        available: false,
        circuitBreakerState: circuitBreaker.getState(),
        lastCheck: new Date()
      }
    }
  }

  // Obtener números de teléfono disponibles
  async getPhoneNumbers(): Promise<Array<{ phoneNumber: string; friendlyName: string }>> {
    return circuitBreaker.execute(async () => {
      try {
        const phoneNumbers = await this.client.incomingPhoneNumbers.list()
        
        return phoneNumbers.map(number => ({
          phoneNumber: number.phoneNumber,
          friendlyName: number.friendlyName
        }))
      } catch (error: any) {
        logger.error('Error fetching Twilio phone numbers', { error })
        throw new Error(`Failed to fetch phone numbers: ${error.message}`)
      }
    })
  }

  // Configurar webhook para un número
  async configureWebhook(phoneNumber: string, webhookUrl: string): Promise<void> {
    return circuitBreaker.execute(async () => {
      try {
        const phoneNumbers = await this.client.incomingPhoneNumbers.list({
          phoneNumber: phoneNumber
        })

        if (phoneNumbers.length === 0) {
          throw new Error(`Phone number ${phoneNumber} not found`)
        }

        await this.client.incomingPhoneNumbers(phoneNumbers[0].sid).update({
          smsUrl: webhookUrl,
          smsMethod: 'POST',
          voiceUrl: webhookUrl,
          voiceMethod: 'POST'
        })

        logger.info('Twilio webhook configured successfully', {
          phoneNumber,
          webhookUrl
        })
      } catch (error: any) {
        logger.error('Error configuring Twilio webhook', {
          error: error.message,
          phoneNumber,
          webhookUrl
        })
        throw new Error(`Failed to configure webhook: ${error.message}`)
      }
    })
  }
}

// Instancia singleton del adaptador
export const twilioAdapter = new TwilioAdapter()

// Helper functions
export const formatPhoneNumber = (phone: string): string => {
  // Normalizar número de teléfono
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return `+${cleaned}`
  } else if (cleaned.length === 10) {
    return `+1${cleaned}`
  } else if (!cleaned.startsWith('+')) {
    return `+${cleaned}`
  }
  
  return phone
}

export const isWhatsAppNumber = (number: string): boolean => {
  return number.startsWith('whatsapp:')
}

export const formatWhatsAppNumber = (number: string): string => {
  return `whatsapp:${formatPhoneNumber(number)}`
}

export default twilioAdapter
