// Definiciones globales de tipos para evitar duplicados

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

// Re-exportar tipos de librerías externas
export type { PDFOptions } from 'puppeteer';