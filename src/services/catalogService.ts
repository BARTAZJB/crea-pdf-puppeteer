import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const CSV_BASE_PATH = path.join(__dirname, '../views/docs/csv');

export const getCatalogOptions = (catalogName: string, filters: Record<string, string> = {}): string[] => {
  let fileName = '';
  let filterKey = ''; // Columna por la cual filtrar (ej: padre)
  let valueKey = '';  // Columna que queremos devolver (ej: nombre)

  // Mapeo de catálogos
  switch (catalogName) {
    case 'UNIDAD_ADMINISTRATIVA':
      fileName = 'unidad_administrativa.csv';
      valueKey = 'NOMBRE'; 
      break;
    case 'AREA':
      fileName = 'areas.csv';
      filterKey = 'ID_UNIDAD_ADMINISTRATIVA'; // Asumiendo que areas.csv tiene esta columna
      valueKey = 'NOMBRE';
      break;
    case 'PUESTO_SOLICITANTE':
    case 'PUESTO_USUARIO':
    case 'PUESTO_AUTORIZA':
    case 'PUESTO_RESPONSABLE_CONAGUA':
      fileName = 'puestos.csv';
      valueKey = 'NOMBRE'; 
      break;
    case 'SISTEMA':
      fileName = 'sistemas.csv';
      valueKey = 'NOMBRE';
      break;
    case 'TIPO_CUENTA':
      fileName = 'tipo_cuenta.csv';
      valueKey = 'NOMBRE';
      break;
    
    // --- NUEVO: JUSTIFICACIÓN ---
    case 'JUSTIFICACION':
      fileName = 'justificacion.csv';
      // Aquí necesitamos devolver todo el objeto o filtrar de forma especial.
      // Para simplificar, este servicio devolverá objetos crudos si se requiere lógica compleja,
      // pero por ahora mantenemos el estándar y devolvemos strings.
      // La lógica de filtrado "Alta/Baja/Cambio" es compleja para este helper genérico,
      // así que devolveremos TODAS las opciones formateadas como "TIPO|TEXTO"
      // y el Frontend (app.js) hará el filtrado final.
      valueKey = 'TEXTO_COMPLETO'; 
      break;

    default:
      return [];
  }

  const filePath = path.join(CSV_BASE_PATH, fileName);

  if (!fs.existsSync(filePath)) {
    console.warn(`Catálogo no encontrado: ${filePath}`);
    return [];
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  // Lógica especial para JUSTIFICACION (Devolver Tipo|Descripcion para filtrar en front)
  if (catalogName === 'JUSTIFICACION') {
    return records.map((r: any) => {
        // Asumiendo que el CSV tiene columnas "TIPO" y "JUSTIFICACION" o "DESCRIPCION"
        // Ajusta los nombres de las columnas según tu CSV real
        const tipo = r.TIPO || r.Tipo || ''; 
        const texto = r.JUSTIFICACION || r.Justificacion || r.DESCRIPCION || r.Descripcion || '';
        return `${tipo}|${texto}`; 
    });
  }

  // Filtrado estándar (para Áreas, etc.)
  let filteredRecords = records;
  if (filterKey && filters[filterKey]) {
     // Aquí iría lógica de filtrado si mandas dependency
     // Por ahora devolvemos todo y filtramos en front para cascadas complejas
  }

  // Mapeo a array de strings
  const options = filteredRecords.map((record: any) => record[valueKey] || Object.values(record)[0]);
  
  // Eliminar duplicados y vacíos
  return [...new Set(options)].filter(Boolean) as string[];
};