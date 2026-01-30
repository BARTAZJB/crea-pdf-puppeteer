(() => {
  // --- Referencias DOM ---
  const templateSelect = document.getElementById('templateSelect');
  const fieldsContainer = document.getElementById('fieldsContainer');
  const btnGenerar = document.getElementById('btnGenerar');
  const msgEl = document.getElementById('msg');

  // --- Mensajes ---
  function showMsg(text, error = false) {
    if (!msgEl) return;
    msgEl.textContent = text || '';
    msgEl.className = error ? 'error' : 'ok';
    if (text) setTimeout(() => { msgEl.textContent=''; msgEl.className=''; }, 4000);
  }
  
  // --- Snackbar ---
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

  // --- Fetch JSON ---
  async function fetchJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(await r.text() || r.statusText);
    return r.headers.get('content-type')?.includes('json') ? r.json() : r.text();
  }

  // --- Cargar lista de plantillas ---
  async function loadTemplates() {
    templateSelect.innerHTML = '<option value="">Cargando…</option>';
    try {
      const list = await fetchJSON('/templates');
      // Ordenar lista para que Honorarios quede junto a su par
      list.sort();
      templateSelect.innerHTML =
        '<option value="">-- Selecciona una plantilla --</option>' +
        list.map(f => {
            let label = f.replace(/_/g,' ').replace(/\.html$/,'');
            // Hacer que se vea bonito en el select
            return `<option value="${f}">${label}</option>`;
        }).join('');
    } catch (e) {
      templateSelect.innerHTML = '<option value="">Error</option>';
      showMsg('Error cargando plantillas: ' + e.message, true);
    }
  }

  // --- Detectores ---
  const supportsDateInput = (() => { const i = document.createElement('input'); i.type='date'; return i.type==='date'; })();
  const isFecha = s => /fecha/i.test(s || '');
  const isCurp = s => /curp/i.test(s || ''); 
  const isRfc = s => /rfc/i.test(s || '');
  const isJustificacion = s => /justificacion/i.test(s || '');

  const prettyLabel = s => (s||'').replace(/_/g,' ').replace(/\s+/g,' ').trim()
    .replace(/\b\p{L}/gu, m => m.toLocaleUpperCase('es'));

  // --- Selects ---
  // Agregamos 'JUSTIFICACION' (o 'justificacion' si viene en minuscula) a las llaves de select
  const SELECT_KEYS = new Set([
    'TIPO_CUENTA','AREA','UNIDAD_ADMINISTRATIVA','SISTEMA',
    'PUESTO_SOLICITANTE', "PUESTO_USUARIO", "AREA", 
    "PUESTO_AUTORIZA", "PUESTO_RESPONSABLE_CONAGUA",
    "JUSTIFICACION" // <--- IMPORTANTE: Ahora es select
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

  // --- RENDER DE SELECT ---
  // Modificado para recibir opciones pre-cargadas si es necesario
  function renderSelectHTML(key, labelText) {
    return `<div class="field">
      <label>${labelText}</label>
      <select name="${key}" data-key="${key}">
        <option value="">-- Selecciona --</option>
      </select>
    </div>`;
  }

  // --- RENDERIZADO DE CAMPOS ---
  function renderField(ph) {
    const labelText = prettyLabel(ph);
    
    // 1. FECHA DE SOLICITUD: Ocultar
    if (/fecha_solicitud/i.test(ph)) return ''; 

    // 2. Select de Dirección Maestra
    if (ph === ADDRESS_MASTER_KEY) {
      return `<div class="field">
        <label>${labelText}</label>
        <select name="${ph}" id="direccionSelect">
          <option value="">-- Selecciona dirección --</option>
        </select>
        <div id="direccionResumen" class="direccion-resumen" style="margin-top:6px;font-size:12px;color:#444;"></div>
        </div>`;
    }
    
    if (HIDDEN_ADDRESS_PH.includes(ph)) return '';
    
    // 3. Selects normales (Incluye Justificación)
    if (SELECT_KEYS.has(ph.toUpperCase())) return renderSelectHTML(ph, labelText);
    
    // 4. Validaciones
    if (isCurp(ph)) {
        const curpRegex = "^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])[HM]{1}(AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]{1}[0-9]{1}$";
        return `<div class="field"><label>${labelText}</label><input type="text" name="${ph}" placeholder="Ej: ABCD900101HDF..." maxlength="18" style="text-transform: uppercase;" pattern="${curpRegex}" title="Ingresa una CURP válida" oninput="this.value = this.value.toUpperCase()" required /></div>`;
    }
    if (isRfc(ph)) {
        const rfcRegex = "^[A-ZÑ&]{3,4}\\d{6}([A-Z0-9]{3})?$";
        return `<div class="field"><label>${labelText}</label><input type="text" name="${ph}" placeholder="Ej: ABCD900101" maxlength="13" minlength="10" style="text-transform: uppercase;" pattern="${rfcRegex}" title="Ingresa un RFC válido" oninput="this.value = this.value.toUpperCase()" required /></div>`;
    }
    if (isFecha(ph)) {
        if (supportsDateInput) return `<div class="field"><label>${labelText}</label><input type="date" name="${ph}" /></div>`;
        return `<div class="field"><label>${labelText}</label><input type="text" name="${ph}" placeholder="AAAA-MM-DD" pattern="\\d{4}-\\d{2}-\\d{2}" /></div>`;
    }

    // Input normal
    return `<div class="field"><label>${labelText}</label><input type="text" name="${ph}" placeholder="${labelText}" /></div>`;
  }

  // --- LÓGICA DE JUSTIFICACIÓN INTELIGENTE ---
  async function hydrateJustificacion(container, currentTemplateName) {
    const sel = container.querySelector('select[data-key="justificacion"]');
    if (!sel) {
        // Fallback: buscar mayuscula
        const selCaps = container.querySelector('select[data-key="JUSTIFICACION"]');
        if(!selCaps) return;
        return hydrateJustificacion(container, currentTemplateName); // Reintentar con el select encontrado
    }

    // 1. Obtener todas las justificaciones del CSV (Formato esperado: TIPO|TEXTO)
    // El backend debe configurarse para leer 'justificacion.csv'
    const rawOptions = await fetchCatalog('JUSTIFICACION');
    
    // 2. Determinar tipo de plantilla actual
    const tName = currentTemplateName.toLowerCase();
    let tipoFiltro = [];

    if (tName.includes('alta')) {
        tipoFiltro = ['ALTA'];
    } else if (tName.includes('baja')) {
        tipoFiltro = ['BAJA'];
    } else if (tName.includes('cambio')) {
        // La regla dice: Cambio y Reactivaciones para cambios
        tipoFiltro = ['CAMBIO', 'REACTIVACION', 'REACTIVACIÓN'];
    }

    // 3. Filtrar y llenar select
    // Asumimos que el string viene como "TIPO|Descripción completa..."
    sel.innerHTML = '<option value="">-- Selecciona Justificación --</option>';
    
    rawOptions.forEach(optStr => {
        // Separamos el tipo del texto. 
        // Si el CSV no tiene separador, asumimos que todo es texto.
        // Pero para que esto funcione, en el catalogService.ts debimos formatearlo.
        const parts = optStr.split('|');
        let tipoItem = '';
        let textoItem = optStr;

        if (parts.length > 1) {
            tipoItem = parts[0].toUpperCase().trim();
            textoItem = parts.slice(1).join('|').trim(); // Unir resto por si hay más pipes
        }

        // Si el tipo coincide con lo que buscamos, lo agregamos
        if (tipoFiltro.includes(tipoItem)) {
            const option = document.createElement('option');
            option.value = textoItem;
            option.textContent = textoItem;
            sel.appendChild(option);
        }
    });
  }

  // --- Cargar selects y cascadas (Resto) ---
  async function hydrateSelects(container) {
    async function loadOne(sel) {
      const key = sel.dataset.key;
      // Saltamos justificacion, esa tiene logica especial
      if (key.toUpperCase() === 'JUSTIFICACION') return;

      const config = CASCADE_MAP[key];
      const deps = {};
      if (config) { /* logica cascada */
         if (config.parent) {
             const p = container.querySelector(`select[name="${config.parent}"]`);
             deps[config.parent] = p?.value || '';
         }
         // ... parents array support ...
      }
      const opts = await fetchCatalog(key, deps);
      sel.innerHTML = `<option value="">-- Selecciona --</option>` + opts.map(o => `<option value="${o}">${o}</option>`).join('');
    }

    const selects = [...container.querySelectorAll('select[data-key]')];
    for (const sel of selects) await loadOne(sel);

    // Cascadas (Unidad -> Area)
    const uaSel = container.querySelector('select[name="UNIDAD_ADMINISTRATIVA"]');
    const areaSel = container.querySelector('select[name="AREA"]');
    if (uaSel && areaSel) {
      uaSel.addEventListener('change', async () => {
        areaSel.innerHTML = '<option value="">-- Selecciona AREA--</option>'; 
        // Aquí deberías recargar loadOne(areaSel) pasando la dependencia, 
        // simplificado para este ejemplo:
        const opts = await fetchCatalog('AREA', { UNIDAD_ADMINISTRATIVA: uaSel.value });
        areaSel.innerHTML = `<option value="">-- Selecciona --</option>` + opts.map(o => `<option value="${o}">${o}</option>`).join('');
      });
    }
  }

  // ... (Address helpers: loadDireccionesCSV, fillAuto, etc. IGUAL QUE ANTES) ...
  // [Se omite por brevedad, asume que están aquí las funciones initDirecciones, ensureHiddenAddressInputs, etc]
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

  // --- LOAD PLACEHOLDERS ---
  async function loadPlaceholders(name) {
    fieldsContainer.innerHTML = '';
    btnGenerar.disabled = true;
    if (!name) return;
    
    try {
      const data = await fetchJSON(`/templates/${encodeURIComponent(name)}/placeholders`);
      const phs = data.placeholders || [];
      
      HIDDEN_ADDRESS_PH.forEach(p => { if (!phs.includes(p)) phs.push(p); });
      if (!phs.includes(ADDRESS_MASTER_KEY)) phs.unshift(ADDRESS_MASTER_KEY);

      // Render
      fieldsContainer.innerHTML = phs.filter(p => p !== AUTO_TEMPLATE_PLACEHOLDER).map(renderField).join('');

      ensureHiddenAddressInputs(fieldsContainer);
      ensureAutoTemplateInput(fieldsContainer, name, phs);

      await hydrateSelects(fieldsContainer);
      // **NUEVO: Cargar justificaciones filtradas**
      await hydrateJustificacion(fieldsContainer, name);
      
      await initDirecciones(fieldsContainer);

      btnGenerar.disabled = false;
    } catch (e) {
      fieldsContainer.innerHTML = '<p>Error.</p>';
      showMsg('Error: ' + e.message, true);
    }
  }

  // --- FECHA ESTETICA ---
  function renderDateLabel() {
    const titleEl = document.querySelector('h1') || document.querySelector('header');
    const existing = document.getElementById('fecha-emision-display');
    if (existing) existing.remove();

    const today = new Date();
    const dateStr = today.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' });
    
    const badge = document.createElement('span');
    badge.id = 'fecha-emision-display';
    badge.innerHTML = `<strong>📅 Fecha:</strong> ${dateStr}`;
    badge.style.cssText = `font-size: 1.1rem; color: #374151; background: #f3f4f6; padding: 6px 12px; border-radius: 99px; margin-left: 15px; display: inline-flex; align-items: center; border: 1px solid #ddd;`;

    if (titleEl) {
        if (getComputedStyle(titleEl).display === 'block') {
             titleEl.style.display = 'flex'; titleEl.style.alignItems = 'center'; titleEl.style.justifyContent = 'center'; titleEl.style.flexWrap = 'wrap';
        }
        titleEl.appendChild(badge);
    }
  }

  // --- GENERAR ---
  async function generar() {
    const templateName = templateSelect.value;
    if (!templateName) return showMsg('Selecciona plantilla', true);

    // Validar solo visibles
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
      data[key] = (el.value || '').trim();
    });

    // Inyectar fecha mayusculas
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    data['FECHA_SOLICITUD'] = `${dd}/${mm}/${yyyy}`; 

    try {
      const resp = await fetch('/generate-pdf-template', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ templateName, data })
      });
      if (!resp.ok) throw new Error((await resp.json()).error || 'Error generando PDF');
      
      const blob = await resp.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = templateName.replace(/\.html$/,'') + '.pdf';
      a.click();
      showMsg('PDF generado');
      showSnackbar('PDF generado correctamente', 'success', 3500);
    } catch (e) {      
      showSnackbar(e.message, 'error', 6000);  
    }
  }

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