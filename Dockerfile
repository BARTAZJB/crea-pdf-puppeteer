# Usa una imagen base oficial de Node.js con soporte para Chrome
# Slim version reducida basada en Debian (mejor compatibilidad que Alpine para Puppeteer)
FROM node:20-slim

# Instalar dependencias del sistema necesarias para Puppeteer (Chrome)
# Se necesitan librerías gráficas y de fuentes para que Chrome funcione en modo headless
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias de Node.js
RUN npm install

# Generar el cliente de Prisma
RUN npx prisma generate

# Copiar el resto del código fuente
COPY . .

# Compilar TypeScript a JavaScript (crea la carpeta dist)
RUN npm run build

# COPIAR ASSETS MANUALMENTE:
# TypeScript no copia archivos estáticos (HTML/CSS) a la carpeta dist automáticamente.
# Como el código busca 'views' relativo a __dirname (dist), debemos copiarlo ahí.
RUN cp -r src/views dist/views

# El código busca 'templates' relativo a process.cwd() (raíz), así que 'src/templates' ya está en su lugar por el COPY . .

# Asegurar carpeta de salida para PDFs con permisos seguros
# Creamos la carpeta y le asignamos la propiedad al usuario 'node'
RUN mkdir -p output_pdfs && chown -R node:node output_pdfs

# CAMBIO DE SEGURIDAD: Asignar propiedad de toda la app al usuario 'node'
# Esto permite que el usuario 'node' pueda leer/escribir donde sea necesario
RUN chown -R node:node /app

# CAMBIO DE SEGURIDAD: Cambiar al usuario 'node' (no-root)
# A partir de aquí, el contenedor corre con privilegios limitados
USER node

# Variable de entorno para Puppeteer
# Indica a puppeteer que use la versión de Chrome instalada o descargada, y evita errores de sandbox
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Exponer el puerto
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Exponer el puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
