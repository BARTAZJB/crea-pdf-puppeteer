# Manual de Usuario - Generador de Formatos ABC

Este sistema permite generar documentos PDF estandarizados (Altas, Bajas y Cambios) completando formularios dinámicos basados en plantillas predefinidas.

## Pantalla Principal

A continuación se muestra una vista general de la aplicación:

<!-- AQUÍ: Insertar una captura de pantalla de la interfaz principal del sistema, mostrando el selector de plantilla y el botón de historial -->
![Interfaz Principal](ruta/a/tu/imagen_interfaz.png)

---

## Guía Paso a Paso

### 1. Seleccionar una Plantilla
En la parte superior, despliega el menú **"Plantilla"** y elige el tipo de formato que deseas generar (ej. *Alta de cuenta de usuario interno*).
- Al seleccionar una plantilla, el sistema cargará automáticamente los campos necesarios para ese formato específico.

### 2. Llenar la Información
Completa los campos tal como se solicitan. El sistema cuenta con ayudas visuales:
- **Campos con asterisco (*):** Son obligatorios.
- **Validaciones Automáticas:**
  - **CURP y RFC:** Se validan automáticamente y se convierten a mayúsculas.
  - **Fechas:** Se muestra un calendario para facilitar la selección.
  - **Reporte Mesa de Servicio:** Solo permite Números (máximo 8 dígitos).
- **Listas Desplegables (Catálogos):** Algunos campos como *Puesto*, *Área* o *Unidad Administrativa* son listas predefinidas.
- **Direcciones:** Selecciona el ID de la dirección y el sistema llenará automáticamente ciudad, estado y código postal.

### 3. Justificación
Para el campo de Justificación, tienes dos opciones:
1. **Seleccionar de la lista:** Elige una justificación estándar pre-cargada.
2. **Escribir manualmente:** Marca la casilla *"Escribir justificación manualmente"* para redactar un texto personalizado.

### 4. Generar el PDF
Una vez que todos los campos obligatorios estén completos y validados (marcados con ✔ azul), el botón **"Generar PDF"** se habilitará.
- Haz clic en el botón.
- El archivo PDF se descargará automáticamente a tu equipo con un nombre estandarizado.

---

## Historial y Búsqueda de Registros

El sistema guarda automáticamente un historial de los formatos generados para que puedas reutilizar la información.

### Cargar un registro anterior
1. Haz clic en el botón **"📂 Cargar Historial"** en la parte superior derecha.
2. Se abrirá una ventana con la lista de los últimos registros generados.
3. Haz clic sobre cualquier registro para cargar toda esa información nuevamente en el formulario.

### Buscar por Reporte de Mesa de Servicio
Dentro de la ventana de historial, puedes buscar un formato específico usando el número de reporte:
1. En el campo **"🔍 Buscar por Reporte..."**, escribe el número del ticket.
2. La lista se filtrará automáticamente mostrando las coincidencias.
3. Selecciona el resultado deseado para cargarlo.

---

## Preguntas Frecuentes

**¿Por qué me aparece el error "Completa este campo"?**
El sistema impide generar el PDF si falta algún dato obligatorio o si formato es incorrecto (ej. un RFC incompleto o un reporte con letras). Revisa los campos marcados en rojo.

**¿Qué es "Nombre Responsable Conagua ADC"?**
Se refiere al nombre del responsable del área de Administración de Cuentas (o el rol equivalente configurado en el sistema) que debe aparecer en la firma del documento.
