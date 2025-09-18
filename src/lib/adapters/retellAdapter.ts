import { logger } from '@/lib/logger'
import { validateData, retellWebhookSchema } from '@/lib/validations'

// Interfaces
export interface RetellAgent {
  id: string
  name: string
  voice: string
  language: string
  prompt: string
  webhook_url?: string
  fallback_voice_ids?: string[]
  responsiveness?: number
  interruption_sensitivity?: number
  enable_backchannel?: boolean
  ambient_sound?: string
}

export interface RetellCall {
  call_id: string
  agent_id: string
  from_number: string
  to_number: string
  direction: 'inbound' | 'outbound'
  call_status: 'registered' | 'ongoing' | 'ended' | 'error'
  start_timestamp?: number
  end_timestamp?: number
  transcript?: string
}

export interface RetellWebhookEvent {
  event: 'call_started' | 'call_ended' | 'call_analyzed' | 'agent_response'
  call_id: string
  agent_id: string
  timestamp: number
  data?: {
    transcript?: string
    analysis?: any
    extracted_data?: Record<string, any>
    sentiment?: 'positive' | 'neutral' | 'negative'
    intent?: string
    entities?: Record<string, any>
  }
}

export interface CreateAgentRequest {
  name: string
  voice: string
  language?: string
  prompt: string
  webhook_url?: string
  responsiveness?: number
  interruption_sensitivity?: number
  enable_backchannel?: boolean
  ambient_sound?: string
}

export interface StartCallRequest {
  agent_id: string
  to_number: string
  from_number: string
  metadata?: Record<string, any>
}

// Circuit breaker para Retell AI
class RetellCircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  private readonly maxFailures = 3
  private readonly retryTimeout = 30000 // 30 segundos

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.retryTimeout) {
        this.state = 'HALF_OPEN'
        logger.info('Retell circuit breaker: transitioning to HALF_OPEN')
      } else {
        throw new Error('Retell AI service temporarily unavailable (circuit breaker OPEN)')
      }
    }

    try {
      const result = await operation()
      
      if (this.state === 'HALF_OPEN') {
        this.reset()
        logger.info('Retell circuit breaker: service recovered, transitioning to CLOSED')
      }
      
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }

  private recordFailure() {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.maxFailures) {
      this.state = 'OPEN'
      logger.warn('Retell circuit breaker: too many failures, transitioning to OPEN', {
        failures: this.failures
      })
    }
  }

  private reset() {
    this.failures = 0
    this.lastFailureTime = 0
    this.state = 'CLOSED'
  }

  getState() {
    return {
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      state: this.state
    }
  }
}

// Adaptador principal de Retell AI
export class RetellAdapter {
  private apiKey: string
  private baseUrl = 'https://api.retellai.com/v2'
  private circuitBreaker = new RetellCircuitBreaker()

  constructor() {
    this.apiKey = process.env.RETELL_API_KEY || ''
    if (!this.apiKey) {
      logger.warn('Retell API key not configured')
    }
  }

  // Hacer petición HTTP a Retell AI
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const defaultHeaders = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Retell API error', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        endpoint
      })
      throw new Error(`Retell API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Crear un nuevo agente
  async createAgent(agentData: CreateAgentRequest): Promise<RetellAgent> {
    return this.circuitBreaker.execute(async () => {
      try {
        logger.info('Creating Retell agent', { name: agentData.name })

        const agent = await this.makeRequest<RetellAgent>('/agents', {
          method: 'POST',
          body: JSON.stringify(agentData),
        })

        logger.info('Retell agent created successfully', {
          agentId: agent.id,
          name: agent.name
        })

        return agent
      } catch (error: any) {
        logger.error('Error creating Retell agent', { error: error.message })
        throw new Error(`Failed to create agent: ${error.message}`)
      }
    })
  }

  // Obtener un agente por ID
  async getAgent(agentId: string): Promise<RetellAgent> {
    return this.circuitBreaker.execute(async () => {
      try {
        const agent = await this.makeRequest<RetellAgent>(`/agents/${agentId}`)
        
        logger.info('Retrieved Retell agent', { agentId })
        return agent
      } catch (error: any) {
        logger.error('Error retrieving Retell agent', { 
          error: error.message, 
          agentId 
        })
        throw new Error(`Failed to retrieve agent: ${error.message}`)
      }
    })
  }

  // Actualizar un agente
  async updateAgent(agentId: string, updates: Partial<CreateAgentRequest>): Promise<RetellAgent> {
    return this.circuitBreaker.execute(async () => {
      try {
        logger.info('Updating Retell agent', { agentId, updates })

        const agent = await this.makeRequest<RetellAgent>(`/agents/${agentId}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        })

        logger.info('Retell agent updated successfully', { agentId })
        return agent
      } catch (error: any) {
        logger.error('Error updating Retell agent', { 
          error: error.message, 
          agentId 
        })
        throw new Error(`Failed to update agent: ${error.message}`)
      }
    })
  }

  // Eliminar un agente
  async deleteAgent(agentId: string): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.makeRequest(`/agents/${agentId}`, {
          method: 'DELETE',
        })

        logger.info('Retell agent deleted successfully', { agentId })
      } catch (error: any) {
        logger.error('Error deleting Retell agent', { 
          error: error.message, 
          agentId 
        })
        throw new Error(`Failed to delete agent: ${error.message}`)
      }
    })
  }

  // Listar todos los agentes
  async listAgents(): Promise<RetellAgent[]> {
    return this.circuitBreaker.execute(async () => {
      try {
        const response = await this.makeRequest<{ agents: RetellAgent[] }>('/agents')
        
        logger.info('Retrieved Retell agents list', { count: response.agents.length })
        return response.agents
      } catch (error: any) {
        logger.error('Error listing Retell agents', { error: error.message })
        throw new Error(`Failed to list agents: ${error.message}`)
      }
    })
  }

  // Iniciar una llamada
  async startCall(callData: StartCallRequest): Promise<RetellCall> {
    return this.circuitBreaker.execute(async () => {
      try {
        logger.info('Starting Retell call', {
          agentId: callData.agent_id,
          to: callData.to_number,
          from: callData.from_number
        })

        const call = await this.makeRequest<RetellCall>('/calls', {
          method: 'POST',
          body: JSON.stringify(callData),
        })

        logger.info('Retell call started successfully', {
          callId: call.call_id,
          agentId: call.agent_id
        })

        return call
      } catch (error: any) {
        logger.error('Error starting Retell call', { error: error.message })
        throw new Error(`Failed to start call: ${error.message}`)
      }
    })
  }

  // Obtener información de una llamada
  async getCall(callId: string): Promise<RetellCall> {
    return this.circuitBreaker.execute(async () => {
      try {
        const call = await this.makeRequest<RetellCall>(`/calls/${callId}`)
        
        logger.info('Retrieved Retell call', { callId })
        return call
      } catch (error: any) {
        logger.error('Error retrieving Retell call', { 
          error: error.message, 
          callId 
        })
        throw new Error(`Failed to retrieve call: ${error.message}`)
      }
    })
  }

  // Terminar una llamada
  async endCall(callId: string): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      try {
        await this.makeRequest(`/calls/${callId}/end`, {
          method: 'POST',
        })

        logger.info('Retell call ended successfully', { callId })
      } catch (error: any) {
        logger.error('Error ending Retell call', { 
          error: error.message, 
          callId 
        })
        throw new Error(`Failed to end call: ${error.message}`)
      }
    })
  }

  // Procesar webhook de Retell AI
  processWebhookEvent(body: any): RetellWebhookEvent {
    try {
      const validatedData = validateData(retellWebhookSchema, body)
      
      logger.info('Processing Retell webhook event', {
        event: validatedData.event,
        callId: validatedData.call_id,
        agentId: validatedData.agent_id
      })

      return validatedData as RetellWebhookEvent
    } catch (error) {
      logger.error('Error processing Retell webhook', { error, body })
      throw new Error('Invalid webhook data')
    }
  }

  // Extraer datos de reserva del evento
  extractReservationData(event: RetellWebhookEvent): {
    hasReservation: boolean
    reservationData?: {
      clientName?: string
      clientPhone?: string
      date?: string
      time?: string
      people?: number
      location?: string
      notes?: string
    }
  } {
    if (!event.data?.extracted_data) {
      return { hasReservation: false }
    }

    const { extracted_data } = event.data
    
    // Verificar si contiene información de reserva
    const hasReservationFields = [
      'client_name', 'customer_name', 'name',
      'phone', 'phone_number', 'contact',
      'date', 'day', 'fecha',
      'time', 'hour', 'hora',
      'people', 'guests', 'personas', 'party_size'
    ].some(field => extracted_data[field])

    if (!hasReservationFields) {
      return { hasReservation: false }
    }

    // Mapear campos extraídos a formato estándar
    const reservationData = {
      clientName: extracted_data.client_name || 
                  extracted_data.customer_name || 
                  extracted_data.name,
      clientPhone: extracted_data.phone || 
                   extracted_data.phone_number || 
                   extracted_data.contact,
      date: extracted_data.date || 
            extracted_data.day || 
            extracted_data.fecha,
      time: extracted_data.time || 
            extracted_data.hour || 
            extracted_data.hora,
      people: parseInt(extracted_data.people || 
                      extracted_data.guests || 
                      extracted_data.personas || 
                      extracted_data.party_size) || undefined,
      location: extracted_data.location || 
                extracted_data.area || 
                extracted_data.section,
      notes: extracted_data.notes || 
             extracted_data.comments || 
             extracted_data.special_requests
    }

    // Filtrar campos undefined
    const cleanedData = Object.fromEntries(
      Object.entries(reservationData).filter(([_, value]) => value !== undefined)
    )

    return {
      hasReservation: true,
      reservationData: cleanedData
    }
  }

  // Obtener estado del servicio
  async getServiceStatus(): Promise<{
    available: boolean
    circuitBreakerState: any
    lastCheck: Date
  }> {
    try {
      // Hacer una llamada simple para verificar el estado
      await this.listAgents()
      
      return {
        available: true,
        circuitBreakerState: this.circuitBreaker.getState(),
        lastCheck: new Date()
      }
    } catch (error) {
      logger.error('Retell service health check failed', { error })
      
      return {
        available: false,
        circuitBreakerState: this.circuitBreaker.getState(),
        lastCheck: new Date()
      }
    }
  }

  // Generar prompt para agente de restaurante
  generateRestaurantPrompt(restaurantName: string, restaurantInfo: {
    address?: string
    phone?: string
    openingHours?: Record<string, { open: string; close: string }>
    specialties?: string[]
    locations?: string[]
  }): string {
    const { address, phone, openingHours, specialties, locations } = restaurantInfo

    let prompt = `Eres un asistente virtual para ${restaurantName}, un restaurante. Tu trabajo es ayudar a los clientes con reservas de manera amable y profesional.

INFORMACIÓN DEL RESTAURANTE:
- Nombre: ${restaurantName}`

    if (address) {
      prompt += `\n- Dirección: ${address}`
    }

    if (phone) {
      prompt += `\n- Teléfono: ${phone}`
    }

    if (openingHours) {
      prompt += '\n- Horarios:'
      Object.entries(openingHours).forEach(([day, hours]) => {
        prompt += `\n  ${day}: ${hours.open} - ${hours.close}`
      })
    }

    if (specialties && specialties.length > 0) {
      prompt += `\n- Especialidades: ${specialties.join(', ')}`
    }

    if (locations && locations.length > 0) {
      prompt += `\n- Áreas disponibles: ${locations.join(', ')}`
    }

    prompt += `

INSTRUCCIONES:
1. Saluda de manera amable y pregunta cómo puedes ayudar
2. Si el cliente quiere hacer una reserva, recopila la siguiente información:
   - Nombre completo
   - Número de teléfono
   - Fecha deseada
   - Hora preferida
   - Número de personas
   - Área preferida (si aplica)
   - Ocasión especial o notas adicionales

3. Confirma todos los datos antes de finalizar
4. Sé amable, profesional y eficiente
5. Si no puedes ayudar con algo, ofrece transferir a un humano

IMPORTANTE: Extrae y estructura claramente la información de reserva para que pueda ser procesada automáticamente.`

    return prompt
  }
}

// Instancia singleton del adaptador
export const retellAdapter = new RetellAdapter()

export default retellAdapter
