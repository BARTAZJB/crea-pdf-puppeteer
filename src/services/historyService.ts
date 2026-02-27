import { prisma } from './prismaClient';

interface RegistroPDFInput {
  tipoMovimiento: string;
  nombreUsuario: string;
  plantilla: string;
  archivoPath: string;
  datosFormatoId?: number; // Agregado
}

export const addHistory = async (data: RegistroPDFInput) => {
  return await prisma.registroPDF.create({
    data: {
      tipoMovimiento: data.tipoMovimiento,
      nombreUsuario: data.nombreUsuario,
      plantilla: data.plantilla,
      archivoPath: data.archivoPath,
      datosFormatoId: data.datosFormatoId, // Agregado
    },
  });
};

export const getHistory = async () => {
  return await prisma.registroPDF.findMany({
    orderBy: {
      fechaCreacion: 'desc',
    },
  });
};
