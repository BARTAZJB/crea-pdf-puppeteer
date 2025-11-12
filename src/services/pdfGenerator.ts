import puppeteer, { Browser, Page, PDFOptions as PuppeteerPDFOptions } from 'puppeteer';

export interface PDFOptions {
  format?: 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'A2' | 'A1' | 'A0';
  landscape?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
  scale?: number;
  pageRanges?: string;
  path?: string;
}

export class PDFGenerator {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
      console.log('✅ Puppeteer browser initialized');
    }
  }

  async generatePDF(htmlContent: string, options?: PDFOptions): Promise<Buffer> {
    // Validar que el contenido HTML no esté vacío
    if (!htmlContent || htmlContent.trim() === '') {
      throw new Error('HTML template cannot be empty');
    }

    // Inicializar el browser si no está ya inicializado
    if (!this.browser) {
      await this.init();
    }

    let page: Page | null = null;
    
    try {
      page = await this.browser!.newPage();
      
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      const pdfOptions: PuppeteerPDFOptions = {
        format: options?.format || 'A4',
        landscape: options?.landscape || false,
        margin: options?.margin || {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        printBackground: options?.printBackground !== false,
        preferCSSPageSize: false,
        ...options
      };
      
      const pdfBuffer = await page.pdf(pdfOptions);
      
      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async generateFromHTML(html: string, options?: any): Promise<Buffer> {
    // Implementation for generating PDF from HTML
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }
    
    const page = await this.browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf(options);
    await page.close();
    
    return Buffer.from(pdfBuffer);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('✅ Puppeteer browser closed');
    }
  }
}