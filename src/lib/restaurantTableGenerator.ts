/**
 * Generador automático de mesas para nuevos restaurantes
 */

export interface MesaTemplate {
  id: string;
  numero: string;
  capacidad: number;
  ubicacion: string;
  estado: 'libre';
}

export interface RestaurantConfig {
  id: string;
  name: string;
  capacity: number;
  hasTerraza?: boolean;
  hasPrivada?: boolean;
}

export class RestaurantTableGenerator {
  /**
   * Generar mesas automáticamente para un nuevo restaurante
   */
  static generateTablesForRestaurant(config: RestaurantConfig): MesaTemplate[] {
    const mesas: MesaTemplate[] = [];
    let mesaCounter = 1;

    // Calcular distribución de mesas basada en capacidad
    const totalMesas = Math.ceil(config.capacity / 4); // Aproximadamente 4 personas por mesa
    const mesasInterior = Math.ceil(totalMesas * 0.7); // 70% interior
    const mesasTerraza = config.hasTerraza ? Math.ceil(totalMesas * 0.25) : 0; // 25% terraza
    const mesasPrivada = config.hasPrivada ? Math.ceil(totalMesas * 0.05) : 0; // 5% privada

    // Generar mesas de interior
    for (let i = 0; i < mesasInterior; i++) {
      const capacidad = this.getRandomCapacity([2, 4, 6]);
      mesas.push({
        id: `mesa_${mesaCounter}`,
        numero: mesaCounter.toString(),
        capacidad,
        ubicacion: 'Interior',
        estado: 'libre'
      });
      mesaCounter++;
    }

    // Generar mesas de terraza
    if (config.hasTerraza) {
      for (let i = 0; i < mesasTerraza; i++) {
        const capacidad = this.getRandomCapacity([2, 4, 6, 8]);
        mesas.push({
          id: `mesa_t${i + 1}`,
          numero: `T${i + 1}`,
          capacidad,
          ubicacion: 'Terraza',
          estado: 'libre'
        });
      }
    }

    // Generar mesa privada
    if (config.hasPrivada) {
      mesas.push({
        id: 'mesa_privada',
        numero: 'P',
        capacidad: 12,
        ubicacion: 'Privada',
        estado: 'libre'
      });
    }

    console.log(`✅ Generadas ${mesas.length} mesas para ${config.name} (${config.id})`);
    return mesas;
  }

  /**
   * Generar configuración específica para La Gaviota
   */
  static generateLaGaviotaTables(): MesaTemplate[] {
    return [
      { id: 'mesa_1', numero: '1', capacidad: 2, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_2', numero: '2', capacidad: 2, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_3', numero: '3', capacidad: 4, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_4', numero: '4', capacidad: 4, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_5', numero: '5', capacidad: 6, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_6', numero: '6', capacidad: 6, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_t1', numero: 'T1', capacidad: 2, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_t2', numero: 'T2', capacidad: 4, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_t3', numero: 'T3', capacidad: 4, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_t4', numero: 'T4', capacidad: 6, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_t5', numero: 'T5', capacidad: 8, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_privada', numero: 'P', capacidad: 12, ubicacion: 'Privada', estado: 'libre' }
    ];
  }

  /**
   * Generar configuración específica para El Buen Sabor
   */
  static generateElBuenSaborTables(): MesaTemplate[] {
    return [
      { id: 'mesa_1', numero: '1', capacidad: 2, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_2', numero: '2', capacidad: 4, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_3', numero: '3', capacidad: 4, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_4', numero: '4', capacidad: 6, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_5', numero: '5', capacidad: 6, ubicacion: 'Interior', estado: 'libre' },
      { id: 'mesa_t1', numero: 'T1', capacidad: 2, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_t2', numero: 'T2', capacidad: 4, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_t3', numero: 'T3', capacidad: 4, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_t4', numero: 'T4', capacidad: 6, ubicacion: 'Terraza', estado: 'libre' },
      { id: 'mesa_t5', numero: 'T5', capacidad: 8, ubicacion: 'Terraza', estado: 'libre' }
    ];
  }

  /**
   * Obtener mesas para un restaurante específico
   */
  static getTablesForRestaurant(restaurantId: string): MesaTemplate[] {
    switch (restaurantId) {
      case 'rest_003':
        return this.generateLaGaviotaTables();
      case 'rest_004':
        return this.generateElBuenSaborTables();
      default:
        // Para restaurantes nuevos, generar automáticamente
        console.warn(`⚠️ Restaurante ${restaurantId} no encontrado, generando mesas automáticamente`);
        return this.generateTablesForRestaurant({
          id: restaurantId,
          name: `Restaurante ${restaurantId}`,
          capacity: 40, // Capacidad por defecto
          hasTerraza: true,
          hasPrivada: false
        });
    }
  }

  private static getRandomCapacity(options: number[]): number {
    return options[Math.floor(Math.random() * options.length)];
  }
}
