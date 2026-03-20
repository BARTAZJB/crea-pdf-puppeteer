import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Configuración SMTP Básica
// En desarrollo puede usar variables o valores por defecto
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'internal-smtp.conagua.gob.mx', // Ajustar al real
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: process.env.SMTP_USER ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        } : undefined,
        tls: {
          rejectUnauthorized: false // Often needed for internal SMTP servers/relays
        }
    });
};

const transporter = createTransporter();

// Función genérica para enviar HTML
export const sendEmail = async (to: string, subject: string, html: string) => {
    if (!process.env.SMTP_HOST) {
        console.log(`
        📧 [SIMULACIÓN CORREO]
        ----------------------------------------
        Para:    ${to}
        Asunto:  ${subject}
        ----------------------------------------
        ${html.replace(/<[^>]*>/g, ' ').substring(0, 150)}...
        ----------------------------------------
        (Configura SMTP_HOST en .env para envio real)
        `);
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"Sistema Formato ABC" <${process.env.SMTP_USER || 'no-reply@conagua.gob.mx'}>`, 
            to, 
            subject, 
            html, 
        });
        console.log(`✅ [EMAIL] Enviado: ${info.messageId}`);
    } catch (error) {
        console.error('❌ [EMAIL] Error enviando:', error);
        throw error;
    }
};

const FIELD_LABELS: Record<string, string> = {
    'JUSTIFICACION': 'Justificación',
    'NOMBRES_USUARIO': 'Nombre(s)',
    'APELLIDOS_USUARIO': 'Apellidos',
    'NOMBRE_DEL_USUARIO': 'Nombre Completo',
    'PUESTO': 'Puesto',
    'UNIDAD_ADMINISTRATIVA': 'Unidad administrativa a la que pertenece',
    'AREA': 'Área a la que pertenece',
    'CURP': 'CURP',
    'RFC': 'RFC',
    'EXTENSION': 'Extensión',
    'CIUDAD': 'Ciudad',
    'ESTADO': 'Estado',
    'CODIGO_POSTAL': 'Código Postal',
    'DIRECCION': 'Dirección',
    'FECHA_INICIO_ACTIVIDADES': 'Inicio de actividades (DD/MM/AAAA)',
    'FECHA_SOLICITUD': 'Fecha de Solicitud',
    'NO_EMPLEADO': 'No. de Empleado',
    'CORREO_ELECTRONICO': 'Correo Electrónico',
    'TELEFONO': 'Teléfono',
    'CELULAR': 'Celular',
    'JEFE_INMEDIATO': 'Jefe Inmediato',
    'PUESTO_JEFE': 'Puesto del Jefe',
    // Agrega más según los campos reales
};

export const sendPendingReportEmail = async (templateName: string, data: Record<string, any>) => {
    // 1. Filtrar campos vacíos y formatear
    const lines: string[] = [];
    
    // Justificación va primero si existe
    if (data['JUSTIFICACION']) {
        lines.push(`<strong>Justificación:</strong> ${data['JUSTIFICACION']}`);
        lines.push('<br/>');
    }

    lines.push('<strong>Datos:</strong>');
    lines.push('<ul>');

    // Orden priorizado de campos comunes
    const priorityKeys = [
        'NOMBRES_USUARIO', 'APELLIDOS_USUARIO', 'NOMBRE_DEL_USUARIO', 
        'PUESTO', 'UNIDAD_ADMINISTRATIVA', 'AREA', 
        'CURP', 'RFC', 'EXTENSION', 'CIUDAD', 'ESTADO', 'CODIGO_POSTAL', 'DIRECCION',
        'FECHA_INICIO_ACTIVIDADES'
    ];

    // Primero los prioritarios
    priorityKeys.forEach(key => {
        if (data[key]) {
            const label = FIELD_LABELS[key] || key;
            lines.push(`<li><strong>${label}:</strong> ${data[key]}</li>`);
        }
    });

    // Luego el resto (que no estén en prioritarios ni sean metadatos o vacíos)
    Object.keys(data).forEach(key => {
        if (priorityKeys.includes(key) || key === 'JUSTIFICACION' || key === 'REPORTE_MESA_SERVICIOS') return;
        if (!data[key] || typeof data[key] !== 'string') return;
        if (key === 'DIRECCION_ID') return;
        
        // Ignorar claves internas si las hay
        if (key.startsWith('_') || key === 'templateName') return;

        const label = FIELD_LABELS[key] || key.replace(/_/g, ' ');
        lines.push(`<li><strong>${label}:</strong> ${data[key]}</li>`);
    });

    lines.push('</ul>');

    const htmlBody = `
        <h3>Solicitud de Número de Reporte - ${templateName.replace(/_/g, ' ').replace('.html', '')}</h3>
        <p>Se ha generado una solicitud que requiere un número de reporte de mesa de servicios.</p>
        <p>Por favor, genere el ticket correspondiente con la siguiente información:</p>
        <hr/>
        ${lines.join('\n')}
        <hr/>
        <p><small>Este es un mensaje automático del sistema de generación de PDF.</small></p>
    `;

    const mailOptions = {
        from: process.env.EMAIL_FROM || '"Sistema PDF" <noreply@conagua.gob.mx>',
        to: process.env.EMAIL_TO_SUPPORT || 'asesor.sii08@conagua.gob.mx', // Cambiar por el real
        subject: `[PENDIENTE REPORTE] ${templateName.replace(/_/g, ' ').replace('.html', '')} - ${data['NOMBRES_USUARIO'] || data['NOMBRE_DEL_USUARIO'] || 'Usuario'}`,
        html: htmlBody
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Correo enviado:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error enviando correo:', error);
        return false;
    }
};
