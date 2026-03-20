// src/services/authService.ts
import { prisma } from './prismaClient';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from './emailService';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'admin@conagua.gob.mx';

/**
 * Genera un token de recuperación y lo guarda en la BD
 */
export const requestPasswordReset = async (email: string) => {
    // 1. Buscar usuario
    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user) {
        // Por seguridad, no decimos si el usuario existe o no, pero logueamos
        console.log(`[AUTH] Intento de reset para email no existente: ${email}`);
        return false;
    }

    // 2. Generar token único (UUID) y expiración (1 hora)
    const token = uuidv4();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1);

    // 3. Guardar en BD
    await prisma.usuario.update({
        where: { id: user.id },
        data: {
            resetToken: token,
            resetTokenExpiry: expiry
        }
    });

    // 4. Construir enlace
    // Usamos BASE_URL del entorno o localhost como fallback para desarrollo
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000'; 
    
    // NOTA: Apuntamos a la ruta limpia '/reset-password' que acabamos de configurar en app.ts
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // Log para desarrollo (importante para que el usuario vea el link sin email real)

    // 5. Enviar correo
    const subject = 'Restablecimiento de Contraseña - Sistema Formato ABC';
    const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1b365d;">Solicitud de Restablecimiento de Contraseña</h2>
            <p>Hola <strong>${user.nombre}</strong>,</p>
            <p>Hemos recibido una solicitud para restablecer tu contraseña en el Sistema de Generación de Formatos ABC.</p>
            <p>Para crear una nueva contraseña, haz clic en el siguiente enlace:</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #1b365d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Restablecer Contraseña</a>
            </p>
            <p>o copia y pega la siguiente URL en tu navegador:</p>
            <code style="word-break: break-all; background: #eee; padding: 10px; display: block; margin-bottom: 20px;">
                ${resetLink}
            </code>
            <p>Este enlace expirará en <strong>1 hora</strong>.</p>
            <p>Si tú no solicitaste este cambio, puedes ignorar este correo.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">Sistema Automatizado Conagua</p>
        </div>
    `;

    // IMPRESIÓN DEL TOKEN EN CONSOLA (Para pruebas locales sin SMTP)
    console.log(`
    =======================================================
    🔑 [DEBUG] LINK DE RESETEO GENERADO:
    ${resetLink}
    =======================================================
    `);

    try {
        await sendEmail(user.email, subject, htmlBody);
        console.log(`[AUTH] Correo de recuperación enviado a ${email}`);
        return true;
    } catch (error) {
        console.error(`[AUTH] Error enviando correo a ${email}:`, error);
        return false;
    }
};

/**
 * Valida el token y actualiza la contraseña
 */
export const resetPassword = async (token: string, newPassword: string) => {
    // 1. Buscar usuario con ese token y que no haya expirado
    const user = await prisma.usuario.findFirst({
        where: {
            resetToken: token,
            resetTokenExpiry: {
                gt: new Date() // Expiry debe ser mayor a "ahora"
            }
        }
    });

    if (!user) {
        throw new Error('El enlace de recuperación es inválido o ha expirado.');
    }

    // 2. Hash nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Actualizar usuario y limpiar token
    await prisma.usuario.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null
        }
    });

    console.log(`[AUTH] Contraseña restablecida exitosamente para ${user.email}`);
    
    // 4. Notificar al usuario (confirmación)
    await sendEmail(
        user.email, 
        'Contraseña Actualizada Exitosamente',
        `<p>Hola <strong>${user.nombre}</strong>,</p><p>Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión.</p>`
    );
    
    return true;
};
