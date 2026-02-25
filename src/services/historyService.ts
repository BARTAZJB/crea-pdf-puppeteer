import { prisma } from './prismaClient';

interface RegistroPDFInput {
  tipoMovimiento: string;
  nombreUsuario: string;
  plantilla: string;
  archivoPath: string;
}

export const addHistory = async (data: RegistroPDFInput) => {
  return await prisma.registroPDF.create({
    data: {
      tipoMovimiento: data.tipoMovimiento,
      nombreUsuario: data.nombreUsuario,
      plantilla: data.plantilla,
      archivoPath: data.archivoPath,
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
