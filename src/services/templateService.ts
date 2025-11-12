import * as fs from 'fs';
import * as path from 'path';
import { getTemplateConfigByFileName } from '../config/templates.config';

export class TemplateService {
  private templatesPath: string;

  constructor() {
    // Determinar ruta según entorno
    this.templatesPath = process.env.NODE_ENV === 'production'
      ? path.join(__dirname, '..', 'templates')
      : path.join(__dirname, '..', '..', 'dist', 'templates');
    
    console.log(`📁 Templates path: ${this.templatesPath}`);
  }

  /**
   * Procesar plantilla con datos del formulario
   */
  processTemplateAdvanced(templateFileName: string, formData: Record<string, any>): string {
    try {
      const templatePath = path.join(this.templatesPath, templateFileName);
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }

      let htmlContent = fs.readFileSync(templatePath, 'utf-8');

      // Obtener configuración de la plantilla
      const config = getTemplateConfigByFileName(templateFileName);
      
      if (!config) {
        console.warn(`⚠️ No config found for ${templateFileName}`);
        return this.basicReplacement(htmlContent, formData);
      }

      console.log(`📝 Processing template: ${config.name}`);
      console.log(`📋 Form data:`, Object.keys(formData));

      // Mapear datos del formulario a variables
      const variables = this.mapFormDataToVariables(formData, config);

      // Reemplazar variables en la plantilla
      htmlContent = this.replaceVariables(htmlContent, variables);

      return htmlContent;

    } catch (error) {
      console.error('❌ Error processing template:', error);
      throw error;
    }
  }

  /**
   * Mapear datos del formulario a variables de la plantilla
   */
  private mapFormDataToVariables(formData: Record<string, any>, config: any): Record<string, string> {
    const variables: Record<string, string> = {};

    // Agregar fecha actual
    variables['FECHA_SOLICITUD'] = this.formatDate(new Date());

    // Mapear cada campo del formulario
    config.fields.forEach((field: any) => {
      const value = formData[field.name] || '';
      const variableName = field.name.toUpperCase();
      variables[variableName] = value;
    });

    console.log(`🔄 Variables mapeadas:`, Object.keys(variables).length);

    return variables;
  }

  /**
   * Reemplazar variables en el HTML
   */
  private replaceVariables(html: string, variables: Record<string, string>): string {
    let result = html;
    let replacementCount = 0;

    // Reemplazar cada variable
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const value = variables[key] || '________________';
      const matches = (result.match(regex) || []).length;
      
      if (matches > 0) {
        result = result.replace(regex, value);
        replacementCount += matches;
        console.log(`  ✓ ${key}: ${matches} reemplazos`);
      }
    });

    console.log(`✅ Total de reemplazos: ${replacementCount}`);

    // Verificar variables no reemplazadas
    const unreplaced = (result.match(/{{[A-Z_]+}}/g) || []);
    if (unreplaced.length > 0) {
      console.warn(`⚠️ Variables sin reemplazar:`, [...new Set(unreplaced)]);
    }

    return result;
  }

  /**
   * Reemplazo básico (fallback)
   */
  private basicReplacement(html: string, formData: Record<string, any>): string {
    let result = html;

    Object.keys(formData).forEach(key => {
      const value = formData[key] || '________________';
      const variableName = key.toUpperCase();
      const regex = new RegExp(`{{${variableName}}}`, 'g');
      result = result.replace(regex, value);
    });

    return result;
  }

  /**
   * Formatear fecha en español
   */
  private formatDate(date: Date): string {
    const day = date.getDate();
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day} de ${month} de ${year}`;
  }

  /**
   * Listar plantillas disponibles
   */
  listTemplates(): string[] {
    try {
      if (!fs.existsSync(this.templatesPath)) {
        console.warn(`⚠️ Templates path does not exist: ${this.templatesPath}`);
        return [];
      }

      const files = fs.readdirSync(this.templatesPath);
      return files.filter(file => file.endsWith('.html'));
    } catch (error) {
      console.error('❌ Error listing templates:', error);
      return [];
    }
  }
}

export interface TemplateData {
  [key: string]: string | number | Date;
}