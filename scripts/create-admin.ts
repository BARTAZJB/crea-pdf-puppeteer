// Script para crear un administrador (o actualizarlo)

import { prisma } from '../src/services/prismaClient'; // Import from service, NOT create new instance
import bcrypt from 'bcryptjs';

const createAdmin = async () => {
    const email = 'admin@conagua.gob.mx';
    const password = 'admin'; // Cambiar en prod
    const nombre = 'Administrador Conagua';

    try {
        console.log('--- Iniciando creación de ADMIN ---');
        
        // 1. Verificar si existe
        const existing = await prisma.usuario.findUnique({ where: { email } });

        if (existing) {
            console.log(`⚠️ El usuario ${email} ya existe. ID: ${existing.id}`);
        } else {
            // 2. Crear si no existe
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await prisma.usuario.create({
                data: {
                    email,
                    password: hashedPassword,
                    nombre
                }
            });
            console.log(`✅ Usuario Creado Exitosamente:
            Email: ${user.email}
            Pass:  ${password}
            ID:    ${user.id}`);
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await prisma.$disconnect();
    }
};

createAdmin();