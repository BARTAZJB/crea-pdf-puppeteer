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

export const saveDatosFormato = async (input: DatosFormatoInput & { usuarioId?: number }) => {
    const datos = input.datosJson as any;
    const reporte = datos?.REPORTE_MESA_SERVICIOS;
    const estado = (reporte && String(reporte).trim().length > 0) ? 'COMPLETO' : 'PENDIENTE';

    // Si viene ID, intentamos actualizar el registro existente
    if (input.id) {
        try {
            return await prisma.datosFormato.update({
                where: { id: Number(input.id) },
                data: {
                    nombreUsuario: input.nombreUsuario,
                    plantilla: input.plantilla,
                    datosJson: input.datosJson,
                    estado,
                    usuarioId: input.usuarioId // Actualizar dueño si cambia (o nuevo)
                }
            });
        } catch (error) {
            console.warn(`No se encontró registro para actualizar (ID: ${input.id}). Creando nuevo.`);
            // Si falla update (ej. no existe), cae al create de abajo
        }
    }

    // Crear nuevo registro
    return await prisma.datosFormato.create({
        data: {
            nombreUsuario: input.nombreUsuario,
            plantilla: input.plantilla,
            datosJson: input.datosJson,
            estado,
            usuarioId: input.usuarioId
        },
    });
};

export const getDatosFormatoById = async (id: number, usuarioId?: number, userType?: string) => {
  const item = await prisma.datosFormato.findUnique({
    where: { id },
    include: { usuario: true }
  });

  if (!item) return null;

  // Si se pasa usuarioId y no es Admin, validamos pertenencia
  if (usuarioId && userType !== 'ADMIN') {
      if (item.usuarioId !== usuarioId) return null; // O lanzar error, pero null simula "no encontrado"
  }

  return item;
};

export const updateDatosFormatoReporte = async (id: number, reporte: string) => {
    // 1. Buscamos el registro
    const record = await prisma.datosFormato.findUnique({ where: { id } });
    if (!record) throw new Error('Registro no encontrado');

    // 2. Actualizamos el JSON con el nuevo reporte y cambiamos estado a COMPLETO
    const newJson: any = { ...(record.datosJson as object), REPORTE_MESA_SERVICIOS: reporte };
    
    return await prisma.datosFormato.update({
        where: { id },
        data: {
            datosJson: newJson,
            estado: 'COMPLETO'
        }
    });
};



export const listDatosFormato = async (usuarioId?: number, userType?: string) => {
    // Si es ADMIN, ignora el filtro usuarioId
    const isAdmin = userType === 'ADMIN';
    const whereClause = (usuarioId && !isAdmin) ? { usuarioId } : {};

    return await prisma.datosFormato.findMany({
        where: whereClause,
        include: { 
            usuario: true,
            pdfsGenerados: {
                orderBy: { fechaCreacion: 'desc' },
                take: 1
            }
        }, 
        orderBy: { fechaActualizacion: 'desc' },
        take: 20 
    });
};

export const listPendientes = async (usuarioId?: number, userType?: string) => {
    const isAdmin = userType === 'ADMIN';
    const whereClause: any = { estado: 'PENDIENTE' };
    if (usuarioId && !isAdmin) whereClause.usuarioId = usuarioId;

    return await prisma.datosFormato.findMany({
        where: whereClause,
        include: { usuario: true }, 
        orderBy: { fechaCreacion: 'desc' },
    });
};

export const searchDatosFormatoByReporte = async (reporte: string, usuarioId?: number, userType?: string) => {
    // Filtrado dentro del JSONB de Postgres
    const isAdmin = userType === 'ADMIN';
    const whereClause: any = {
        datosJson: {
            path: ['REPORTE_MESA_SERVICIOS'],
            string_contains: reporte
        }
    };
    if (usuarioId && !isAdmin) whereClause.usuarioId = usuarioId;

    return await prisma.datosFormato.findMany({
        where: whereClause,
        include: { 
            usuario: true,
            pdfsGenerados: {
                 orderBy: { fechaCreacion: 'desc' },
                 take: 1
            }
        }, 
        orderBy: { fechaActualizacion: 'desc' },
        take: 50
    });
};

