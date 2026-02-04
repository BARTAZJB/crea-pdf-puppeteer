import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const CSV_BASE_PATH = path.join(__dirname, '../views/docs/csv');

export const getCatalogOptions = (catalogName: string, filters: Record<string, string> = {}): string[] => {
  let fileName = '';
  let filterKey = ''; 
  let valueKey = '';

  const catalogKey = catalogName.toUpperCase();

  switch (catalogKey) {
    case 'UNIDAD_ADMINISTRATIVA': fileName = 'unidad_administrativa.csv'; valueKey = 'NOMBRE'; break;
    case 'AREA': fileName = 'areas.csv'; filterKey = 'ID_UNIDAD_ADMINISTRATIVA'; valueKey = 'NOMBRE'; break;
    
    // Mapeo de Puestos
    case 'PUESTO_SOLICITANTE':
    case 'PUESTO_USUARIO':
    case 'PUESTO_AUTORIZA':
    case 'PUESTO_RESPONSABLE_CONAGUA': fileName = 'puestos.csv'; valueKey = 'NOMBRE'; break;
    
    case 'SISTEMA': fileName = 'sistemas.csv'; valueKey = 'NOMBRE'; break;
    case 'TIPO_CUENTA': fileName = 'tipo_cuenta.csv'; valueKey = 'NOMBRE'; break;
    
    // --- SOPORTE JUSTIFICACIÓN ---
    case 'JUSTIFICACION': fileName = 'justificacion.csv'; break;

    default: return [];
  }

  const filePath = path.join(CSV_BASE_PATH, fileName);

  if (!fs.existsSync(filePath)) {
    console.warn(`[CatalogService] Archivo no encontrado: ${filePath}`);
    return [];
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true // Vital para archivos Excel guardados como CSV UTF-8
  });

  // --- LÓGICA ESPECIAL PARA JUSTIFICACIÓN ---
  // Devolvemos "TIPO|LABEL|VALUE" para que el frontend pueda filtrar
  if (catalogKey === 'JUSTIFICACION') {
    return records.map((r: any) => {
        // Detectar columnas correctas (manejo de acentos y mayúsculas)
        const label = r['Justificación'] || r.Justificacion || r.JUSTIFICACION || ''; 
        const value = r['redacción'] || r.redacción || r.Redaccion || r.REDACCION || '';

        if (!label) return null;

        // Inferir TIPO basado en el texto del label
        let tipo = 'GENERAL';
        const l = label.toLowerCase().trim();
        if (l.startsWith('alta')) tipo = 'ALTA';
        else if (l.startsWith('baja')) tipo = 'BAJA';
        else if (l.startsWith('cambio')) tipo = 'CAMBIO';
        else if (l.startsWith('reactiv')) tipo = 'CAMBIO';

        // Limpiar pipes para no romper formato
        const safeLabel = label.replace(/\|/g, '/');
        const safeValue = value.replace(/\|/g, '/');

        // Formato: TIPO | TÍTULO CORTO | TEXTO LARGO
        return `${tipo}|${safeLabel}|${safeValue}`; 
    }).filter(Boolean);
  }

  // --- LÓGICA ESTÁNDAR ---
  let filteredRecords = records;
  if (filterKey && filters[filterKey]) {
     filteredRecords = records.filter((r: any) => r[filterKey] === filters[filterKey]);
  }

  // Extraer valores únicos
  const options = filteredRecords.map((record: any) => record[valueKey] || Object.values(record)[0]);
  return [...new Set(options)].filter(Boolean) as string[];
};