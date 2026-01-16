
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const file = path.join(__dirname, '..', 'views', 'docs', 'csv', 'direccion.csv');
console.log('Intentando leer:', file);

try {
    if (!fs.existsSync(file)) {
        console.error('❌ El archivo NO existe en la ruta calculada.');
        // Intentar buscar dónde está
        const alternative = path.join(process.cwd(), 'src', 'views', 'docs', 'csv', 'direccion.csv');
        console.log('Ruta alternativa:', alternative);
        if (fs.existsSync(alternative)) {
            console.log('✅ El archivo existe en la ruta alternativa.');
        }
    } else {
        console.log('✅ El archivo existe.');
        const raw = fs.readFileSync(file, 'utf8');
        const rows = parse(raw, { columns: true, bom: true, skip_empty_lines: true });
        console.log(`✅ Leídas ${rows.length} filas.`);
        if (rows.length > 0) {
            console.log('Primera fila:', rows[0]);
        }
    }
} catch (error) {
    console.error('Error:', error);
}
