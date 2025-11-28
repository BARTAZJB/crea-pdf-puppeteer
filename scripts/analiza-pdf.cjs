const fs = require('fs');
const path = require('path');

function loadPdfParse() {
  try {
    let mod = require('pdf-parse');                 // normal
    let fn = (mod && mod.default) ? mod.default : mod;
    if (typeof fn === 'function') return fn;
  } catch {}
  try {
    const fn = require('pdf-parse/lib/pdf-parse.js'); // fallback directo al archivo
    if (typeof fn === 'function') return fn;
  } catch {}
  const v = (() => { try { return require('pdf-parse/package.json').version; } catch { return 'desconocida'; }})();
  throw new Error(`pdf-parse no exporta función. Verifica instalación. Versión detectada: ${v}`);
}

const pdfParse = loadPdfParse();

function extraerPlaceholders(html) {
  const re = /{{\s*([A-Za-z0-9_]+)\s*}}/g;
  const set = new Set();
  let m;
  while ((m = re.exec(html)) !== null) set.add(m[1]);
  return [...set];
}

async function analizarUno(templateFile, pdfFile) {
  const html = fs.readFileSync(templateFile, 'utf8');
  const placeholders = extraerPlaceholders(html);

  const pdfBuffer = fs.readFileSync(pdfFile);
  const pdfData = await pdfParse(pdfBuffer);
  const pdfText = pdfData.text || '';

  const noReemplazados = [];
  const posiblesValores = {};

  placeholders.forEach(ph => {
    const tokenRegex = new RegExp(`{{\\s*${ph}\\s*}}`);
    if (tokenRegex.test(html) && tokenRegex.test(pdfText)) noReemplazados.push(ph);
    const candidates = [];
    const upper = ph.toUpperCase();
    if (pdfText.includes(upper)) candidates.push(upper);
    const testVal = `TEST_${ph}`;
    if (pdfText.includes(testVal)) candidates.push(testVal);
    if (candidates.length) posiblesValores[ph] = candidates;
  });

  console.log(`\n📄 PDF: ${path.basename(pdfFile)}`);
  console.log(`Plantilla: ${path.basename(templateFile)}`);
  console.log(`Placeholders totales: ${placeholders.length}`);
  console.log(noReemplazados.length ? `❌ No reemplazados: ${noReemplazados.join(', ')}` : '✅ Todos reemplazados (o transformados).');
  if (Object.keys(posiblesValores).length) {
    console.log('🔎 Coincidencias de valores:');
    for (const k of Object.keys(posiblesValores)) console.log(`  ${k}: ${posiblesValores[k].join(', ')}`);
  }
}

async function main() {
  const baseTemplates = path.resolve('src', 'templates');
  const basePdfs = path.resolve('pdfs_generados');

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
    const templatePath = path.join(baseTemplates, pdf.replace(/\.pdf$/i, '.html'));
    if (!fs.existsSync(templatePath)) {
      console.warn(`⚠️ No se encontró plantilla para ${pdf}`);
      continue;
    }
    await analizarUno(templatePath, path.join(basePdfs, pdf));
  }
}

main().catch(e => { console.error('Error:', e); process.exit(1); });