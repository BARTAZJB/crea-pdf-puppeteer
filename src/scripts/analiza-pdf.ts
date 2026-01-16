import fs from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const raw = require('pdf-parse');
const pdfParse: any = (raw?.default) ? raw.default : raw;
if (typeof pdfParse !== 'function') {
  console.error('pdf-parse no exporta función. Valor:', raw);
  process.exit(1);
}

function extraerPlaceholders(html: string): string[] {
  const re = /{{\s*([A-Za-z0-9_]+)\s*}}/g;
  const set = new Set<string>();
  let m;
  while ((m = re.exec(html)) !== null) set.add(m[1]);
  return [...set];
}

async function analizarUno(templateFile: string, pdfFile: string) {
  const html = fs.readFileSync(templateFile, 'utf8');
  const placeholders = extraerPlaceholders(html);

  const pdfBuffer = fs.readFileSync(pdfFile);
  const pdfData = await pdfParse(pdfBuffer);
  const pdfText = pdfData.text || '';

  const noReemplazados: string[] = [];
  const posiblesValores: Record<string, string[]> = {};

  placeholders.forEach(ph => {
    const tokenRegex = new RegExp(`{{\\s*${ph}\\s*}}`);
    if (tokenRegex.test(html) && tokenRegex.test(pdfText)) noReemplazados.push(ph);
    const candidates: string[] = [];
    const upper = ph.toUpperCase();
    if (pdfText.includes(upper)) candidates.push(upper);
    const testVal = `TEST_${ph}`;
    if (pdfText.includes(testVal)) candidates.push(testVal);
    if (candidates.length) posiblesValores[ph] = candidates;
  });

  console.log(`\n📄 PDF: ${path.basename(pdfFile)}`);
  console.log(`Plantilla: ${path.basename(templateFile)}`);
  console.log(`Placeholders totales: ${placeholders.length}`);
  console.log(
    noReemplazados.length
      ? `❌ No reemplazados: ${noReemplazados.join(', ')}`
      : '✅ Todos reemplazados (o transformados).'
  );
  if (Object.keys(posiblesValores).length) {
    console.log('🔎 Coincidencias de valores:');
    for (const k of Object.keys(posiblesValores)) {
      console.log(`  ${k}: ${posiblesValores[k].join(', ')}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name: string, def: string) => {
    const i = args.indexOf(name);
    return i >= 0 && args[i + 1] ? args[i + 1] : def;
  };

  const baseTemplates = path.resolve(getArg('--tpl-dir', path.join(process.cwd(), 'src', 'templates')));
  const basePdfs = path.resolve(getArg('--pdf-dir', path.join(process.cwd(), 'pdfs_generados')));

  console.log(`🔍 Usando templates: ${baseTemplates}`);
  console.log(`📂 PDFs a analizar: ${basePdfs}`);

  if (!fs.existsSync(basePdfs)) {
    console.error('Carpeta pdfs_generados no existe.');
    process.exit(1);
  }

  const pdfFiles = fs.readdirSync(basePdfs).filter(f => f.toLowerCase().endsWith('.pdf'));
  if (pdfFiles.length === 0) {
    console.warn('No hay PDFs para analizar.');
    return;
  }

  for (const pdf of pdfFiles) {
    const nameBase = pdf.replace(/\.pdf$/i, '.html');
    const templatePath = path.join(baseTemplates, nameBase);
    if (!fs.existsSync(templatePath)) {
      console.warn(`⚠️ No se encontró plantilla para ${pdf}`);
      continue;
    }
    await analizarUno(templatePath, path.join(basePdfs, pdf));
  }
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});