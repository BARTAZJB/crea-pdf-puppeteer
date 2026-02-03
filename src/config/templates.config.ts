import { TemplateConfig, TemplateField } from '../types';

// Campos comunes
const camposComunesSolicitud = [
  { name: 'fecha_solicitud', label: 'Fecha de solicitud', type: 'date', required: true },
  { name: 'reporte_mesa_servicios', label: 'Reporte de Mesa de Servicios TI', type: 'text', required: true },
  { name: 'nombre_requisitante', label: 'Nombre del requisitante', type: 'text', required: true },
  { name: 'extension_requisitante', label: 'Extensión del requisitante', type: 'text', required: true },
] as TemplateField[];

const camposComunesPersonas = [
  { name: 'nombre_solicitante', label: 'Nombre del solicitante', type: 'text', required: true },
  { name: 'puesto_solicitante', label: 'Puesto del solicitante', type: 'text', required: true },
  { name: 'nombre_autoriza', label: 'Nombre quien autoriza', type: 'text', required: true },
  { name: 'puesto_autoriza', label: 'Puesto quien autoriza', type: 'text', required: true },
] as TemplateField[];

const camposUsuario = [
  { name: 'nombres_usuario', label: 'Nombre(s) del usuario', type: 'text', required: true },
  { name: 'apellidos_usuario', label: 'Apellidos del usuario', type: 'text', required: true },
  { name: 'puesto_usuario', label: 'Puesto del usuario', type: 'text', required: true },
  { name: 'unidad_administrativa', label: 'Unidad Administrativa', type: 'text', required: true },
  { name: 'area', label: 'Área', type: 'text', required: true },
  { name: 'curp_usuario', label: 'CURP', type: 'text', required: true },
  { name: 'rfc_usuario', label: 'RFC', type: 'text', required: true },
  { name: 'extension_usuario', label: 'Extensión', type: 'text', required: true },
  { name: 'ciudad', label: 'Ciudad', type: 'text', required: true },
  { name: 'estado', label: 'Estado', type: 'text', required: true },
  { name: 'codigo_postal', label: 'Código Postal', type: 'text', required: true },
  { name: 'direccion', label: 'Dirección', type: 'textarea', required: true },
] as TemplateField[];

const campoJustificacion = { name: 'justificacion', label: 'Justificación', type: 'select', required: true } as TemplateField;

export const TEMPLATES_CONFIG: Record<string, TemplateConfig> = {
  
  // --- ALTAS ---
  alta_servicio: {
    id: 'alta_servicio',
    name: 'Alta de cuenta de servicio',
    description: 'Solicitud de cuenta de servicio',
    fileName: 'Alta_de_cuenta_de_servicio.html',
    fields: [
      ...camposComunesSolicitud, ...camposComunesPersonas,
      { name: 'nombres_usuario', label: 'Nombre Usuario (Firma)', type: 'text', required: true },
      { name: 'apellidos_usuario', label: 'Apellidos Usuario (Firma)', type: 'text', required: true },
      { name: 'puesto_usuario', label: 'Puesto Usuario (Firma)', type: 'text', required: true },
      { name: 'inicio_actividades', label: 'Inicio de actividades', type: 'date', required: true },
      { name: 'nombre_cuenta', label: 'Nombre de la cuenta', type: 'text', required: true },
      { name: 'tipo_cuenta', label: 'Tipo de cuenta', type: 'text', required: true }, 
      { name: 'sistema', label: 'Sistema', type: 'text', required: true }, 
      campoJustificacion
    ]
  },
  alta_usuario_externo: {
    id: 'alta_usuario_externo',
    name: 'Alta de cuenta de usuario externo',
    description: 'Solicitud para personal externo',
    fileName: 'Alta_de_cuenta_de_usuario_externo.html',
    fields: [
      ...camposComunesSolicitud, ...camposComunesPersonas, ...camposUsuario,
      { name: 'inicio_actividades', label: 'Inicio de actividades', type: 'date', required: true },
      { name: 'fin_actividades', label: 'Fin de actividades', type: 'date', required: true },
      { name: 'nombre_cuenta', label: 'Nombre de la cuenta genérica', type: 'text', required: true },
      { name: 'nombre_responsable', label: 'Nombre responsable CONAGUA', type: 'text', required: true },
      { name: 'puesto_responsable', label: 'Puesto responsable CONAGUA', type: 'text', required: true },
      campoJustificacion
    ]
  },
  alta_usuario_externo_honorarios: {
    id: 'alta_usuario_externo_honorarios',
    name: 'Alta de cuenta de usuario externo (Honorarios)',
    description: 'Solicitud para personal externo (Honorarios)',
    fileName: 'Alta_de_cuenta_de_usuario_externo.html', 
    fields: [
      ...camposComunesSolicitud, ...camposComunesPersonas, ...camposUsuario,
      { name: 'inicio_actividades', label: 'Inicio de actividades', type: 'date', required: true },
      { name: 'fin_actividades', label: 'Fin de actividades', type: 'date', required: true },
      { name: 'nombre_cuenta', label: 'Nombre de la cuenta genérica', type: 'text', required: true },
      { name: 'nombre_responsable', label: 'Nombre responsable CONAGUA', type: 'text', required: true },
      { name: 'puesto_responsable', label: 'Puesto responsable CONAGUA', type: 'text', required: true },
      campoJustificacion
    ]
  },
  alta_usuario_interno: {
    id: 'alta_usuario_interno',
    name: 'Alta de cuenta de usuario interno',
    description: 'Solicitud para personal interno',
    fileName: 'Alta_de_cuenta_de_usuario_interno.html',
    fields: [
      ...camposComunesSolicitud, ...camposComunesPersonas, ...camposUsuario,
      { name: 'inicio_actividades', label: 'Inicio de actividades', type: 'date', required: true },
      campoJustificacion
    ]
  },

  // --- BAJAS ---
  baja_servicio: {
    id: 'baja_servicio',
    name: 'Baja de cuenta de servicio',
    description: 'Baja de servicio',
    fileName: 'Baja_de_cuenta_de_servicio.html',
    fields: [
      ...camposComunesSolicitud, ...camposComunesPersonas,
      { name: 'nombre_cuenta', label: 'Nombre de la cuenta', type: 'text', required: true },
      { name: 'tipo_cuenta', label: 'Tipo de cuenta', type: 'text', required: true },
      { name: 'sistema', label: 'Sistema', type: 'text', required: true },
      { name: 'fecha_baja', label: 'Fecha de baja', type: 'date', required: true },
      { name: 'nombres_usuario', label: 'Nombre Usuario (Firma)', type: 'text', required: true },
      { name: 'apellidos_usuario', label: 'Apellidos Usuario (Firma)', type: 'text', required: true },
      { name: 'puesto_usuario', label: 'Puesto Usuario (Firma)', type: 'text', required: true },
      campoJustificacion
    ]
  },
  baja_usuario_externo: {
    id: 'baja_usuario_externo',
    name: 'Baja de cuenta de usuario externo',
    description: 'Baja para personal externo',
    fileName: 'Baja_de_cuenta_de_usuario_externo.html',
    fields: [
      ...camposComunesSolicitud, ...camposComunesPersonas, ...camposUsuario,
      { name: 'fecha_baja', label: 'Fecha de baja', type: 'date', required: true },
      { name: 'nombre_cuenta', label: 'Nombre de la cuenta', type: 'text', required: true },
      { name: 'nombre_responsable', label: 'Nombre responsable CONAGUA', type: 'text', required: true },
      { name: 'puesto_responsable', label: 'Puesto responsable CONAGUA', type: 'text', required: true },
      campoJustificacion
    ]
  },
  baja_usuario_externo_honorarios: {
    id: 'baja_usuario_externo_honorarios',
    name: 'Baja de cuenta de usuario externo (Honorarios)',
    description: 'Baja para personal externo (Honorarios)',
    fileName: 'Baja_de_cuenta_de_usuario_externo.html',
    fields: [
      ...camposComunesSolicitud, ...camposComunesPersonas, ...camposUsuario,
      { name: 'fecha_baja', label: 'Fecha de baja', type: 'date', required: true },
      { name: 'nombre_cuenta', label: 'Nombre de la cuenta', type: 'text', required: true },
      { name: 'nombre_responsable', label: 'Nombre responsable CONAGUA', type: 'text', required: true },
      { name: 'puesto_responsable', label: 'Puesto responsable CONAGUA', type: 'text', required: true },
      campoJustificacion
    ]
  },
  baja_usuario_interno: {
    id: 'baja_usuario_interno',
    name: 'Baja de cuenta de usuario interno',
    description: 'Baja para personal interno',
    fileName: 'Baja_de_cuenta_de_usuario_interno.html',
    fields: [
      ...camposComunesSolicitud, ...camposComunesPersonas, ...camposUsuario,
      { name: 'fecha_baja', label: 'Fecha de baja', type: 'date', required: true },
      campoJustificacion
    ]
  },

  // --- CAMBIOS ---
  cambio_servicio: {
    id: 'cambio_servicio',
    name: 'Cambio en cuenta de servicio',
    description: 'Modificación de servicio',
    fileName: 'Cambio_en_cuenta_de_servicio.html',
    fields: [
      ...camposComunesSolicitud, ...camposComunesPersonas,
      { name: 'nombre_cuenta', label: 'Nombre de la cuenta', type: 'text', required: true },
      { name: 'tipo_cuenta', label: 'Tipo de cuenta', type: 'text', required: true },
      { name: 'sistema', label: 'Sistema', type: 'text', required: true },
      { name: 'nombres_usuario', label: 'Nombre Usuario (Firma)', type: 'text', required: true },
      { name: 'apellidos_usuario', label: 'Apellidos Usuario (Firma)', type: 'text', required: true },
      { name: 'puesto_usuario', label: 'Puesto Usuario (Firma)', type: 'text', required: true },
      campoJustificacion
    ]
  },
  cambio_usuario_externo: {
    id: 'cambio_usuario_externo',
    name: 'Cambio en cuenta de usuario externo',
    description: 'Modificación usuario externo',
    fileName: 'Cambio_en_cuenta_de_usuario_externo.html',
    fields: [
      ...camposComunesSolicitud, ...camposComunesPersonas, ...camposUsuario,
      { name: 'nombre_cuenta', label: 'Nombre de la cuenta', type: 'text', required: true },
      { name: 'nombre_responsable', label: 'Nombre responsable CONAGUA', type: 'text', required: true },
      { name: 'puesto_responsable', label: 'Puesto responsable CONAGUA', type: 'text', required: true },
      campoJustificacion
    ]
  },
  cambio_usuario_externo_honorarios: {
    id: 'cambio_usuario_externo_honorarios',
    name: 'Cambio en cuenta de usuario externo (Honorarios)',
    description: 'Modificación usuario externo (Honorarios)',
    fileName: 'Cambio_en_cuenta_de_usuario_externo.html',
    fields: [
      ...camposComunesSolicitud, ...camposComunesPersonas, ...camposUsuario,
      { name: 'nombre_cuenta', label: 'Nombre de la cuenta', type: 'text', required: true },
      { name: 'nombre_responsable', label: 'Nombre responsable CONAGUA', type: 'text', required: true },
      { name: 'puesto_responsable', label: 'Puesto responsable CONAGUA', type: 'text', required: true },
      campoJustificacion
    ]
  },
  cambio_usuario_interno: {
    id: 'cambio_usuario_interno',
    name: 'Cambio en cuenta de usuario interno',
    description: 'Modificación usuario interno',
    fileName: 'Cambio_en_cuenta_de_usuario_interno.html',
    fields: [
      ...camposComunesSolicitud, ...camposComunesPersonas, ...camposUsuario,
      campoJustificacion
    ]
  }
};