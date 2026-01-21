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
  // estáticos de ejemplo
  TIPO_SOLICITUD: { type: 'static', options: ['ALTA', 'BAJA', 'CAMBIO'] },

    //Unidad Administrativa desde unidad_administrativa.csv
    UNIDAD_ADMINISTRATIVA: {
        type: 'csv',
        file: 'unidad_administrativa.csv',
        column: 'Unidad Administrativa', // CORREGIDO: Mayúsculas coinciden con CSV
        distinct: true
    },
    //Areas desde unidad_administrativa.csv
    AREA: {
        type: 'csv',
        file: 'unidad_administrativa.csv',
        // OJO: Tu CSV tiene un salto de linea aqui.
        // Lo ideal sería que abras el CSV y renombres la columna a solo "Area" para evitar problemas.
        // Si no puedes editar el CSV, intenta con esta cadena exacta:
        column: "Area\nGerencias / Coordinaciones", 
        distinct: true,
        dependsOn: [
            { key: 'UNIDAD_ADMINISTRATIVA', column: 'Unidad Administrativa' } // CORREGIDO
        ]
    },
    //Puestos desde puestos.csv
    PUESTO_SOLICITANTE: {
        type: 'csv',
        file: 'puestos.csv',
        column: 'Puestos', // CORREGIDO: P mayúscula
        distinct: true,
    },
    PUESTO_USUARIO: {
        type: 'csv',
        file: 'puestos.csv',
        column: 'Puestos', // CORREGIDO
        distinct: true,
    },
    PUESTO_AUTORIZA: {
        type: 'csv',
        file: 'puestos.csv',
        column: 'Puestos', // CORREGIDO
        distinct: true,
    },
    PUESTO_RESPONSABLE_CONAGUA: {
        type: 'csv',
        file: 'puestos.csv',
        column: 'Puestos', // CORREGIDO
        distinct: true,
    },
    //Sistema desde sistemas.csv
    SISTEMA: {
        type: 'csv',
        file: 'sistemas.csv',
        column: 'Sistema', // CORREGIDO: S mayúscula
        distinct: true,
    },
    //Tipo cuenta desde tipo_cuenta.csv
    TIPO_CUENTA: {
        type: 'csv',
        file: 'tipo_cuenta.csv',
        column: 'Tipo de cuenta', // CORREGIDO: T mayúscula
        distinct: true,
    },
};