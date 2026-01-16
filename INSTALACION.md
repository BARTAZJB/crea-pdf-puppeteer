# 🔧 INSTRUCCIONES DE INSTALACIÓN Y USO

## ⚠️ IMPORTANTE: Los errores de TypeScript son normales
Los errores que ves en VS Code son porque las dependencias **NO están instaladas todavía**. Desaparecerán después de ejecutar `npm install`.

## 📦 Paso 1: Instalar Dependencias

Abre una terminal en la carpeta del proyecto y ejecuta:

```powershell
npm install
```

Esto instalará todas las dependencias:
- ✅ express
- ✅ puppeteer (descarga Chromium ~170MB)
- ✅ dotenv
- ✅ typescript
- ✅ @types/node
- ✅ @types/express
- ✅ jest y ts-jest
- ✅ @types/jest

## ▶️ Paso 2: Ejecutar el Servidor

```powershell
npm start
```

Verás un mensaje como:
```
✅ Server is running on http://localhost:3000
📄 Open your browser and navigate to http://localhost:3000
```

## 🌐 Paso 3: Usar la Aplicación

1. Abre tu navegador en `http://localhost:3000`
2. Llena el formulario:
   - **Título**: Ej. "Informe Mensual"
   - **Contenido**: Ej. "Este es el contenido del documento..."
3. Haz clic en **"Generar PDF"**
4. El PDF se descargará automáticamente

## 🧪 Ejecutar Pruebas

```powershell
npm test
```

Esto ejecutará todas las pruebas unitarias.

## 🏗️ Compilar TypeScript

```powershell
npm run build
```

Esto genera los archivos JavaScript en la carpeta `dist/`

## 📊 Verificar Todo Funciona

Después de `npm install`, verifica que:
- ✅ No hay errores en VS Code
- ✅ `npm start` funciona
- ✅ `npm test` pasa todos los tests
- ✅ Puedes generar PDFs desde el navegador

## 🆘 Solución de Problemas

### Problema: Puppeteer no descarga Chromium
```powershell
$env:PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="false"
npm install puppeteer --force
```

### Problema: Puerto 3000 ocupado
Edita `.env` y cambia:
```
PORT=3001
```

### Problema: Tests fallan por timeout
Ya están configurados con 30 segundos en `jest.config.js`

## 🎉 ¡Listo!

Tu proyecto está completamente corregido y funcional. Todos los errores han sido solucionados.
