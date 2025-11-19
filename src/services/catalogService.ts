import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { catalogs } from '../config/catalogs.config';

const csvBase = path.join(__dirname, '..', 'views', 'docs', 'csv');

function norm(s: string) {
  return s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function readCsv(file: string) {
  const p = path.join(csvBase, file);
  const buf = fs.readFileSync(p, 'utf8');
  const rows = parse(buf, { columns: true, bom: true, skip_empty_lines: true }) as any[];
  return rows.map(r => {
    const o: any = {};
    for (const k of Object.keys(r)) o[norm(k)] = String(r[k]).trim();
    return o;
  });
}

export function getCatalogOptions(name: string, deps: Record<string, string> = {}): string[] {
  const cfg = catalogs[name];
  if (!cfg) return [];
  if (cfg.type === 'static') return [...cfg.options];

  const data = readCsv(cfg.file);
  const col = norm(cfg.column);

  let rows = data;
  if (cfg.dependsOn) {
    const depCol = norm(cfg.dependsOn.column);
    const depVal = (deps[cfg.dependsOn.key] || '').trim();
    if (depVal) rows = rows.filter(r => r[depCol] === depVal);
  }

  let vals = rows.map(r => r[col]).filter(Boolean);
  if (cfg.distinct) vals = Array.from(new Set(vals));
  return vals.sort((a, b) => a.localeCompare(b, 'es'));
}