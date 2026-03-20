import { prisma } from '../src/services/prismaClient';
import bcrypt from 'bcryptjs';

const seedData = async () => {
    try {
        console.log('🚀 [SEED] Iniciando script de migración y sembrado de datos...');

        // 1. Asegurar usuario ADMIN (admin@conagua.gob.mx)
        const adminEmail = 'admin@conagua.gob.mx';
        let adminUser = await prisma.usuario.findUnique({ where: { email: adminEmail } });

        if (!adminUser) {
            console.log(`[SEED] Creando usuario ADMIN: ${adminEmail}`);
            const hashedPassword = await bcrypt.hash('admin', 10);
            adminUser = await prisma.usuario.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    nombre: 'Administrador Conagua',
                    organismo: 'CONAGUA Central'
                }
            });
            console.log(`✅ Usuario Admin creado. ID: ${adminUser.id}`);
        } else {
            console.log(`ℹ️ Usuario Admin ya existe. ID: ${adminUser.id}`);
        }

        // 2. Asegurar segundo usuario estándar (usuario@conagua.gob.mx)
        // Esto cubre el caso de "los dos usuarios que existen" para pruebas/demo
        const operatorEmail = 'usuario@conagua.gob.mx';
        let operatorUser = await prisma.usuario.findUnique({ where: { email: operatorEmail } });

        if (!operatorUser) {
            console.log(`[SEED] Creando usuario OPERADOR: ${operatorEmail}`);
            const hashedPassword = await bcrypt.hash('usuario', 10);
            operatorUser = await prisma.usuario.create({
                data: {
                    email: operatorEmail,
                    password: hashedPassword,
                    nombre: 'Usuario Operador',
                    organismo: 'CONAGUA Operaciones'
                }
            });
            console.log(`✅ Usuario Operador creado. ID: ${operatorUser.id}`);
        } else {
            console.log(`ℹ️ Usuario Operador ya existe. ID: ${operatorUser.id}`);
        }

        // 3. MIGRACIÓN DE DATOS HUÉRFANOS (Backward Compatibility)
        // Si hay registros creados antes de v1.8.0 (usuarioId = NULL), asignarlos al ADMIN.
        const orphanCount = await prisma.datosFormato.count({
            where: { usuarioId: null }
        });

        if (orphanCount > 0) {
            console.log(`⚠️ Encontrados ${orphanCount} registros huérfanos (sin usuario). Asignando a Admin (ID: ${adminUser.id})...`);
            
            // Actualizar DatosFormato
            const updateResult = await prisma.datosFormato.updateMany({
                where: { usuarioId: null },
                data: { usuarioId: adminUser.id }
            });
            
            console.log(`✅ ${updateResult.count} registros migrados exitosamente al usuario Admin.`);
        } else {
            console.log('✅ No se encontraron registros huérfanos pendientes de migración.');
        }

    } catch (e) {
        console.error('❌ Error en script de sembrado/migración:', e);
    } finally {
        await prisma.$disconnect();
    }
};

seedData();