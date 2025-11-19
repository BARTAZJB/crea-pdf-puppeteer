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
  TIPO_CUENTA:    { type: 'static', options: ['GENERICA', 'PERSONAL', 'SERVICIO'] },

  // ÁREAS (areas.csv)
  UNIDAD_ADMINISTRATIVA: {
    type: 'csv',
    file: 'areas.csv',
    column: 'unidad administrativa',
    distinct: true
  },
  DIRECCION_SUBDIRECCION: {
    type: 'csv',
    file: 'areas.csv',
    column: 'direcciones/subdirecciones',
    distinct: true,
    dependsOn: [{ key: 'UNIDAD_ADMINISTRATIVA', column: 'unidad administrativa' }]
  },
  AREA: {
    type: 'csv',
    file: 'areas.csv',
    // header muy largo; se usa normalización para capturarlo
    column: 'Áreas (ejemplo: personal, financieros, recursos materiales, distritos de riego, observatorios, meteorológicos, residenciasetc.)',
    distinct: true,
    dependsOn: [
      { key: 'UNIDAD_ADMINISTRATIVA', column: 'unidad administrativa' },
      { key: 'DIRECCION_SUBDIRECCION', column: 'direcciones/subdirecciones' }
    ]
  },

  // Unidad administrativa / Gerencias (unidad_administrativa.csv)
  UA_UNIDAD_ADMINISTRATIVA: {
    type: 'csv',
    file: 'unidad_administrativa.csv',
    column: 'unidad administrativa',
    distinct: true
  },
  GERENCIA_COORDINACION: {
    type: 'csv',
    file: 'unidad_administrativa.csv',
    column: 'area gerencias / coordinaciones',
    distinct: true,
    dependsOn: [{ key: 'UA_UNIDAD_ADMINISTRATIVA', column: 'unidad administrativa' }]
  },

  // Ya existentes (ejemplo)
  AREA_SIMPLE: { type: 'csv', file: 'areas.csv', column: 'unidad administrativa', distinct: true }
};