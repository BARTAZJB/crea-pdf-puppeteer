

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

// Re-exportar tipos de librerías externas si es necesario
export type { PDFOptions } from 'puppeteer';