import { prisma } from './prismaClient';

export interface DatosFormatoInput {
  id?: number;
  nombreUsuario: string;
  plantilla: string;
  datosJson: any; // Objeto completo
}

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
        take: 15 // Mostrar solo los últimos 15 registros modificados
    });
};
