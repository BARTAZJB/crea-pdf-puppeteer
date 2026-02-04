export type CatalogSource =
  | { type: 'static'; options: string[] }
  | {
      type: 'csv';
      file: string;
      column: string;
      distinct?: boolean;
      dependsOn?: { key: string; column: string }[];
    };

export const catalogs: Record<string, CatalogSource> = {
    // Estáticos
    TIPO_SOLICITUD: { type: 'static', options: ['ALTA', 'BAJA', 'CAMBIO'] },

    // Dinámicos (CSV)
    UNIDAD_ADMINISTRATIVA: {
        type: 'csv',
        file: 'unidad_administrativa.csv',
        column: 'NOMBRE', 
        distinct: true
    },
    AREA: {
        type: 'csv',
        file: 'areas.csv',
        column: 'NOMBRE',
        distinct: true,
        dependsOn: [
            { key: 'UNIDAD_ADMINISTRATIVA', column: 'ID_UNIDAD_ADMINISTRATIVA' } 
        ]
    },
    // Puestos (Reutilizamos puestos.csv para todos)
    PUESTO_SOLICITANTE: { type: 'csv', file: 'puestos.csv', column: 'NOMBRE', distinct: true },
    PUESTO_USUARIO: { type: 'csv', file: 'puestos.csv', column: 'NOMBRE', distinct: true },
    PUESTO_AUTORIZA: { type: 'csv', file: 'puestos.csv', column: 'NOMBRE', distinct: true },
    PUESTO_RESPONSABLE_CONAGUA: { type: 'csv', file: 'puestos.csv', column: 'NOMBRE', distinct: true },
    
    // Sistemas y Cuentas
    SISTEMA: { type: 'csv', file: 'sistemas.csv', column: 'NOMBRE', distinct: true },
    TIPO_CUENTA: { type: 'csv', file: 'tipo_cuenta.csv', column: 'NOMBRE', distinct: true },

    // --- JUSTIFICACIÓN ---
    JUSTIFICACION: {
        type: 'csv',
        file: 'justificacion.csv',
        column: 'JUSTIFICACION', 
        distinct: false 
    }
};