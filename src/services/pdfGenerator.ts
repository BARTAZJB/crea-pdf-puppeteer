import puppeteer, { Browser, PDFOptions } from 'puppeteer';
import { loadTemplateRaw, fillTemplate } from './templateService';
export type { PDFOptions }; // añade esta línea

export class PDFGenerator {
  private browser: Browser | null = null;

  async init(): Promise<void> {
    if (this.browser) return;
    const headlessEnv = (process.env.PUPPETEER_HEADLESS ?? 'true').toLowerCase();
    const headless: boolean = headlessEnv === 'false' ? false : true;
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

    this.browser = await puppeteer.launch({
      headless,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });
  }

  async generateFromHTML(html: string, options: PDFOptions = {}): Promise<Buffer> {
    if (!html?.trim()) throw new Error('El HTML está vacío');
    if (!this.browser) await this.init();

    const page = await this.browser!.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' });
      await page.emulateMediaType('print');
      const pdf = await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
        ...options,
      });
      return Buffer.from(pdf);
    } finally {
      await page.close().catch(() => {});
    }
  }

  async generatePDF(html: string, options: PDFOptions = {}): Promise<Buffer> {
    return this.generateFromHTML(html, options);
  }

  async generateFromTemplate(templateName: string, data: Record<string, string>, pdfOptions?: PDFOptions): Promise<Buffer> {
    // Asegura el browser
    if (!this.browser) await this.init();

    const rawHtml = loadTemplateRaw(templateName);
    let { htmlFinal, faltantes } = fillTemplate(rawHtml, data);

    if (faltantes.length) {
      throw new Error(`Faltan datos para: ${faltantes.join(', ')}`);
      //throw new Error(`Datos faltantes, verifica`);
    }

    // =================================================================
    // INYECCIÓN DE SCRIPT DE AUTO-AJUSTE (AUTO-RESIZE)
    // =================================================================
    const autoResizeScript = `
    <script>
        window.addEventListener('load', () => {
            const fields = document.querySelectorAll('.field');
            fields.forEach(el => {
                if (!el.innerText.trim()) return;
                
                // Obtenemos el tamaño actual calculado o usamos 28pt por defecto
                let style = window.getComputedStyle(el, null).getPropertyValue('font-size');
                let fontSize = parseFloat(style); 
                if(!fontSize) fontSize = 28 * 1.33; // aprox conversion pt a px si falla

                // Convertimos a pt para la lógica de reducción (opcional, pero consistente con CSS)
                // Aquí trabajaremos directamenet reduciendo píxeles para mayor precisión en JS
                
                // Bucle de reducción
                while (
                    (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) 
                    && fontSize > 10
                ) {
                    fontSize -= 1; 
                    el.style.fontSize = fontSize + 'px';
                }
            });
        });
    </script>
    `;

    // Insertar antes del cierre de body
    if (htmlFinal.includes('</body>')) {
        htmlFinal = htmlFinal.replace('</body>', `${autoResizeScript}</body>`);
    } else {
        htmlFinal += autoResizeScript;
    }
    // =================================================================

    const page = await this.browser!.newPage();
    try {
      await page.setContent(htmlFinal, { waitUntil: 'networkidle0' });
      await page.emulateMediaType('print');

      const pdf = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
        ...pdfOptions,
      });

      // Forzar Buffer para coincidir con la firma Promise<Buffer>
      return Buffer.from(pdf);
    } finally {
      await page.close().catch(() => {});
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      try { await this.browser.close(); } finally { this.browser = null; }
    }
  }
}