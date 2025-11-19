import { PDFGenerator } from '../src/services/pdfGenerator';

describe('PDFGenerator', () => {
  const gen = new PDFGenerator();

  beforeAll(async () => {
    await gen.init();
  });

  afterAll(async () => {
    await gen.close();
  });

  test('genera PDF desde HTML simple', async () => {
    const html = '<html><body><h1>Hola</h1><p>Prueba</p></body></html>';
    const pdf = await gen.generatePDF(html, { format: 'A4' });
    expect(pdf.length).toBeGreaterThan(1000); // tamaño mínimo
  });

  test('rechaza HTML vacío', async () => {
    await expect(gen.generatePDF('')).rejects.toThrow(/vacío/i);
  });
});