# 📄 CREA PDF ABC

Generador de documentos PDF utilizando Puppeteer y Express. Permite crear documentos PDF dinámicos a partir de contenido HTML con una interfaz web amigable.

## 🚀 Características

- ✅ Generación de PDFs desde formulario web
- ✅ API REST para generación programática
- ✅ Personalización de formato (A4, Letter, etc.)
- ✅ Márgenes y opciones configurables
- ✅ Interfaz con estilos del Gobierno de México
- ✅ Pruebas unitarias con Jest
- ✅ TypeScript para mayor seguridad de tipos

## 📁 Estructura del Proyecto

```
crea-pdf-puppeteer/
├── src/
│   ├── app.ts                 # Servidor Express (punto de entrada)
│   ├── services/
│   │   └── pdfGenerator.ts    # Servicio de generación de PDFs
│   ├── views/
│   │   └── index.html         # Interfaz web del formulario
│   └── types/
│       └── index.ts           # Exportación de tipos
├── tests/
│   └── pdfGenerator.test.ts   # Pruebas unitarias
├── .env                       # Variables de entorno (no incluir en Git)
├── .env.example               # Ejemplo de configuración
├── .gitignore                 # Archivos ignorados por Git
├── jest.config.js             # Configuración de Jest
├── package.json               # Dependencias y scripts
├── tsconfig.json              # Configuración de TypeScript
└── README.md                  # Este archivo
```

## 🛠️ Explicación de Archivos

### **1. `package.json`**
Define las dependencias del proyecto y scripts de npm:
- **express**: Framework web para Node.js
- **puppeteer**: Librería para controlar Chrome/Chromium headless
- **dotenv**: Carga variables de entorno desde `.env`
- **typescript**: Superset de JavaScript con tipos estáticos
- **jest**: Framework de pruebas unitarias

### **2. `src/app.ts`**
Servidor principal de Express que:
- Configura middlewares (JSON, archivos estáticos)
- Define el endpoint POST `/generate-pdf` para generar PDFs
- Inicializa el browser de Puppeteer al arrancar
- Maneja cierre graceful del servidor

### **3. `src/services/pdfGenerator.ts`**
Clase que encapsula la lógica de generación de PDFs:
- `init()`: Inicializa el browser de Puppeteer
- `generatePDF()`: Convierte HTML a PDF con opciones personalizables
- `close()`: Cierra el browser correctamente
- Valida que el contenido HTML no esté vacío

### **4. `src/types/index.ts`**
Exporta tipos TypeScript para uso en otros módulos:
- `PDFOptions`: Interfaz para opciones de PDF
- `PDFGenerator`: Clase del generador

### **5. `src/views/index.html`**
Interfaz web con:
- Formulario para título y contenido
- Estilos del framework gubernamental mexicano
- JavaScript para enviar datos al servidor vía fetch
- Descarga automática del PDF generado
- Mensajes de éxito/error

### **6. `tests/pdfGenerator.test.ts`**
Pruebas unitarias que verifican:
- Generación correcta de PDFs desde HTML
- Manejo de errores (HTML vacío)
- Opciones personalizadas (formato, márgenes)
- HTML complejo con estilos

### **7. `.env` y `.env.example`**
Variables de entorno:
- `PORT`: Puerto del servidor (default: 3000)
- `PUPPETEER_HEADLESS`: Modo headless de Puppeteer

### **8. `tsconfig.json`**
Configuración de TypeScript:
- Target: ES6
- Módulos: CommonJS
- Modo estricto activado
- Output: `./dist`

### **9. `jest.config.js`**
Configuración de Jest para pruebas:
- Preset: ts-jest (para TypeScript)
- Timeout: 30 segundos (para Puppeteer)
- Coverage de archivos en `src/`

## 📥 Instalación

1. **Clona el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd crea-pdf-puppeteer
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno:**
   ```bash
   cp .env.example .env
   ```
   Edita `.env` según tus necesidades.

## ▶️ Uso

### **Modo Desarrollo**
```bash
npm start
```
o
```bash
npm run dev
```

Esto iniciará el servidor en `http://localhost:3000`

### **Compilar TypeScript**
```bash
npm run build
```

### **Ejecutar Pruebas**
```bash
npm test
```

### **Pruebas en modo watch**
```bash
npm run test:watch
```

## 🌐 API REST

### **POST /generate-pdf**

Genera un PDF desde contenido HTML.

**Body (JSON):**
```json
{
  "title": "Mi Documento",
  "content": "<p>Este es el contenido del documento</p>"
}
```

**Response:**
- **200**: PDF generado (application/pdf)
- **400**: Parámetros faltantes
- **500**: Error en la generación

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"<h1>Hola Mundo</h1>"}' \
  --output documento.pdf
```

## 🐛 Errores Corregidos

### ❌ **Errores Originales:**
1. **Dependencias faltantes**: `express`, `@types/express`, `dotenv`
2. **Browser no inicializado**: `this.browser = null` causaba error
3. **Sin validación**: No verificaba HTML vacío
4. **Endpoint mal implementado**: `generatePDF()` sin parámetros
5. **Tests sin inicialización**: No inicializaba/cerraba browser
6. **PDFOptions duplicado**: Definido en dos archivos diferentes
7. **Sin JavaScript funcional**: Formulario HTML sin lógica de envío

### ✅ **Soluciones Aplicadas:**
1. ✔️ Agregadas todas las dependencias necesarias
2. ✔️ Inicialización automática del browser
3. ✔️ Validación de contenido HTML
4. ✔️ Endpoint POST correcto con parámetros
5. ✔️ Tests con `beforeAll` y `afterAll`
6. ✔️ Unificación de tipos en `types/index.ts`
7. ✔️ JavaScript completo con fetch y descarga automática
8. ✔️ Configuración de Jest completa
9. ✔️ Archivo `.env` creado
10. ✔️ `.gitignore` actualizado

## 📝 Notas Importantes

- **Puppeteer descarga Chromium**: Primera instalación puede tardar
- **Memoria**: Puppeteer consume RAM, configura límites en producción
- **Seguridad**: Valida siempre el contenido HTML antes de generar PDFs
- **Performance**: Reutiliza la instancia de browser (no crear por request)

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.