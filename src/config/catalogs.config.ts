export type CatalogSource =
  | { type: 'static'; options: string[] }
  | {
      type: 'csv';
      file: string;
      column: string;
      distinct?: boolean;
      dependsOn?: { key: string; column: string }[]; // ahora array
    };

export const catalogs: Record<string, CatalogSource> = {
  // estáticos de ejemplo
  TIPO_SOLICITUD: { type: 'static', options: ['ALTA', 'BAJA', 'CAMBIO'] },

  //Unidad Administrativa desde areas.csv
    // UNIDAD_ADMINISTRATIVA: {
    //   type: 'csv',
    //   file: 'areas.csv',
    //   column: 'unidad administrativa',
    //   distinct: true
    // },

    //Unidad Administrativa desde unidad_administrativa.csv
    UNIDAD_ADMINISTRATIVA: {
        type: 'csv',
        file: 'unidad_administrativa.csv',
        column: 'unidad administrativa',
        distinct: true
    },
    //Areas desde unidad_administrativa.csv
    AREA: {
        type: 'csv',
        file: 'unidad_administrativa.csv',
        column: "Area Gerencias / Coordinaciones",
        distinct: true,
        dependsOn: [
            { key: 'UNIDAD_ADMINISTRATIVA', column: 'unidad administrativa' }
        ]
    },
    //Puestos desde puestos.csv
    PUESTO_SOLICITANTE: {
        type: 'csv',
        file: 'puestos.csv',
        column: 'puestos',
        distinct: true,
    },
    PUESTO_USUARIO: {
        type: 'csv',
        file: 'puestos.csv',
        column: 'puestos',
        distinct: true,
    },
    PUESTO_AUTORIZA: {
        type: 'csv',
        file: 'puestos.csv',
        column: 'puestos',
        distinct: true,
    },
    PUESTO_RESPONSABLE_CONAGUA: {
        type: 'csv',
        file: 'puestos.csv',
        column: 'puestos',
        distinct: true,
    },
    //Sistema desde sistema.csv
    SISTEMA: {
        type: 'csv',
        file: 'sistemas.csv',
        column: 'sistema',
        distinct: true,
    },
    //Tipo cuenta desde tipo_cuenta.csv
    TIPO_CUENTA: {
        type: 'csv',
        file: 'tipo_cuenta.csv',
        column: 'tipo de cuenta',
        distinct: true,
    },
  
};