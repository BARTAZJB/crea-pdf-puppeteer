import { prisma } from '../services/prismaClient';
import bcrypt from 'bcryptjs';

const createAdmin = async () => {
    const email = 'admin@conagua.gob.mx';
    const password = 'admin'; // Cambia esto si quieres una contraseña diferente
    const nombre = 'Administrador Conagua';

    try {
        // Verificar si ya existe
        const existingUser = await prisma.usuario.findUnique({ where: { email } });
        if (existingUser) {
            console.log('⚠️ El usuario administrador ya existe.');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.usuario.create({
            data: {
                email,
                password: hashedPassword,
                nombre,
                // Si agregaras un campo 'rol' al schema, aquí pondrías 'ADMIN'
                // Por ahora, lo manejaremos por email en el backend
            }
        });

        console.log(`✅ Usuario administrador creado: ${user.email} (Password: ${password})`);
    } catch (error) {
        console.error('❌ Error creando administrador:', error);
    } finally {
        await prisma.$disconnect();
    }
};

createAdmin();