export interface RestaurantRetellConfig {
  restaurantId: string;
  restaurantName: string;
  phoneNumber: string;
  agentId: string;
  spreadsheetId: string;
  webhookUrl: string;
  language: string;
  voice: string;
  model: string;
  status: 'active' | 'inactive' | 'pending';
}

export class RetellAgentManager {
  private static retellApiKey = process.env.RETELL_API_KEY;

  /**
   * Crear agente de Retell AI para un restaurante
   */
  static async createRestaurantAgent(config: {
    restaurantId: string;
    restaurantName: string;
    phoneNumber: string;
    spreadsheetId: string;
    webhookUrl: string;
    language?: string;
    voice?: string;
    model?: string;
  }): Promise<{
    agentId: string;
    success: boolean;
    error?: string;
  }> {
    try {
      if (!this.retellApiKey) {
        throw new Error('RETELL_API_KEY no configurado');
      }

      const agentId = `${config.restaurantId}_agent`;
      
      // Configuración del agente específica para el restaurante
      const agentConfig = {
        llm_dynamic_config: {
          model: config.model || 'gpt-4o-mini',
          temperature: 0.7,
          max_tokens: 1000,
        },
        voice_id: config.voice || 'alloy',
        language: config.language || 'es',
        end_call_after_silence_ms: 30000,
        interruption_threshold: 500,
        interruption_channel: 'both',
        enable_backchannel: true,
        backchannel_frequency: 0.3,
        end_call_phrases: [
          'adiós',
          'hasta luego',
          'nos vemos',
          'chao',
          'bye'
        ],
        metadata: {
          restaurant_id: config.restaurantId,
          restaurant_name: config.restaurantName,
          spreadsheet_id: config.spreadsheetId,
          webhook_url: config.webhookUrl
        },
        system_prompt: this.generateSystemPrompt(config.restaurantName, config.phoneNumber),
        webhook_url: config.webhookUrl,
        webhook_auth_header: `Bearer ${this.retellApiKey}`,
        transcription: {
          model: 'nova-2',
          language: config.language || 'es'
        },
        real_time_agent: {
          enable_transcription: true,
          enable_llm_response: true
        }
      };

      // En un entorno real, aquí harías la llamada a la API de Retell AI
      // const response = await fetch('https://api.retellai.com/create-agent', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.retellApiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(agentConfig)
      // });

      // Por ahora, simulamos la creación exitosa
      console.log(`🤖 Agente Retell AI creado para ${config.restaurantName}:`, agentConfig);

      return {
        agentId,
        success: true
      };

    } catch (error) {
      console.error(`❌ Error creando agente Retell AI para ${config.restaurantName}:`, error);
      return {
        agentId: '',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Generar prompt del sistema específico para el restaurante
   */
  private static generateSystemPrompt(restaurantName: string, phoneNumber: string): string {
    return `Eres el asistente virtual de ${restaurantName}. Tu trabajo es ayudar a los clientes con reservas de restaurante.

INFORMACIÓN DEL RESTAURANTE:
- Nombre: ${restaurantName}
- Teléfono: ${phoneNumber}

INSTRUCCIONES:
1. Saluda amablemente al cliente
2. Pregunta por qué tipo de servicio necesita (reserva, información, etc.)
3. Si quiere hacer una reserva, recopila esta información:
   - Nombre completo del cliente
   - Número de teléfono
   - Número de personas
   - Fecha deseada
   - Hora deseada
   - Solicitudes especiales (mesa cerca de la ventana, cumpleaños, etc.)

4. Confirma todos los detalles de la reserva
5. Si todo está correcto, confirma la reserva
6. Proporciona información sobre políticas de cancelación si es necesario

TONO:
- Amigable y profesional
- Claro y directo
- Entusiasta sobre el restaurante

Si el cliente no quiere hacer una reserva, ayuda con cualquier otra consulta sobre el restaurante.

IMPORTANTE: Al finalizar la llamada, asegúrate de haber recopilado toda la información necesaria para la reserva.`;
  }

  /**
   * Obtener configuración de agente de un restaurante
   */
  static async getRestaurantAgentConfig(restaurantId: string): Promise<RestaurantRetellConfig | null> {
    try {
      // En un entorno real, esto vendría de una base de datos
      // Por ahora, retornamos una configuración simulada
      return {
        restaurantId,
        restaurantName: `Restaurante ${restaurantId}`,
        phoneNumber: '555-0000',
        agentId: `${restaurantId}_agent`,
        spreadsheetId: 'spreadsheet_id_placeholder',
        webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/retell/webhook`,
        language: 'es',
        voice: 'alloy',
        model: 'gpt-4o-mini',
        status: 'active'
      };
    } catch (error) {
      console.error(`❌ Error obteniendo configuración del agente para ${restaurantId}:`, error);
      return null;
    }
  }

  /**
   * Actualizar configuración de agente
   */
  static async updateRestaurantAgent(restaurantId: string, updates: Partial<RestaurantRetellConfig>): Promise<boolean> {
    try {
      // En un entorno real, aquí actualizarías la configuración en la base de datos
      console.log(`🤖 Actualizando configuración del agente para ${restaurantId}:`, updates);
      return true;
    } catch (error) {
      console.error(`❌ Error actualizando agente para ${restaurantId}:`, error);
      return false;
    }
  }

  /**
   * Eliminar agente de restaurante
   */
  static async deleteRestaurantAgent(restaurantId: string): Promise<boolean> {
    try {
      // En un entorno real, aquí eliminarías el agente de Retell AI
      console.log(`🤖 Eliminando agente para ${restaurantId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error eliminando agente para ${restaurantId}:`, error);
      return false;
    }
  }

  /**
   * Listar todos los agentes de restaurantes
   */
  static async listRestaurantAgents(): Promise<RestaurantRetellConfig[]> {
    try {
      // En un entorno real, esto vendría de una base de datos
      // Por ahora, retornamos una lista simulada
      return [];
    } catch (error) {
      console.error(`❌ Error listando agentes:`, error);
      return [];
    }
  }

  /**
   * Verificar estado de un agente
   */
  static async checkAgentStatus(restaurantId: string): Promise<{
    status: 'active' | 'inactive' | 'error';
    lastActivity?: string;
    totalCalls?: number;
  }> {
    try {
      // En un entorno real, esto consultaría la API de Retell AI
      return {
        status: 'active',
        lastActivity: new Date().toISOString(),
        totalCalls: 0
      };
    } catch (error) {
      console.error(`❌ Error verificando estado del agente ${restaurantId}:`, error);
      return {
        status: 'error'
      };
    }
  }
}
