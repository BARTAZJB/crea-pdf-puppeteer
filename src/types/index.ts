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
export interface TemplateField {
    name: string;
    label: string;
    type: 'text' | 'date' | 'select' | 'textarea';
    required?: boolean;
    options?: string[];
}
  
export interface TemplateConfig {
    id: string;
    name: string;
    description: string;
    fileName: string;
    fields: TemplateField[];
}
// Re-export directo de puppeteer
export type { PDFOptions } from 'puppeteer';