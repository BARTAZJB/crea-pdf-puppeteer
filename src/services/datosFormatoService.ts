import { prisma } from './prismaClient';

export interface DatosFormatoInput {
  id?: number;
  nombreUsuario: string;
  plantilla: string;
  datosJson: any; // Objeto completo
}
    
// Type for JSON filter (Prisma raw filtering or specific JSON methods might differ slightly)
// For robust JSON filtering, sometimes we need raw queries or JSON path syntax depending on DB.
// Using Prisma JSON filter for PostgreSQL:
export const saveDatosFormato = async (input: DatosFormatoInput) => {

  // SIEMPRE creamos un registro nuevo para historial completo
  return await prisma.datosFormato.create({
    data: {
      nombreUsuario: input.nombreUsuario,
      plantilla: input.plantilla,
      datosJson: input.datosJson,
    },
  });
};

export const getDatosFormatoById = async (id: number) => {
  return await prisma.datosFormato.findUnique({
    where: { id },
  });
};

export const listDatosFormato = async () => {
    return await prisma.datosFormato.findMany({
        orderBy: { fechaActualizacion: 'desc' },
        take: 15
    });
};

export const searchDatosFormatoByReporte = async (reporte: string) => {
    // Filtrado dentro del JSONB de Postgres
    return await prisma.datosFormato.findMany({
        where: {
            datosJson: {
                path: ['REPORTE_MESA_SERVICIOS'],
                string_contains: reporte
            }
        },
        orderBy: { fechaActualizacion: 'desc' },
        take: 50
    });
};

