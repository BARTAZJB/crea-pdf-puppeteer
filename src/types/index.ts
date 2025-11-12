// Exportar los tipos desde el servicio de PDF Generator
// export { PDFOptions, PDFGenerator } from '../services/pdfGenerator';

export interface PDFRequest {
  title: string;
  content: string;
}

export interface TemplateRequest {
  templateName: string;
  data: {
    [key: string]: string | number | Date;
  };
}

export { PDFOptions } from '../services/pdfGenerator';
export { TemplateData } from '../services/templateService';