import fs from 'fs';
import path from 'path';

export type TemplateConfig = {
  id: string;
  name: string;
  fileName: string;
  description?: string;
};

const TEMPLATES_DIR = path.join(process.cwd(), 'src', 'templates');

export function getAllTemplates(): TemplateConfig[] {
  const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.toLowerCase().endsWith('.html'));
  return files.map(f => ({
    id: f.replace(/\.html$/i, ''),
    name: f.replace(/_/g, ' ').replace(/\.html$/i, ''),
    fileName: f
  }));
}

export function getTemplateConfigByFileName(fileName: string): TemplateConfig | undefined {
  return getAllTemplates().find(t => t.fileName === fileName);
}

