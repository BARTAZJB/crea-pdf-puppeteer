import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

interface DireccionRow {
  id: string;
  ciudad: string;
  estado: string;
  cp: string;
  direccion: string;
}

let cache: DireccionRow[] = [];

function load() {
  if (cache.length) return cache;
  const file = path.join(__dirname, '..', 'views', 'docs', 'csv', 'direccion.csv');
  const raw = fs.readFileSync(file, 'utf8');
  const rows = parse(raw, { columns: true, bom: true, skip_empty_lines: true }) as any[];
  cache = rows.map(r => ({
    id: String(r['ID'] || '').trim(),
    ciudad: String(r['Ciudad'] || '').trim(),
    estado: String(r['Estado'] || '').trim(),
    cp: String(r['C.P'] || '').replace(/[,"]/g,'').trim(),
    direccion: String(r['Dirección'] || '').trim(),
  })).filter(r => r.id);
  return cache;
}

export function listarDirecciones() {
  return load().map(r => ({ id: r.id }));
}

export function obtenerDireccionPorId(id: string) {
  return load().find(r => r.id === id);
}