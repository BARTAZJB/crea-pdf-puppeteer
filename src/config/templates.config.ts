export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'email' | 'tel';
  required: boolean;
  placeholder?: string;
  options?: string[];
  maxLength?: number;
}

export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  fileName: string;
  fields: TemplateField[];
}

// Configuraciones de plantillas
export const TEMPLATES_CONFIG: Record<string, TemplateConfig> = {
  alta_usuario_interno: {
    id: 'alta_usuario_interno',
    name: 'Alta de cuenta de usuario interno',
    description: 'Solicitud para dar de alta una cuenta de usuario interno de CONAGUA',
    fileName: 'Alta_de_cuenta_de_usuario_interno.html',
    fields: [
      { name: 'fecha_solicitud', label: 'Fecha de solicitud', type: 'date', required: true },
      { name: 'reporte_mesa_servicios', label: 'Reporte de Mesa de Servicios TI', type: 'text', required: true },
      { name: 'nombre_requisitante', label: 'Nombre del requisitante', type: 'text', required: true },
      { name: 'extension_requisitante', label: 'Extensión del requisitante', type: 'text', required: true },
      { name: 'nombre_solicitante', label: 'Nombre del solicitante', type: 'text', required: true },
      { name: 'puesto_solicitante', label: 'Puesto del solicitante', type: 'text', required: true },
      { name: 'nombre_autoriza', label: 'Nombre quien autoriza', type: 'text', required: true },
      { name: 'puesto_autoriza', label: 'Puesto quien autoriza', type: 'text', required: true },
      { name: 'nombres_usuario', label: 'Nombre(s) del usuario', type: 'text', required: true },
      { name: 'apellidos_usuario', label: 'Apellidos del usuario', type: 'text', required: true },
      { name: 'puesto_usuario', label: 'Puesto del usuario', type: 'text', required: true },
      { name: 'unidad_administrativa', label: 'Unidad Administrativa', type: 'text', required: true },
      { name: 'area', label: 'Área', type: 'text', required: true },
      { name: 'curp', label: 'CURP', type: 'text', required: true, maxLength: 18 },
      { name: 'rfc', label: 'RFC', type: 'text', required: true, maxLength: 13 },
      { name: 'extension', label: 'Extensión', type: 'text', required: true },
      { name: 'ciudad', label: 'Ciudad', type: 'text', required: true },
      { name: 'estado', label: 'Estado', type: 'text', required: true },
      { name: 'codigo_postal', label: 'Código Postal', type: 'text', required: true, maxLength: 5 },
      { name: 'direccion', label: 'Dirección', type: 'textarea', required: true },
      { name: 'inicio_actividades', label: 'Inicio de actividades', type: 'date', required: true },
      { name: 'justificacion', label: 'Justificación', type: 'textarea', required: true }
    ]
  },

  alta_cuenta_servicio: {
    id: 'alta_cuenta_servicio',
    name: 'Alta de cuenta de servicio',
    description: 'Solicitud para dar de alta una cuenta de servicio',
    fileName: 'Alta_de_cuenta_de_servicio.html',
    fields: [
      { name: 'fecha_solicitud', label: 'Fecha de solicitud', type: 'date', required: true },
      { name: 'reporte_mesa_servicios', label: 'Reporte de Mesa de Servicios TI', type: 'text', required: true },
      { name: 'nombre_requisitante', label: 'Nombre del requisitante', type: 'text', required: true },
      { name: 'extension_requisitante', label: 'Extensión del requisitante', type: 'text', required: true },
      { name: 'nombre_solicitante', label: 'Nombre del solicitante', type: 'text', required: true },
      { name: 'puesto_solicitante', label: 'Puesto del solicitante', type: 'text', required: true },
      { name: 'nombre_autoriza', label: 'Nombre quien autoriza', type: 'text', required: true },
      { name: 'puesto_autoriza', label: 'Puesto quien autoriza', type: 'text', required: true },
      { name: 'nombre_cuenta', label: 'Nombre de la cuenta de servicio', type: 'text', required: true },
      { name: 'tipo_cuenta', label: 'Tipo de cuenta', type: 'text', required: true },
      { name: 'sistema', label: 'Sistema', type: 'text', required: true },
      { name: 'inicio_actividades', label: 'Inicio de actividades', type: 'date', required: true },
      { name: 'justificacion', label: 'Justificación', type: 'textarea', required: true }
    ]
  },

  baja_usuario_interno: {
    id: 'baja_usuario_interno',
    name: 'Baja de cuenta de usuario interno',
    description: 'Solicitud para dar de baja una cuenta de usuario interno',
    fileName: 'Baja_de_cuenta_de_usuario_interno.html',
    fields: [
      { name: 'fecha_solicitud', label: 'Fecha de solicitud', type: 'date', required: true },
      { name: 'reporte_mesa_servicios', label: 'Reporte de Mesa de Servicios TI', type: 'text', required: true },
      { name: 'nombre_requisitante', label: 'Nombre del requisitante', type: 'text', required: true },
      { name: 'extension_requisitante', label: 'Extensión del requisitante', type: 'text', required: true },
      { name: 'nombre_solicitante', label: 'Nombre del solicitante', type: 'text', required: true },
      { name: 'puesto_solicitante', label: 'Puesto del solicitante', type: 'text', required: true },
      { name: 'nombre_autoriza', label: 'Nombre quien autoriza', type: 'text', required: true },
      { name: 'puesto_autoriza', label: 'Puesto quien autoriza', type: 'text', required: true },
      { name: 'nombres_usuario', label: 'Nombre(s) del usuario', type: 'text', required: true },
      { name: 'apellidos_usuario', label: 'Apellidos del usuario', type: 'text', required: true },
      { name: 'cuenta_usuario', label: 'Cuenta de usuario', type: 'text', required: true },
      { name: 'fin_actividades', label: 'Fin de actividades', type: 'date', required: true },
      { name: 'justificacion', label: 'Justificación', type: 'textarea', required: true }
    ]
  },

  baja_usuario_externo: {
    id: 'baja_usuario_externo',
    name: 'Baja de cuenta de usuario externo',
    description: 'Solicitud para dar de baja una cuenta de usuario externo',
    fileName: 'Baja_de_cuenta_de_usuario_externo.html',
    fields: [
      { name: 'fecha_solicitud', label: 'Fecha de solicitud', type: 'date', required: true },
      { name: 'reporte_mesa_servicios', label: 'Reporte de Mesa de Servicios TI', type: 'text', required: true },
      { name: 'nombre_requisitante', label: 'Nombre del requisitante', type: 'text', required: true },
      { name: 'extension_requisitante', label: 'Extensión del requisitante', type: 'text', required: true },
      { name: 'nombre_solicitante', label: 'Nombre del solicitante', type: 'text', required: true },
      { name: 'puesto_solicitante', label: 'Puesto del solicitante', type: 'text', required: true },
      { name: 'nombre_autoriza', label: 'Nombre quien autoriza', type: 'text', required: true },
      { name: 'puesto_autoriza', label: 'Puesto quien autoriza', type: 'text', required: true },
      { name: 'nombres_usuario', label: 'Nombre(s) del usuario externo', type: 'text', required: true },
      { name: 'apellidos_usuario', label: 'Apellidos del usuario externo', type: 'text', required: true },
      { name: 'cuenta_usuario', label: 'Cuenta de usuario', type: 'text', required: true },
      { name: 'fin_actividades', label: 'Fin de actividades', type: 'date', required: true },
      { name: 'justificacion', label: 'Justificación', type: 'textarea', required: true }
    ]
  },

  baja_cuenta_servicio: {
    id: 'baja_cuenta_servicio',
    name: 'Baja de cuenta de servicio',
    description: 'Solicitud para dar de baja una cuenta de servicio',
    fileName: 'Baja_de_cuenta_de_servicio.html',
    fields: [
      { name: 'fecha_solicitud', label: 'Fecha de solicitud', type: 'date', required: true },
      { name: 'reporte_mesa_servicios', label: 'Reporte de Mesa de Servicios TI', type: 'text', required: true },
      { name: 'nombre_requisitante', label: 'Nombre del requisitante', type: 'text', required: true },
      { name: 'extension_requisitante', label: 'Extensión del requisitante', type: 'text', required: true },
      { name: 'nombre_solicitante', label: 'Nombre del solicitante', type: 'text', required: true },
      { name: 'puesto_solicitante', label: 'Puesto del solicitante', type: 'text', required: true },
      { name: 'nombre_autoriza', label: 'Nombre quien autoriza', type: 'text', required: true },
      { name: 'puesto_autoriza', label: 'Puesto quien autoriza', type: 'text', required: true },
      { name: 'nombre_cuenta', label: 'Nombre de la cuenta de servicio', type: 'text', required: true },
      { name: 'tipo_cuenta', label: 'Tipo de cuenta', type: 'text', required: true },
      { name: 'fin_actividades', label: 'Fin de actividades', type: 'date', required: true },
      { name: 'justificacion', label: 'Justificación', type: 'textarea', required: true }
    ]
  },

  cambio_usuario_interno: {
    id: 'cambio_usuario_interno',
    name: 'Cambio en cuenta de usuario interno',
    description: 'Solicitud para modificar una cuenta de usuario interno',
    fileName: 'Cambio_en_cuenta_de_usuario_interno.html',
    fields: [
      { name: 'fecha_solicitud', label: 'Fecha de solicitud', type: 'date', required: true },
      { name: 'reporte_mesa_servicios', label: 'Reporte de Mesa de Servicios TI', type: 'text', required: true },
      { name: 'nombre_requisitante', label: 'Nombre del requisitante', type: 'text', required: true },
      { name: 'extension_requisitante', label: 'Extensión del requisitante', type: 'text', required: true },
      { name: 'nombre_solicitante', label: 'Nombre del solicitante', type: 'text', required: true },
      { name: 'puesto_solicitante', label: 'Puesto del solicitante', type: 'text', required: true },
      { name: 'nombre_autoriza', label: 'Nombre quien autoriza', type: 'text', required: true },
      { name: 'puesto_autoriza', label: 'Puesto quien autoriza', type: 'text', required: true },
      { name: 'nombres_usuario', label: 'Nombre(s) del usuario', type: 'text', required: true },
      { name: 'apellidos_usuario', label: 'Apellidos del usuario', type: 'text', required: true },
      { name: 'cuenta_usuario', label: 'Cuenta de usuario', type: 'text', required: true },
      { name: 'tipo_cambio', label: 'Tipo de cambio solicitado', type: 'textarea', required: true },
      { name: 'justificacion', label: 'Justificación', type: 'textarea', required: true }
    ]
  },

  cambio_usuario_externo: {
    id: 'cambio_usuario_externo',
    name: 'Cambio en cuenta de usuario externo',
    description: 'Solicitud para modificar una cuenta de usuario externo',
    fileName: 'Cambio_en_cuenta_de_usuario_externo.html',
    fields: [
      { name: 'fecha_solicitud', label: 'Fecha de solicitud', type: 'date', required: true },
      { name: 'reporte_mesa_servicios', label: 'Reporte de Mesa de Servicios TI', type: 'text', required: true },
      { name: 'nombre_requisitante', label: 'Nombre del requisitante', type: 'text', required: true },
      { name: 'extension_requisitante', label: 'Extensión del requisitante', type: 'text', required: true },
      { name: 'nombre_solicitante', label: 'Nombre del solicitante', type: 'text', required: true },
      { name: 'puesto_solicitante', label: 'Puesto del solicitante', type: 'text', required: true },
      { name: 'nombre_autoriza', label: 'Nombre quien autoriza', type: 'text', required: true },
      { name: 'puesto_autoriza', label: 'Puesto quien autoriza', type: 'text', required: true },
      { name: 'nombres_usuario', label: 'Nombre(s) del usuario externo', type: 'text', required: true },
      { name: 'apellidos_usuario', label: 'Apellidos del usuario externo', type: 'text', required: true },
      { name: 'cuenta_usuario', label: 'Cuenta de usuario', type: 'text', required: true },
      { name: 'tipo_cambio', label: 'Tipo de cambio solicitado', type: 'textarea', required: true },
      { name: 'justificacion', label: 'Justificación', type: 'textarea', required: true }
    ]
  },

  cambio_cuenta_servicio: {
    id: 'cambio_cuenta_servicio',
    name: 'Cambio en cuenta de servicio',
    description: 'Solicitud para modificar una cuenta de servicio',
    fileName: 'Cambio_en_cuenta_de_servicio.html',
    fields: [
      { name: 'fecha_solicitud', label: 'Fecha de solicitud', type: 'date', required: true },
      { name: 'reporte_mesa_servicios', label: 'Reporte de Mesa de Servicios TI', type: 'text', required: true },
      { name: 'nombre_requisitante', label: 'Nombre del requisitante', type: 'text', required: true },
      { name: 'extension_requisitante', label: 'Extensión del requisitante', type: 'text', required: true },
      { name: 'nombre_solicitante', label: 'Nombre del solicitante', type: 'text', required: true },
      { name: 'puesto_solicitante', label: 'Puesto del solicitante', type: 'text', required: true },
      { name: 'nombre_autoriza', label: 'Nombre quien autoriza', type: 'text', required: true },
      { name: 'puesto_autoriza', label: 'Puesto quien autoriza', type: 'text', required: true },
      { name: 'nombre_cuenta', label: 'Nombre de la cuenta de servicio', type: 'text', required: true },
      { name: 'tipo_cuenta', label: 'Tipo de cuenta', type: 'text', required: true },
      { name: 'tipo_cambio', label: 'Tipo de cambio solicitado', type: 'textarea', required: true },
      { name: 'justificacion', label: 'Justificación', type: 'textarea', required: true }
    ]
  }
};

/**
 * Obtener configuración de plantilla por ID
 */
export function getTemplateConfig(templateId: string): TemplateConfig | undefined {
  return TEMPLATES_CONFIG[templateId];
}

/**
 * Obtener configuración de plantilla por nombre de archivo
 */
export function getTemplateConfigByFileName(fileName: string): TemplateConfig | undefined {
  // Buscar por fileName exacto
  let config = Object.values(TEMPLATES_CONFIG).find(c => c.fileName === fileName);
  
  // Si no se encuentra, intentar buscar por ID derivado del nombre
  if (!config) {
    const idFromFileName = fileName
      .replace('.html', '')
      .replace(/^(Alta|Baja|Cambio)_/i, '')
      .replace(/_de_/g, '_')
      .replace(/_en_/g, '_')
      .toLowerCase();
    
    config = TEMPLATES_CONFIG[idFromFileName];
  }
  
  return config;
}

/**
 * Listar todas las plantillas disponibles
 */
export function getAllTemplates(): TemplateConfig[] {
  return Object.values(TEMPLATES_CONFIG);
}