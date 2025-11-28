import fs from 'fs';
import path from 'path';

const TEMPLATES_DIR = path.join(process.cwd(), 'src', 'templates');

export function getTemplateNames(): string[] {
  return fs.readdirSync(TEMPLATES_DIR)
    .filter(f => f.toLowerCase().endsWith('.html'));
}

export function loadTemplateRaw(name: string): string {
  const full = path.join(TEMPLATES_DIR, name);
  if (!fs.existsSync(full)) throw new Error(`Plantilla no encontrada: ${name}`);
  return fs.readFileSync(full, 'utf8');
}

// Extrae {{PLACEHOLDER}}
export function extractPlaceholders(html: string): string[] {
  const re = /{{\s*([A-Za-z0-9_]+)\s*}}/g;
  const set = new Set<string>();
  let m;
  while ((m = re.exec(html)) !== null) set.add(m[1]);
  return [...set];
}

// Rellena la plantilla con datos. Devuelve { htmlFinal, faltantes }
export function fillTemplate(html: string, data: Record<string,string>): { htmlFinal: string; faltantes: string[] } {
  const placeholders = extractPlaceholders(html);
  const faltantes: string[] = [];
  let resultado = html;
  placeholders.forEach(ph => {
    const val = data[ph];
    if (val === undefined || val === '') {
      faltantes.push(ph);
      // Opcional: marcar en el HTML
      resultado = resultado.replace(new RegExp(`{{\\s*${ph}\\s*}}`, 'g'), `[[FALTA:${ph}]]`);
    } else {
      resultado = resultado.replace(new RegExp(`{{\\s*${ph}\\s*}}`, 'g'), val);
    }
  });
  return { htmlFinal: resultado, faltantes };
}

export function processTemplateAdvanced(templateFileName: string, rawData: Record<string, unknown>): string {
  const html = loadTemplateRaw(templateFileName);
  // Normalizar datos a string
  const data: Record<string,string> = {};
  Object.keys(rawData || {}).forEach(k => {
    const v = rawData[k];
    data[k] = v === null || v === undefined ? '' : String(v);
  });
  const { htmlFinal, faltantes } = fillTemplate(html, data);
  if (faltantes.length) {
    throw new Error(`Faltan datos para: ${faltantes.join(', ')}`);
  }
  return htmlFinal;
}