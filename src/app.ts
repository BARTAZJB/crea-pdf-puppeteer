import express, { Request, Response } from 'express';
import path from 'path';
import * as dotenv from 'dotenv';
import { PDFGenerator } from './services/pdfGenerator';
import {
  getTemplateNames,
  loadTemplateRaw,
  extractPlaceholders,
  processTemplateAdvanced,
} from './services/templateService';
import { getCatalogOptions } from './services/catalogService';
import { listarDirecciones, obtenerDireccionPorId } from './services/direccionesService';

dotenv.config();

const app = express();
const rawPort = process.env.PORT;
const port: number = Number(rawPort) > 0 ? Number(rawPort) : 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

const viewsPath = path.join(__dirname, 'views');
app.use(express.static(viewsPath));

const pdfGenerator = new PDFGenerator();
console.log(`📁 Views path: ${viewsPath}`);

// === ENDPOINTS REQUERIDOS POR EL FRONT ===

// Lista de plantillas (para llenar el <select>)
app.get('/templates', (_req: Request, res: Response) => {
  try {
    const list = getTemplateNames(); // lee /src/templates/*.html
    res.json(list);
  } catch (e: any) {
    console.error('Error /templates:', e);
    res.status(500).json({ error: e.message || 'Error listando plantillas' });
  }
});

// Placeholders de una plantilla
app.get('/templates/:name/placeholders', (req: Request, res: Response) => {
  try {
    const name = req.params.name;
    const html = loadTemplateRaw(name);
    const phs = extractPlaceholders(html);
    res.json({ template: name, placeholders: phs });
  } catch (e: any) {
    console.error('Error placeholders:', e);
    res.status(404).json({ error: e.message || 'Plantilla no encontrada' });
  }
});

// Generar PDF desde plantilla + datos
app.post('/generate-pdf-template', async (req: Request, res: Response) => {
  try {
    const { templateName, data } = req.body as {
      templateName?: string;
      data?: Record<string, string>;
    };
    if (!templateName || !data) {
      return res.status(400).json({ error: 'templateName y data requeridos' });
    }
    const buffer = await pdfGenerator.generateFromTemplate(templateName, data);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${templateName.replace(/\.html?$/i, '')}.pdf"`
    );
    res.send(buffer);
  } catch (e: any) {
    console.error('Error al generar PDF:', e);
    res.status(400).json({ error: e.message || 'Error generando PDF' });
  }
});

// Catálogos desde CSV
app.get('/api/catalogs/:name', (req, res) => {
  const name = req.params.name;
  const deps = Object.fromEntries(Object.entries(req.query).map(([k, v]) => [k, String(v)]));
  res.json({ options: getCatalogOptions(name, deps) });
});

// Direcciones
app.get('/api/direcciones', (_req, res) => {
  res.json({ items: listarDirecciones() });
});

app.get('/api/direcciones/:id', (req, res) => {
  const item = obtenerDireccionPorId(req.params.id);
  if (!item) return res.status(404).json({ error: 'No encontrada' });
  res.json(item);
});

// Servir index si navegan a /
app.get('/', (_req, res) => {
  res.sendFile(path.join(viewsPath, 'index.html'));
});

// Levantar servidor
app.listen(port, () => {
  console.log(`🚀 Server listening on http://localhost:${port}`);
});