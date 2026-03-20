(() => {
  const templateSelect = document.getElementById('templateSelect');
  const fieldsContainer = document.getElementById('fieldsContainer');
  const btnGenerar = document.getElementById('btnGenerar');
  const msgEl = document.getElementById('msg');

  // --- NUEVO: GESTIÓN DE SESIÓN ---
  const userNameDisplay = document.getElementById('userNameDisplay');
  const btnLogout = document.getElementById('btnLogout');
  let currentUser = null; // Variable global para guardar info de sesión

  // 1. Verificar sesión al cargar
  fetch('/api/me')
    .then(res => {
        if (res.status === 401) {
            // No autorizado, redirigir
            window.location.href = '/login';
            throw new Error('No autorizado'); // detener ejecución
        }
        return res.json();
    })
    .then(userData => {
        currentUser = userData; // Guardamos usuario
        if (userData && userData.userName && userNameDisplay) {
            userNameDisplay.textContent = `Hola, ${userData.userName}`;
        }
    })
    .catch(err => console.warn('Sesión no válida o error network', err));

  // 2. Cerrar sesión
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/login';
        } catch (e) {
            console.error('Logout error', e);
        }
    });
  }
  // --- FIN GESTIÓN DE SESIÓN ---

  function showMsg(text, error = false) {
    if (!msgEl) return;
    msgEl.textContent = text || '';
    msgEl.className = error ? 'error' : 'ok';
    if (text) setTimeout(() => { msgEl.textContent=''; msgEl.className=''; }, 4000);
  }
  
  const snackbarEl = () => document.getElementById('snackbar');
  function showSnackbar(message, variant = 'info', timeout = 2000, actionText) {
    const el = snackbarEl();
    if (!el) return;
    el.className = 'snackbar';
    el.classList.add(`snackbar--${variant}`);
    el.innerHTML = `
      <span class="icon" aria-hidden="true">${variant === 'success' ? '✔' : variant === 'error' ? '⚠' : variant === 'warning' ? '!' : 'i'}</span>
      <div class="snackbar__message">${String(message)}</div>
      ${actionText ? `<div class="snackbar__action" role="button" tabindex="0">${actionText}</div>` : ''}
    `;
    if (actionText) {
      const act = el.querySelector('.snackbar__action');
      act.addEventListener('click', () => { el.classList.remove('show'); });
      act.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') el.classList.remove('show'); });
    }
    requestAnimationFrame(() => el.classList.add('show'));
    if (timeout > 0) {
      setTimeout(() => el.classList.remove('show'), timeout);
    }
  }

  async function fetchJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(await r.text() || r.statusText);
    return r.headers.get('content-type')?.includes('json') ? r.json() : r.text();
  }
  
  // FUNCIÓN AUXILIAR PARA GENERAR MAILTO
  function openMailWithReportRequest(templateName, data) {
    // 1. Destinatario y Asunto
    const recipient = 'mesadeayuda@conagua.gob.mx'; 
    const userName = (data['NOMBRES_USUARIO'] && data['APELLIDOS_USUARIO']) 
                     ? `${data['NOMBRES_USUARIO']} ${data['APELLIDOS_USUARIO']}`
                     : (data['NOMBRE_DEL_USUARIO'] || 'Usuario');
    const plantillaLimpia = templateName.replace(/_/g, ' ').replace('.html', '');
    const subject = `Solicitud de Número de Reporte - ${plantillaLimpia}`;

    // 2. Cuerpo del mensaje
    let body = `Solicitud de Número de Reporte - ${plantillaLimpia} - ${userName}\n\n`;
    body += `Por favor, genere el ticket correspondiente con la siguiente información:\n\n`;

    // Campos prioritarios
    const priority = ['JUSTIFICACION', 'NOMBRES_USUARIO', 'APELLIDOS_USUARIO', 'NOMBRE_DEL_USUARIO', 'PUESTO', 'UNIDAD_ADMINISTRATIVA', 'AREA', 'CURP', 'RFC', 'EXTENSION'];
    
    // Primero los prioritarios
    priority.forEach(key => {
        if(data[key]) {
            const val = String(data[key]).trim(); // Convertir a string por si llega otro tipo
            if(val) body += `${key.replace(/_/g, ' ')}: ${val}\n`;
        }
    });

    body += `\n--- OTROS DATOS ---\n`;
    // Resto de campos
    Object.keys(data).forEach(key => {
        if(priority.includes(key) || key === 'REPORTE_MESA_SERVICIOS' || key === 'FECHA_SOLICITUD' || key.startsWith('_') || key === 'templateName') return;
        const val = String(data[key]).trim();
        if(val && val.length < 100) { // Evitar campos muy largos en el mailto
             body += `${key.replace(/_/g, ' ')}: ${val}\n`;
        }
    });

    body += `\nGracias.`;

    // 3. Abrir mailto
    const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  }

  async function loadTemplates() {
    templateSelect.innerHTML = '<option value="">Cargando…</option>';
    try {
      const list = await fetchJSON('/templates');
      list.sort();
      templateSelect.innerHTML =
        '<option value="">-- Selecciona una plantilla --</option>' +
        list.map(f => {
            let label = f.replace(/_/g,' ').replace(/\.html$/,'');
            return `<option value="${f}">${label}</option>`;
        }).join('');
    } catch (e) {
      templateSelect.innerHTML = '<option value="">Error</option>';
      showMsg('Error cargando plantillas: ' + e.message, true);
    }
  }

  const supportsDateInput = (() => { const i = document.createElement('input'); i.type='date'; return i.type==='date'; })();
  const isFecha = s => /fecha|inicio_actividades|fin_actividades/i.test(s || '');
  const isCurp = s => /curp/i.test(s || ''); 
  const isRfc = s => /rfc/i.test(s || '');

  const prettyLabel = s => (s||'').replace(/_/g,' ').replace(/\s+/g,' ').trim()
    .replace(/\b\p{L}/gu, m => m.toLocaleUpperCase('es'));

  // KEYS que serán SELECTS
  const SELECT_KEYS = new Set([
    'TIPO_CUENTA','AREA','UNIDAD_ADMINISTRATIVA','SISTEMA',
    'PUESTO_SOLICITANTE', "PUESTO_USUARIO", "AREA", 
    "PUESTO_AUTORIZA", "PUESTO_RESPONSABLE_CONAGUA", "PUESTO_RESPONSABLE_CONAGUA_ADC",
    "JUSTIFICACION" 
  ]);

  const AUTO_TEMPLATE_PLACEHOLDER = 'TIPO_SOLICITUD';
  const CASCADE_MAP = { AREA: { parents: ['UNIDAD_ADMINISTRATIVA'] } };
  const HIDDEN_ADDRESS_PH = ['DIRECCION','CIUDAD','ESTADO','CODIGO_POSTAL'];
  const ADDRESS_MASTER_KEY = 'DIRECCION_ID';
  const ADDRESS_CSV_URL = 'docs/csv/direccion.csv';

  async function fetchCatalog(key, deps = {}) {
    const qs = new URLSearchParams(deps).toString();
    const r = await fetch(`/api/catalogs/${encodeURIComponent(key)}${qs ? `?${qs}` : ''}`);
    if (!r.ok) return [];
    const j = await r.json().catch(()=>({}));
    return j.options || [];
  }

  function renderSelectHTML(key, labelText) {
    let extraHTML = '';
    // VISTA PREVIA JUSTIFICACIÓN Y OPCIÓN MANUAL
    if (key.toUpperCase() === 'JUSTIFICACION') {
        extraHTML = `
        <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" id="chkManualJustificacion" style="width: auto; margin:0; cursor:pointer;" />
            <label for="chkManualJustificacion" style="margin:0; font-weight:normal; font-size:0.9em; cursor:pointer;text-align: left;">Escribir justificación manualmente</label>
        </div>

        <textarea id="txtManualJustificacion" 
            style="display:none; margin-top: 8px; width: 100%; border: 1px solid #ccc; border-radius: 4px; padding: 8px; font-family:inherit; min-height: 80px; text-align: left;" 
            placeholder="Escribe aquí tu justificación..."></textarea>
        
        <div id="justificacionPreview" style="
            margin-top: 8px; 
            padding: 10px; 
            background-color: #f3f4f6; 
            border: 1px solid #d1d5db; 
            border-radius: 4px; 
            color: #374151; 
            font-size: 0.9em; 
            display: none; 
            white-space: pre-wrap;
            text-align: left;"></div>`;
    }

    const msgReq = "Completa este campo";
    const attrsReq = `required oninvalid="this.setCustomValidity('${msgReq}')" oninput="this.setCustomValidity(''); updateStatusIcon(this)" onchange="updateStatusIcon(this)"`;

    // Si es Justificación, lo hacemos full-width
    const fieldClass = (key.toUpperCase() === 'JUSTIFICACION') ? "field full-width" : "field";
    const styleAttr = (key.toUpperCase() === 'JUSTIFICACION') ? 'style="grid-column: 1 / -1;"' : '';

    return `<div class="${fieldClass}" ${styleAttr}>
      <label>${labelText} <span class="status-icon" style="color:#d32f2f; font-weight:bold;">*</span></label>
      <select name="${key}" data-key="${key}" ${attrsReq} style="width:100%;">
        <option value="">-- Selecciona --</option>
      </select>
      ${extraHTML}
    </div>`;
  }

  function renderField(ph) {
    const labelText = prettyLabel(ph);
    // Usamos una clase 'status-icon' para manipularla luego
    const labelWithStar = `${labelText} <span class="status-icon" style="color:#d32f2f; font-weight:bold;">*</span>`;
    
    // VALIDACIÓN COMÚN
    const msgReq = "Completa este campo";
    // Agregamos updateStatusIcon(this) en oninput y onchange
    const attrsReq = `required oninvalid="this.setCustomValidity('${msgReq}')" oninput="this.setCustomValidity(''); updateStatusIcon(this)" onchange="updateStatusIcon(this)"`;

    // Ocultar fecha de solicitud (implicita)
    if (/fecha_solicitud/i.test(ph)) return ''; 

    if (ph === ADDRESS_MASTER_KEY) {
      return `<div class="field">
        <label>${labelWithStar}</label>
        <select name="${ph}" id="direccionSelect" ${attrsReq}>
          <option value="">-- Selecciona dirección --</option>
        </select>
        <div id="direccionResumen" class="direccion-resumen" style="margin-top:6px;font-size:12px;color:#444;"></div>
        </div>`;
    }
    
    if (HIDDEN_ADDRESS_PH.includes(ph)) return '';
    
    if (SELECT_KEYS.has(ph) || SELECT_KEYS.has(ph.toUpperCase())) {
        return renderSelectHTML(ph, labelText);
    }
    
    if (isCurp(ph)) {
        const curpRegex = "^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])[HM]{1}(AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]{1}[0-9]{1}$";
        // CURP ya tiene required en código viejo
        return `<div class="field"><label>${labelWithStar}</label><input type="text" name="${ph}" placeholder="Ej: ABCD900101HDF..." maxlength="18" style="text-transform: uppercase;" pattern="${curpRegex}" title="Ingresa una CURP válida" oninput="this.value = this.value.toUpperCase(); this.setCustomValidity(''); updateStatusIcon(this)" onchange="updateStatusIcon(this)" oninvalid="this.setCustomValidity('CURP inválida o vacía. ${msgReq}')" required /></div>`;
    }
    if (isRfc(ph)) {
        const rfcRegex = "^[A-ZÑ&]{3,4}\\d{6}([A-Z0-9]{3})?$";
        return `<div class="field"><label>${labelWithStar}</label><input type="text" name="${ph}" placeholder="Ej: ABCD900101" maxlength="13" minlength="10" style="text-transform: uppercase;" pattern="${rfcRegex}" title="Ingresa un RFC válido" oninput="this.value = this.value.toUpperCase(); this.setCustomValidity(''); updateStatusIcon(this)" onchange="updateStatusIcon(this)" oninvalid="this.setCustomValidity('RFC inválido o vacío. ${msgReq}')" required /></div>`;
    }
    if (isFecha(ph)) {
        const today = new Date().toISOString().split('T')[0];
        if (supportsDateInput) return `<div class="field"><label>${labelWithStar}</label><input type="date" name="${ph}" min="${today}" ${attrsReq} /></div>`;
        return `<div class="field"><label>${labelWithStar}</label><input type="text" name="${ph}" placeholder="AAAA-MM-DD" pattern="\\d{4}-\\d{2}-\\d{2}" ${attrsReq} /></div>`;
    }

    // --- NUEVO: Validación Reporte Mesa Servicios (Numérico, Max 8 chars) ---
    // AHORA OPCIONAL
    if (/reporte_mesa_servicios/i.test(ph)) {
        return `<div class="field">
            <label>${labelText}</label>
            <input type="text" name="${ph}" placeholder="Ej. 12345678 (Opcional)" 
                   maxlength="8" 
                   pattern="\\d{0,8}" 
                   title="Ingresa solo números (máximo 8 dígitos)"
                   oninput="this.value = this.value.replace(/[^0-9]/g, ''); this.setCustomValidity(''); updateStatusIcon(this)"
                   onchange="updateStatusIcon(this)"
                    />
        </div>`;
    }

    return `<div class="field"><label>${labelWithStar}</label><input type="text" name="${ph}" placeholder="${labelText}" ${attrsReq} /></div>`;
  }
  
  // Función global para actualizar el icono
  window.updateStatusIcon = function(input) {
    // Buscamos el label padre o previo
    const fieldDiv = input.closest('.field');
    if (!fieldDiv) return;
    const iconSpan = fieldDiv.querySelector('.status-icon');
    if (!iconSpan) return;

    // Si tiene valor y es válido
    if (input.value && input.value.trim() !== '' && input.checkValidity()) {
        iconSpan.innerHTML = '✔';
        iconSpan.style.color = '#1e88e5'; // Azul
    } else {
        iconSpan.innerHTML = '*';
        iconSpan.style.color = '#d32f2f'; // Rojo
    }
  };

  // --- HELPERS CSV ---
  async function loadDireccionesCSV(){ return new Promise((resolve, reject) => { Papa.parse(ADDRESS_CSV_URL, { download: true, header: true, skipEmptyLines: true, complete: res => resolve((res.data || []).filter(r => r && r.ID)), error: err => reject(err) }); }); }
  function ensureHiddenAddressInputs(container) { HIDDEN_ADDRESS_PH.forEach(name => { if (!container.querySelector(`input[name="${name}"]`)) { const hidden = document.createElement('input'); hidden.type = 'hidden'; hidden.name = name; hidden.setAttribute('data-auto-fill', name); container.appendChild(hidden); } }); }
  function resetAutoFill(container) { container.querySelectorAll('[data-auto-fill]').forEach(el => { el.value = ''; }); const r = container.querySelector('#direccionResumen'); if (r) r.textContent = ''; }
  function fillAuto(container, row) { 
      const map = { CIUDAD: row['Ciudad']||'', ESTADO: row['Estado']||'', CODIGO_POSTAL: String(row['C.P']||'').slice(0,5), DIRECCION: row['Dirección']||row['Direccion']||'' };
      container.querySelectorAll('[data-auto-fill]').forEach(el => { const k = el.getAttribute('data-auto-fill'); if (k && map[k]!==undefined) el.value = map[k]; });
      const r = container.querySelector('#direccionResumen'); if(r) r.textContent = map.DIRECCION ? `${map.DIRECCION} ${map.CIUDAD}` : '';
  }
  async function initDirecciones(container) { const sel = container.querySelector('#direccionSelect'); if(!sel)return; try{ const rows = await loadDireccionesCSV(); sel.innerHTML=`<option value="">-- Selecciona --</option>`+rows.map(r=>`<option value="${r.ID}" data-row='${JSON.stringify(r)}'>${r.ID}</option>`).join(''); }catch{ sel.innerHTML='Error'; } sel.addEventListener('change',()=>{ resetAutoFill(container); const o=sel.selectedOptions[0]; if(o&&o.dataset.row) fillAuto(container, JSON.parse(o.dataset.row)); }); }
  function ensureAutoTemplateInput(c, t, p) { if(!p.includes(AUTO_TEMPLATE_PLACEHOLDER))return; let el=c.querySelector(`input[name="${AUTO_TEMPLATE_PLACEHOLDER}"]`); if(!el){ el=document.createElement('input'); el.type='hidden'; el.name=AUTO_TEMPLATE_PLACEHOLDER; c.appendChild(el); } el.value=t.replace(/\.html$/i,'').trim(); }

  // --- LÓGICA DE JUSTIFICACIÓN (MENU GENERAL) ---
  async function hydrateJustificacion(container, templateName) {
    let sel = container.querySelector('select[data-key="justificacion"]');
    if (!sel) sel = container.querySelector('select[data-key="JUSTIFICACION"]');
    if (!sel) return; 

    // Determinar tipo de plantilla actual
    let currentTemplateType = 'GENERAL';
    const tName = (templateName || '').toLowerCase();
    if (tName.includes('alta')) currentTemplateType = 'ALTA';
    else if (tName.includes('baja')) currentTemplateType = 'BAJA';
    else if (tName.includes('cambio')) currentTemplateType = 'CAMBIO';

    // Obtener TODAS las opciones
    const rawOptions = await fetchCatalog('JUSTIFICACION');
    
    sel.innerHTML = '<option value="">-- Selecciona una justificación --</option>';
    
    rawOptions.forEach(opt => {
        const parts = opt.split('|');
        if (parts.length < 3) return;

        const [tipoRaw, labelRaw, valueRaw] = parts;
        const tipo = tipoRaw.toUpperCase().trim();
        const labelText = labelRaw.trim();
        const valueText = valueRaw.trim();

        // FILTRADO: Mostrar solo si coincide el tipo (o si es GENERAL)
        if (tipo !== 'GENERAL' && tipo !== currentTemplateType) {
            return; 
        }

        const option = document.createElement('option');
        option.value = valueText; // Valor real (texto largo)
        option.textContent = labelText; // Texto visible (título corto)
        option.title = valueText; // Tooltip con el texto completo
        sel.appendChild(option);
    });

    // Vista Previa y Lógica Checkbox Manual
    const previewDiv = document.getElementById('justificacionPreview');
    const chkManual = document.getElementById('chkManualJustificacion');
    const txtManual = document.getElementById('txtManualJustificacion');

    if (previewDiv) {
        sel.addEventListener('change', () => {
             // Si el checkbox está marcado, ignoramos el select (aunque debería estar disabled)
             if (chkManual && chkManual.checked) return;

            const val = sel.value;
            if (val) {
                previewDiv.textContent = val;
                previewDiv.style.display = 'block';
            } else {
                previewDiv.style.display = 'none';
                previewDiv.textContent = '';
            }
        });
    }

    if (chkManual && txtManual) {
        chkManual.addEventListener('change', () => {
            const isManual = chkManual.checked;
            
            sel.disabled = isManual;
            txtManual.style.display = isManual ? 'block' : 'none';
            
            if (isManual) {
                // Modo Manual: El textarea manda el valor 'JUSTIFICACION'
                sel.removeAttribute('name'); 
                txtManual.setAttribute('name', 'JUSTIFICACION');
                txtManual.required = true;
                // AGREGADO: Mensaje personalizado para el textarea manual
                txtManual.oninvalid = function() { this.setCustomValidity('Completa este campo'); };
                txtManual.oninput = function() { this.setCustomValidity(''); };
                
                // Ocultamos preview del select
                if (previewDiv) previewDiv.style.display = 'none';
            } else {
                // Modo Select: El select manda el valor
                txtManual.removeAttribute('name'); 
                txtManual.required = false;
                sel.setAttribute('name', 'JUSTIFICACION');
                
                // Restaurar preview si hay algo seleccionado
                sel.dispatchEvent(new Event('change'));
            }
        });
    }
  }

  async function loadPlaceholders(name) {
    fieldsContainer.innerHTML = '';
    btnGenerar.disabled = true;
    if (!name) return;
    try {
      const data = await fetchJSON(`/templates/${encodeURIComponent(name)}/placeholders`);
      const phs = data.placeholders || [];
      // 1. Añadimos placeholders ocultos y Dirección
      HIDDEN_ADDRESS_PH.forEach(p => { if (!phs.includes(p)) phs.push(p); });
      if (!phs.includes(ADDRESS_MASTER_KEY)) phs.unshift(ADDRESS_MASTER_KEY);

      // 2. Extraer JUSTIFICACION y enviarla al final
      const justIndex = phs.findIndex(p => p.toUpperCase() === 'JUSTIFICACION');
      if (justIndex > -1) {
          phs.splice(justIndex, 1);
          phs.push('JUSTIFICACION');
      }

      // 3. Renderizar campos
      const rendered = phs.filter(p => p !== AUTO_TEMPLATE_PLACEHOLDER).map(renderField).join('');
      fieldsContainer.innerHTML = rendered;
      ensureHiddenAddressInputs(fieldsContainer);
      ensureAutoTemplateInput(fieldsContainer, name, phs);
      
      await hydrateSelects(fieldsContainer);
      await hydrateJustificacion(fieldsContainer, name); // Menú general
      
      await initDirecciones(fieldsContainer);
      btnGenerar.disabled = false;
    } catch (e) {
      fieldsContainer.innerHTML = '<p>Error.</p>';
      showMsg('Error placeholders: ' + e.message, true);
    }
  }

  async function hydrateSelects(container) {
    async function loadOne(sel) {
      const key = sel.dataset.key;
      if (key.toUpperCase() === 'JUSTIFICACION') return; // Saltamos

      const config = CASCADE_MAP[key];
      const deps = {};
      if (config && config.parent) {
         const p = container.querySelector(`select[name="${config.parent}"]`);
         deps[config.parent] = p?.value || '';
      }
      const opts = await fetchCatalog(key, deps);
      sel.innerHTML = `<option value="">-- Selecciona --</option>` + opts.map(o => `<option value="${o}">${o}</option>`).join('');
    }
    const selects = [...container.querySelectorAll('select[data-key]')];
    for (const sel of selects) await loadOne(sel);

    const uaSel = container.querySelector('select[name="UNIDAD_ADMINISTRATIVA"]');
    const areaSel = container.querySelector('select[name="AREA"]');
    if (uaSel && areaSel) {
      uaSel.addEventListener('change', async () => {
        areaSel.innerHTML = '<option value="">-- Selecciona AREA--</option>'; 
        const opts = await fetchCatalog('AREA', { UNIDAD_ADMINISTRATIVA: uaSel.value });
        areaSel.innerHTML = `<option value="">-- Selecciona --</option>` + opts.map(o => `<option value="${o}">${o}</option>`).join('');
      });
    }
  }

  function renderDateLabel() {
    const container = document.getElementById('fecha-container');
    if (!container) return;

    const today = new Date();
    // Formato: 4 de febrero de 2026
    const dateStr = today.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' });
    
    // Inyectamos texto directo. Los estilos los maneja el CSS (clase date-display-big)
    container.innerHTML = `<strong>📅 Fecha:</strong> ${dateStr}`;
  }

  /* --- LOGICA MODAL REPORTE FALTANTE --- */
  const modalMissing = document.getElementById('modalMissingReport');
  const btnSolicitarRep = document.getElementById('btnSolicitarReporte');
  const btnGenerarPend = document.getElementById('btnGenerarPendiente');
  const btnCancelarRep = document.getElementById('btnCancelarReporte');
  const closeMissingX = document.getElementById('closeMissingX');
  
  let _pendingData = null; 
  let _pendingTemplate = null;

  function showMissingReportModal(templateName, data) {
      _pendingTemplate = templateName;
      _pendingData = data;
      if (modalMissing) modalMissing.showModal();
  }
  
  // FUNCION AUXILIAR PARA GENERAR LA PETICION (Extraída para reutilizar)
  async function executeGeneration(templateName, data) {
    try {
      const resp = await fetch('/generate-pdf-template', {
        method: 'POST', 
        headers: { 'Content-Type':'application/json' }, 
        body: JSON.stringify({ 
            templateName, 
            data,
            draftId: currentDraftId 
        })
      });
      if (!resp.ok) throw new Error((await resp.json()).error || 'Error generando PDF');
    
    // Guardamos el ID del draft si viene en el header
    const newDraftId = resp.headers.get('X-Draft-Id');
    const isPending = !data['REPORTE_MESA_SERVICIOS'];

    if (newDraftId) {
        currentDraftId = newDraftId;
        if (isPending) {
            showSnackbar(`⚠ PDF generado. Registro guardado como: PENDIENTE (ID: ${newDraftId})`, 'warning', 8000);
        } else {
            showSnackbar(`Registro actualizado correctamente (ID: ${newDraftId})`, 'success', 4000);
        }
    }

      const blob = await resp.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = templateName.replace(/\.html$/,'') + '.pdf';
      a.click();
      showMsg('PDF generado');
      // showSnackbar('PDF generado correctamente', 'success', 3500); 
    } catch (e) { showSnackbar(e.message, 'error', 6000); }
  }

  // FUNCION PARA GUARDAR SOLO EL BORRADOR (SIN PDF)
  async function savePendingDraft(templateName, data) {
    try {
        const resp = await fetch('/api/save-draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                templateName,
                data,
                draftId: currentDraftId 
            })
        });
        
        const resJson = await resp.json();
        
        if (!resp.ok) {
            throw new Error(resJson.error || 'Error al guardar borrador');
        }

        if(resJson.success) {
            currentDraftId = resJson.draftId;
            showSnackbar(`Solicitud iniciada. Borrador guardado como PENDIENTE (ID: ${currentDraftId})`, 'warning', 6000);
        }
    } catch(e) {
        showSnackbar(e.message, 'error', 6000);
    }
  }

  // EVENT LISTENERS DEL MODAL
  if (modalMissing) {
      // 1. Solicitar Correo
      if (btnSolicitarRep) {
          btnSolicitarRep.addEventListener('click', () => {
             if (_pendingTemplate && _pendingData) {
                 // ABRIR CORREO
                 openMailWithReportRequest(_pendingTemplate, _pendingData);
                 
                 // GUARDAR COMO PENDIENTE (SIN GENERAR PDF)
                 savePendingDraft(_pendingTemplate, _pendingData);
                 
                 modalMissing.close();
             }
          });
      }
      // 2. Solo Generar (Pendiente)
      if (btnGenerarPend) {
          btnGenerarPend.addEventListener('click', () => {
              if (_pendingTemplate && _pendingData) {
                  executeGeneration(_pendingTemplate, _pendingData);
              }
              modalMissing.close();
          });
      }
      // 3. Cancelar (No generar nada)
      if (btnCancelarRep) btnCancelarRep.addEventListener('click', () => modalMissing.close());
      if (closeMissingX) closeMissingX.addEventListener('click', () => modalMissing.close());
  }

  async function generar() {
    const templateName = templateSelect.value;
    if (!templateName) return showMsg('Selecciona plantilla', true);
    const inputs = fieldsContainer.querySelectorAll('input, select, textarea');
    let valid = true;
    for (const el of inputs) {
        if (el.type !== 'hidden' && !el.checkValidity()) { el.reportValidity(); valid = false; break; }
    }
    if (!valid) return; 
    const data = {};
    inputs.forEach(el => { 
        const key = el.name; 
        if (!key) return; 
        let val = (el.value || '').trim();
        
        // Reformat dates YYYY-MM-DD -> DD de mes de YYYY
        if (isFecha(key) && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
            const [y, m, d] = val.split('-');
            const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            val = `${parseInt(d, 10)} de ${meses[parseInt(m, 10) - 1]} de ${y}`;
        }

        data[key] = val;
    });
    
    // Inyectar fecha MANUALMENTE con formato largo
    const now = new Date();
    data['FECHA_SOLICITUD'] = now.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }); 
    
    // VALIDACIÓN INTERACTIVA DE CORREO (CON MODAL)
    if (!data['REPORTE_MESA_SERVICIOS']) {
        // DETENEMOS FLUJO y mostramos Modal
        showMissingReportModal(templateName, data);
        return; 
    }

    // Si tiene reporte, generamos directo
    executeGeneration(templateName, data);
  }


  /* --- LOGICA DE BORRADORES / HISTORIAL --- */
  let currentDraftId = null;

  async function loadDraftsList(searchQuery = '', showPending = false) {
      const listEl = document.getElementById('draftsList');
      if (!listEl) return;
      
      let loadingMsg = searchQuery ? '🔍 Buscando...' : 'Cargando...';
      if(showPending) loadingMsg = '🔍 Buscando pendientes...';

      listEl.innerHTML = `<li style="padding:20px; text-align:center;">${loadingMsg}</li>`;
      
      try {
          const params = new URLSearchParams();
          if(searchQuery) params.append('q', searchQuery);
          if(showPending) params.append('pending', 'true');

          const res = await fetch(`/api/drafts?${params.toString()}`);
          const drafts = await res.json();
          if (!drafts || drafts.length === 0) {
              listEl.innerHTML = '<li style="padding:20px; text-align:center;">No se encontraron registros</li>';
              return;
          }
          listEl.innerHTML = '';
          // drafts ya viene ordenado DESC desde el backend (más recientes primero)
          drafts.forEach(d => {
              const li = document.createElement('li');
              li.style.marginBottom = '10px';
              li.style.padding = '10px';
              li.style.borderBottom = '1px solid #eee';
              li.style.backgroundColor = '#f9f9f9';
              li.style.borderRadius = '5px';
              li.style.cursor = 'pointer';
              li.style.display = 'flex';
              li.style.justifyContent = 'space-between';
              li.style.alignItems = 'center';
              
              const fecha = new Date(d.fechaCreation || d.fechaActualizacion || d.fechaCreacion); // Fallback
              
              // Muestra el reporte si existe
              const json = typeof d.datosJson === 'string' ? JSON.parse(d.datosJson) : d.datosJson;
              const reporteVal = json?.REPORTE_MESA_SERVICIOS || '';
              
              let reporteHtml = '';
              if (reporteVal) {
                  reporteHtml = `<br/><span style="font-size:0.85em;color:#0066cc;">Reporte: ${reporteVal}</span>`;
              } else {
                  // Si no hay reporte, mostrar etiqueta PENDIENTE
                  reporteHtml = `<br/><span style="font-size:0.85em;color:#d32f2f;font-weight:bold;">⚠ PENDIENTE DE REPORTE</span>`;
              }
              
              // Muestra el Creador, solo si es ADMIN
              let creatorHtml = '';
              if (currentUser && currentUser.role === 'ADMIN' && d.usuario) {
                  creatorHtml = `<div style="font-size:0.85em; color:#005500; margin-top:2px; text-align:left;">👤 Creado por: ${d.usuario.nombre} (${d.usuario.email})</div>`;
              }

              let downloadHtml = '';
              if (d.pdfsGenerados && d.pdfsGenerados.length > 0) {
                 const pdfUrl = d.pdfsGenerados[0].archivoPath;
                 downloadHtml = `
                    <button class="btn-download-pdf" data-url="${pdfUrl}" 
                            style="margin-top:5px; padding:4px 8px; background-color:#2e7d32; color:white; border:none; border-radius:4px; font-size:0.8em; cursor:pointer;"
                            title="Descargar PDF generado previamente">
                        ⬇ PDF
                    </button>`;
              }

              li.innerHTML = `
                  <div style="flex: 1;">
                      <strong style="color:#003366;">${d.nombreUsuario || 'Sin Nombre'}</strong> <span style="font-size:0.8em; color:#666;">(ID: ${d.id})</span>
                      ${reporteHtml}
                      ${creatorHtml}
                      <br/>
                      <small style="color:#555;">${d.plantilla.replace('.html','')}</small>
                  </div>
                  <div style="text-align:right; font-size:0.85em; min-width: 100px;">
                      <div>${fecha.toLocaleDateString()}</div>
                      <div style="color:#888;">${fecha.toLocaleTimeString()}</div>
                      ${downloadHtml}
                  </div>
              `;
              
              li.addEventListener('click', (ev) => {
                  // Si el click fue en el botón de PDF, no cargamos el borrador
                  if (ev.target.classList.contains('btn-download-pdf')) {
                      ev.stopPropagation();
                      const url = ev.target.getAttribute('data-url');
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = ''; // triggers download
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      return;
                  }
                  loadDraft(d.id);
              });
              li.addEventListener('mouseenter', () => li.style.backgroundColor = '#eef');
              li.addEventListener('mouseleave', () => li.style.backgroundColor = '#f9f9f9');
              listEl.appendChild(li);
          });
      } catch (e) {
          listEl.innerHTML = '<li style="padding:20px; text-align:center; color:red;">Error obteniendo lista</li>';
      }
  }

  async function loadDraft(id) {
      try {
          const res = await fetch(`/api/drafts/${id}`);
          if (!res.ok) throw new Error('Error al obtener borrador');
          const record = await res.json();
          
          if (!record || !record.plantilla) throw new Error('Datos de borrador inválidos');

          // 1. Seleccionar plantilla
          templateSelect.value = record.plantilla;
          
          // 2. Cargar campos (esperar a que se rendericen)
          await loadPlaceholders(record.plantilla);

          // 3. Rellenar datos
          const formData = record.datosJson || {};
          
          // Estrategia de llenado: llenar todo lo posible, disparar eventos para dependencias
          const inputs = fieldsContainer.querySelectorAll('input, select, textarea');
          
          // Pasada 1: Llenar campos simples y selects padres
          inputs.forEach(input => {
              if (formData[input.name]) {
                  input.value = formData[input.name];
                  // Disparar change para selects dependientes (ej: UNIDAD_ADMINISTRATIVA)
                  if (input.tagName === 'SELECT') {
                      input.dispatchEvent(new Event('change'));
                  }
                  // Actualizar iconos de validación visual
                  if (window.updateStatusIcon) window.updateStatusIcon(input);
              }
          });

          // Pequeña espera para que los selects dependientes se hidraten (hack simple)
          await new Promise(r => setTimeout(r, 500));

          // Pasada 2: Re-aplicar valores (para selects dependientes que se acaban de llenar)
          inputs.forEach(input => {
            if (formData[input.name] && input.value !== formData[input.name]) {
                input.value = formData[input.name];
                if (window.updateStatusIcon) window.updateStatusIcon(input);
            }
          });

          // Hack especial para DIRECCION (que tiene lógica compleja de autocompletado)
          if (formData['DIRECCION_ID']) {
             const dirSel = fieldsContainer.querySelector('#direccionSelect');
             if (dirSel) {
                 dirSel.value = formData['DIRECCION_ID'];
                 dirSel.dispatchEvent(new Event('change'));
             }
          }

          currentDraftId = id;
          showSnackbar(`Borrador cargado (ID: ${id})`, 'success');
          
          // Cerrar modal
          const modal = document.getElementById('draftsModal');
          if (modal) modal.close();

      } catch (e) {
          showSnackbar('Error cargando borrador: ' + e.message, 'error');
      }
  }

  // Event Listeners para el modal
  const btnLoad = document.getElementById('btnLoadDraft');
  const modal = document.getElementById('draftsModal');
  const btnClose = document.getElementById('btnCloseDrafts');
  const btnCloseX = document.getElementById('btnCloseDraftsX'); // La X de arriba
  const searchInput = document.getElementById('searchReporte'); // Nuevo input
  const pendingCheckbox = document.getElementById('chkShowPending'); // Checkbox pendientes

  if (btnLoad && modal) {
      btnLoad.addEventListener('click', () => {
          modal.showModal();
          // Reset filtros
          if(searchInput) searchInput.value = '';
          if(pendingCheckbox) pendingCheckbox.checked = false;
          
          loadDraftsList(); // Carga inicial sin filtro
          if(searchInput) searchInput.focus();
      });
  }

  // FUNCION HELPER para obtener el valor actual del input
  const getSearchVal = () => searchInput ? searchInput.value.trim() : '';

  // BUSQUEDA EN TIEMPO REAL (con debounce)
  let _searchDebounce;
  if (searchInput) {
      searchInput.addEventListener('input', (e) => {
          clearTimeout(_searchDebounce);
          _searchDebounce = setTimeout(() => {
              const pendingState = pendingCheckbox ? pendingCheckbox.checked : false;
              loadDraftsList(e.target.value.trim(), pendingState);
          }, 400); // espera 400ms para no saturar
      });
  }

  // CHECKBOX PENDIENTES
  if (pendingCheckbox) {
      pendingCheckbox.addEventListener('change', (e) => {
          const searchVal = getSearchVal();
          loadDraftsList(searchVal, e.target.checked);
      });
  }

  if (btnClose && modal) {
      btnClose.addEventListener('click', () => modal.close());
  }
  if (btnCloseX && modal) {
      btnCloseX.addEventListener('click', () => modal.close());
  }
  // Cerrar al hacer click fuera del modal
  if (modal) {
      modal.addEventListener('click', (event) => {
          if (event.target === modal) modal.close();
      });
  }
  /* ------------------------------------- */

  function init() {
    if (!templateSelect) return;
    loadTemplates();
    renderDateLabel(); 
    templateSelect.addEventListener('change', e => loadPlaceholders(e.target.value));
    btnGenerar.addEventListener('click', generar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();