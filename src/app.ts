import express, { Request, Response } from 'express';
import path from 'path';
import * as dotenv from 'dotenv';
import { PDFGenerator } from './services/pdfGenerator';
import { TemplateService } from './services/templateService';
import { getTemplateConfigByFileName, getAllTemplates } from './config/templates.config';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const viewsPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, 'views') 
  : path.join(__dirname, '..', 'src', 'views');

app.use(express.static(viewsPath));

const pdfGenerator = new PDFGenerator();
const templateService = new TemplateService();

pdfGenerator.init().then(() => {
  console.log('✅ PDF Generator initialized');
}).catch((error) => {
  console.error('❌ Error initializing PDF Generator:', error);
  process.exit(1);
});

// Ruta principal
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(viewsPath, 'index.html'));
});

// API: Listar plantillas disponibles
app.get('/api/templates', (req: Request, res: Response) => {
  try {
    const templates = templateService.listTemplates();
    res.json({
      success: true,
      templates: templates,
      count: templates.length
    });
  } catch (error) {
    console.error('❌ Error listing templates:', error);
    res.status(500).json({
      success: false,
      error: 'Error al listar plantillas',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API: Obtener configuración de plantilla
app.get('/api/template-config/:templateId', (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    console.log(`📋 Requesting config for template: ${templateId}`);
    
    const config = getTemplateConfigByFileName(`${templateId}.html`) || 
                   getAllTemplates().find(t => t.id === templateId);

    if (!config) {
      console.warn(`⚠️ Template config not found: ${templateId}`);
      return res.status(404).json({
        success: false,
        error: 'Configuración de plantilla no encontrada'
      });
    }

    console.log(`✅ Config found: ${config.name}`);
    res.json({
      success: true,
      config: config
    });
  } catch (error) {
    console.error('❌ Error getting template config:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener configuración',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API: Generar PDF desde plantilla
app.post('/generate-pdf-from-template', async (req: Request, res: Response) => {
  try {
    const { templateFileName, formData } = req.body;

    console.log(`📄 Generating PDF from template: ${templateFileName}`);
    console.log(`📋 Form data received:`, Object.keys(formData));

    if (!templateFileName || !formData) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos: templateFileName o formData'
      });
    }

    // Procesar plantilla con datos del formulario
    const processedHtml = templateService.processTemplateAdvanced(templateFileName, formData);

    // Generar PDF
    const pdfBuffer = await pdfGenerator.generateFromHTML(processedHtml, {
      format: 'Letter',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    // Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${templateFileName.replace('.html', '.pdf')}"`);
    res.send(pdfBuffer);

    console.log(`✅ PDF generated successfully`);

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📁 Views path: ${viewsPath}`);
  console.log(`📋 Templates available: ${templateService.listTemplates().length}`);
});