import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
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
import { addHistory, getHistory } from './services/historyService';
import { saveDatosFormato, getDatosFormatoById, listDatosFormato } from './services/datosFormatoService';

dotenv.config();

const app = express();
const rawPort = process.env.PORT;
const port: number = Number(rawPort) > 0 ? Number(rawPort) : 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

const viewsPath = path.join(__dirname, 'views');
const outputDir = path.join(__dirname, '..', 'output_pdfs'); // carpeta fuera de src
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

app.use(express.static(viewsPath));
app.use('/output_pdfs', express.static(outputDir)); // Servir PDFs generados

const pdfGenerator = new PDFGenerator();
console.log(`📁 Views path: ${viewsPath}`);
console.log(`📂 Output path: ${outputDir}`);

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
    const { templateName, data, draftId } = req.body as {
      templateName?: string;
      data?: Record<string, string>;
      draftId?: number;
    };
    if (!templateName || !data) {
      return res.status(400).json({ error: 'templateName y data requeridos' });
    }

    // --- LOGICA DE ACTUALIZACIÓN DE DATOS (BORRADOR) ---
    // Si queremos que cada generación actualice el registro maestro de datos
    let datosFormatoId = draftId;
    let nombreUsuario = data['NOMBRE_DEL_USUARIO'] || data['NOMBRE_COMPLETO'];
      
    if (!nombreUsuario) {
        const nombres = data['NOMBRES_USUARIO'] || '';
        const apellidos = data['APELLIDOS_USUARIO'] || '';
        if (nombres || apellidos) {
            nombreUsuario = `${nombres} ${apellidos}`.trim();
        }
    }
    if (!nombreUsuario) nombreUsuario = 'Sin Nombre';

    try {
        const savedData = await saveDatosFormato({
            id: draftId ? Number(draftId) : undefined,
            plantilla: templateName,
            datosJson: data,
            nombreUsuario
        });
        datosFormatoId = savedData.id;
        console.log(`✅ Datos guardados/actualizados. ID: ${datosFormatoId}`);
    } catch (saveError) {
        console.error('⚠️ Error guardando datos maestros:', saveError);
    }
    // ----------------------------------------------------

    const buffer = await pdfGenerator.generateFromTemplate(templateName, data);

    // --- LOGICA DE HISTORIAL ---
    try {
      // 1. Guardar archivo físico
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${templateName.replace(/\.html?$/i, '')}_${timestamp}.pdf`;
      const filePath = path.join(outputDir, filename);
      
      fs.writeFileSync(filePath, buffer);

      // 2. Extraer metadatos
      let tipoMovimiento = 'Desconocido';
      if (/alta/i.test(templateName)) tipoMovimiento = 'Alta';
      else if (/baja/i.test(templateName)) tipoMovimiento = 'Baja';
      else if (/cambio/i.test(templateName)) tipoMovimiento = 'Cambio';

      // 3. Guardar en BD (Registro de Impresión)
      const webPath = `/output_pdfs/${filename}`; // Ruta relativa web
      await addHistory({
        tipoMovimiento,
        nombreUsuario,
        plantilla: templateName,
        archivoPath: webPath, 
        datosFormatoId: datosFormatoId // Vinculamos con los datos maestros
      });
      console.log(`✅ PDF guardado y registrado: ${webPath}`);

    } catch (histError) {
      console.error('⚠️ Error guardando historial (PDF generado ok):', histError);
      // No bloqueamos la respuesta, el usuario recibe su PDF igual
    }
    // ---------------------------

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${templateName.replace(/\.html?$/i, '')}.pdf"`
    );
    // Devuelve el ID del borrador en un header custom por si el front lo necesita para actualizar la UI
    if(datosFormatoId) res.setHeader('X-Draft-Id', String(datosFormatoId));
    
    res.send(buffer);
  } catch (e: any) {
    console.error('Error al generar PDF:', e);
    res.status(400).json({ error: e.message || 'Error generando PDF' });
  }
});

// Endpoint Historial
app.get('/api/historial', async (_req, res) => {
  try {
    const history = await getHistory();
    res.json(history);
  } catch (e: any) {
    res.status(500).json({ error: 'Error obteniendo historial' });
  }
});

// === ENDPOINTS BORRADORES / DATOS ===

app.post('/api/save-draft', async (req: Request, res: Response) => {
    try {
      const { templateName, data, draftId } = req.body;
      
      let nombreUsuario = data['NOMBRE_DEL_USUARIO'] || data['NOMBRE_COMPLETO'];
      if (!nombreUsuario) {
          const nombres = data['NOMBRES_USUARIO'] || '';
          const apellidos = data['APELLIDOS_USUARIO'] || '';
          if (nombres || apellidos) nombreUsuario = `${nombres} ${apellidos}`.trim();
      }
      if (!nombreUsuario) nombreUsuario = 'Borrador Sin Nombre';
  
      const result = await saveDatosFormato({
        id: draftId ? Number(draftId) : undefined,
        plantilla: templateName,
        datosJson: data,
        nombreUsuario
      });
      
      res.json({ success: true, draftId: result.id, message: 'Borrador guardado correctamente' });
    } catch (error: any) {
      console.error('Error saving draft:', error);
      res.status(500).json({ error: 'Error guardando borrador' });
    }
  });
  
  app.get('/api/drafts', async (_req, res) => {
      try {
          const list = await listDatosFormato();
          res.json(list);
      } catch (e) {
          res.status(500).json({ error: 'Error listando borradores' });
      }
  });
  
  app.get('/api/drafts/:id', async (req, res) => {
      try {
          const item = await getDatosFormatoById(Number(req.params.id));
          if(!item) return res.status(404).json({ error: 'Borrador no encontrado' });
          res.json(item);
      } catch (e) {
          res.status(500).json({ error: 'Error obteniendo borrador' });
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