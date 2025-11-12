import { PDFGenerator, PDFOptions } from '../src/services/pdfGenerator';

describe('PDFGenerator', () => {
  let pdfGenerator: PDFGenerator;

  beforeAll(async () => {
    pdfGenerator = new PDFGenerator();
    await pdfGenerator.init();
  });

  afterAll(async () => {
    await pdfGenerator.close();
  });

  test('should generate a PDF from HTML template', async () => {
    const htmlTemplate = '<h1>Test PDF</h1><p>This is a test document.</p>';
    const options: PDFOptions = { format: 'A4' };

    const pdfBuffer = await pdfGenerator.generatePDF(htmlTemplate, options);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  test('should throw an error if HTML template is empty', async () => {
    const options: PDFOptions = { format: 'A4' };

    await expect(pdfGenerator.generatePDF('', options)).rejects.toThrow('HTML template cannot be empty');
  });

  test('should throw an error if HTML template is only whitespace', async () => {
    const options: PDFOptions = { format: 'A4' };

    await expect(pdfGenerator.generatePDF('   ', options)).rejects.toThrow('HTML template cannot be empty');
  });

  test('should generate PDF with custom options', async () => {
    const htmlTemplate = '<h1>Custom PDF</h1>';
    const options: PDFOptions = {
      format: 'Letter',
      landscape: true,
      margin: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm'
      },
      printBackground: true
    };

    const pdfBuffer = await pdfGenerator.generatePDF(htmlTemplate, options);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  test('should generate PDF with complex HTML', async () => {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { color: blue; }
          </style>
        </head>
        <body>
          <h1>Complex Document</h1>
          <p>This is a paragraph with <strong>bold text</strong> and <em>italic text</em>.</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
            <li>Item 3</li>
          </ul>
        </body>
      </html>
    `;
    const options: PDFOptions = { format: 'A4', printBackground: true };

    const pdfBuffer = await pdfGenerator.generatePDF(htmlTemplate, options);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});