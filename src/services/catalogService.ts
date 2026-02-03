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
    console.warn(`Catálogo no encontrado: ${filePath}`);
    return [];
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  // Leemos el CSV
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true // Vital para archivos Excel guardados como CSV UTF-8
  });

  // Si es Justificación, preparamos la data para el frontend
  if (catalogKey === 'JUSTIFICACION') {
    return records.map((r: any) => {
        // Obtenemos TIPO y TEXTO de las columnas
        const tipo = r.TIPO || r.Tipo || ''; 
        const texto = r.JUSTIFICACION || r.Justificacion || r.DESCRIPCION || '';
        // Devolvemos ambos separados por |
        return `${tipo}|${texto}`; 
    });
  }

  // Filtrado estándar
  let filteredRecords = records;
  if (filterKey && filters[filterKey]) {
     filteredRecords = records.filter((r: any) => r[filterKey] === filters[filterKey]);
  }

  const options = filteredRecords.map((record: any) => record[valueKey] || Object.values(record)[0]);
  return [...new Set(options)].filter(Boolean) as string[];
};