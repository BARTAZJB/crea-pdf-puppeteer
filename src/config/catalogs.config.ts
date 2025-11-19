export type CatalogSource =
  | { type: 'static'; options: string[] }
  | { type: 'csv'; file: string; column: string; distinct?: boolean; dependsOn?: { key: string; column: string } };

export const catalogs: Record<string, CatalogSource> = {
  // estáticos de ejemplo
  TIPO_SOLICITUD: { type: 'static', options: ['ALTA', 'BAJA', 'CAMBIO'] },
  TIPO_CUENTA:    { type: 'static', options: ['GENERICA', 'PERSONAL', 'SERVICIO'] },

  // CSV en src/views/docs/csv/
  AREA: { type: 'csv', file: 'areas.csv', column: 'area', distinct: true },

  UNIDAD_ADMINISTRATIVA: {
    type: 'csv',
    file: 'unidad_administrativa.csv',
    column: 'unidad_administrativa',
    distinct: true
  },

  // direccion.csv debe tener columnas: estado y ciudad (si tu CSV usa "municipio", cambia column a 'municipio')
  ESTADO: { type: 'csv', file: 'direccion.csv', column: 'estado', distinct: true },
  CIUDAD: {
    type: 'csv',
    file: 'direccion.csv',
    column: 'ciudad',           // cámbialo a 'municipio' si aplica
    distinct: true,
    dependsOn: { key: 'ESTADO', column: 'estado' }
  },
};