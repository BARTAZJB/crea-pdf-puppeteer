(() => {
  // --- Referencias DOM básicas ---
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
  
  // --- Snackbar superpuesto tipo MUI ---
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

  // --- Fetch JSON genérico ---
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
      templateSelect.innerHTML =
        '<option value="">-- Selecciona una plantilla --</option>' +
        list.map(f => `<option value="${f}">${f.replace(/_/g,' ').replace(/\.html$/,'')}</option>`).join('');
    } catch (e) {
      templateSelect.innerHTML = '<option value="">Error</option>';
      showMsg('Error cargando plantillas: ' + e.message, true);
    }
  }

  // --- Detectores de tipo ---
  const supportsDateInput = (() => {
    const i = document.createElement('input'); i.type='date'; return i.type==='date';
  })();
  const isFecha = s => /fecha/i.test(s || '');
  const isCurp = s => /curp/i.test(s || ''); 
  const isRfc = s => /rfc/i.test(s || '');

  // --- Pretty label ---
  const prettyLabel = s => (s||'').replace(/_/g,' ').replace(/\s+/g,' ').trim()
    .replace(/\b\p{L}/gu, m => m.toLocaleUpperCase('es'));

  // --- Selects ---
  const SELECT_KEYS = new Set([
    'TIPO_CUENTA','AREA','UNIDAD_ADMINISTRATIVA','SISTEMA',
    'PUESTO_SOLICITANTE', "PUESTO_USUARIO", "AREA"
  ]);

  const AUTO_TEMPLATE_PLACEHOLDER = 'TIPO_SOLICITUD';

  const CASCADE_MAP = {    
    AREA: { parents: ['UNIDAD_ADMINISTRATIVA'] },    
  };

  SELECT_KEYS.add('UNIDAD_ADMINISTRATIVA');
  SELECT_KEYS.add('AREA');
  SELECT_KEYS.add('PUESTO_SOLICITANTE');
  SELECT_KEYS.add('PUESTO_USUARIO');
  SELECT_KEYS.add('PUESTO_AUTORIZA');
  SELECT_KEYS.add('PUESTO_RESPONSABLE_CONAGUA');
  SELECT_KEYS.add('SISTEMA');
  SELECT_KEYS.add('TIPO_CUENTA');

  async function fetchCatalog(key, deps = {}) {
    const qs = new URLSearchParams(deps).toString();
    const r = await fetch(`/api/catalogs/${encodeURIComponent(key)}${qs ? `?${qs}` : ''}`);
    if (!r.ok) return [];
    const j = await r.json().catch(()=>({}));
    return j.options || [];
  }

  function renderSelectHTML(key, labelText) {
    return `<div class="field">
      <label>${labelText}</label>
      <select name="${key}" data-key="${key}">
        <option value="">-- Selecciona --</option>
      </select>
    </div>`;
  }

  const HIDDEN_ADDRESS_PH = ['DIRECCION','CIUDAD','ESTADO','CODIGO_POSTAL'];
  const ADDRESS_MASTER_KEY = 'DIRECCION_ID';
  const ADDRESS_CSV_URL = 'docs/csv/direccion.csv';

  // --- RENDERIZADO DE CAMPOS ---
  function renderField(ph) {
    const labelText = prettyLabel(ph);
    
    // 1. FECHA DE SOLICITUD: Ocultar totalmente del formulario
    if (/fecha_solicitud/i.test(ph)) {
        return ''; 
    }

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
    
    // 3. Campos Ocultos de Dirección
    if (HIDDEN_ADDRESS_PH.includes(ph)) return '';
    
    // 4. Selects normales
    if (SELECT_KEYS.has(ph)) return renderSelectHTML(ph, labelText);
    
    // 5. VALIDACIÓN ESTRICTA DE CURP
    if (isCurp(ph)) {
        const curpRegex = "^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])[HM]{1}(AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]{1}[0-9]{1}$";
        return `<div class="field">
            <label>${labelText}</label>
            <input type="text" name="${ph}" 
                   placeholder="Ej: ABCD900101HDF..." 
                   maxlength="18" 
                   style="text-transform: uppercase;"
                   pattern="${curpRegex}"
                   title="Ingresa una CURP válida de 18 caracteres (Formato oficial)"
                   oninput="this.value = this.value.toUpperCase()"
                   required />
        </div>`;
    }

    // 6. VALIDACIÓN FLEXIBLE DE RFC
    if (isRfc(ph)) {
        const rfcRegex = "^[A-ZÑ&]{3,4}\\d{6}([A-Z0-9]{3})?$";
        return `<div class="field">
            <label>${labelText}</label>
            <input type="text" name="${ph}" 
                   placeholder="Ej: ABCD900101 o ABCD900101XXX" 
                   maxlength="13" 
                   minlength="10"
                   style="text-transform: uppercase;"
                   pattern="${rfcRegex}"
                   title="Ingresa un RFC válido (10 a 13 caracteres)"
                   oninput="this.value = this.value.toUpperCase()"
                   required />
        </div>`;
    }

    // 7. OTRAS FECHAS (Inicio, Fin, Baja)
    if (isFecha(ph)) {
        if (supportsDateInput)
            return `<div class="field"><label>${labelText}</label><input type="date" name="${ph}" /></div>`;
        return `<div class="field"><label>${labelText}</label>
            <input type="text" name="${ph}" placeholder="AAAA-MM-DD"
                    pattern="\\d{4}-\\d{2}-\\d{2}" title="Formato AAAA-MM-DD"/>
            </div>`;
    }

    // Input normal texto
    return `<div class="field"><label>${labelText}</label>
      <input type="text" name="${ph}" placeholder="${labelText}" />
    </div>`;
  }

  // ... (Helpers de CSV y selects - sin cambios) ...
  async function loadDireccionesCSV() {
    return new Promise((resolve, reject) => {
      Papa.parse(ADDRESS_CSV_URL, {
        download: true, header: true, skipEmptyLines: true,
        complete: res => resolve((res.data || []).filter(r => r && r.ID)),
        error: err => reject(err)
      });
    });
  }
  function sanitizeCP(v) { return String(v || '').replace(/[^\d]/g, '').slice(0,5); }
  function ensureHiddenAddressInputs(container) {
    HIDDEN_ADDRESS_PH.forEach(name => {
      if (!container.querySelector(`input[name="${name}"]`)) {
        const hidden = document.createElement('input');
        hidden.type = 'hidden'; hidden.name = name; hidden.setAttribute('data-auto-fill', name);
        container.appendChild(hidden);
      }
    });
  }
  function resetAutoFill(container) {
    container.querySelectorAll('[data-auto-fill]').forEach(el => { el.value = ''; });
    const resumen = container.querySelector('#direccionResumen');
    if (resumen) resumen.textContent = '';
  }
  function fillAuto(container, row) {
    const map = { CIUDAD: row['Ciudad']||'', ESTADO: row['Estado']||'', CODIGO_POSTAL: sanitizeCP(row['C.P']), DIRECCION: row['Dirección']||row['Direccion']||'' };
    container.querySelectorAll('[data-auto-fill]').forEach(el => {
      const k = el.getAttribute('data-auto-fill');
      if (k && map[k] !== undefined) el.value = map[k];
    });
    const resumen = container.querySelector('#direccionResumen');
    if (resumen) resumen.textContent = map.DIRECCION ? `${map.DIRECCION} | ${map.CIUDAD}, ${map.ESTADO} C.P. ${map.CODIGO_POSTAL}` : '';
  }
  async function initDirecciones(container) {
    const sel = container.querySelector('#direccionSelect');
    if (!sel) return;
    try {
      const rows = await loadDireccionesCSV();
      sel.innerHTML = `<option value="">-- Selecciona dirección --</option>` + rows.map(r => `<option value="${r.ID}" data-row='${JSON.stringify(r)}'>${r.ID}</option>`).join('');
    } catch { sel.innerHTML = '<option value="">Error cargando CSV</option>'; }
    sel.addEventListener('change', () => {
      resetAutoFill(container);
      const opt = sel.selectedOptions[0];
      if (!opt || !opt.dataset.row) return;
      fillAuto(container, JSON.parse(opt.dataset.row));
    });
  }

  async function hydrateSelects(container) {
    async function loadOne(sel) {
      const key = sel.dataset.key;
      const config = CASCADE_MAP[key];
      const deps = {};
      if (config) {
        if (config.parent) {
          const pSel = container.querySelector(`select[name="${config.parent}"]`);
          deps[config.parent] = pSel?.value || '';
        } else if (config.parents) {
          config.parents.forEach(p => { const pSel = container.querySelector(`select[name="${p}"]`); deps[p] = pSel?.value || ''; });
        }
      }
      const opts = await fetchCatalog(key, deps);
      sel.innerHTML = `<option value="">-- Selecciona --</option>` + opts.map(o => `<option value="${o}">${o}</option>`).join('');
    }
    const selects = [...container.querySelectorAll('select[data-key]')];
    const order = ['PUESTO_SOLICITANTE', 'PUESTO_USUARIO','PUESTO_AUTORIZA', 'PUESTO_RESPONSABLE_CONAGUA','UNIDAD_ADMINISTRATIVA','AREA','TIPO_CUENTA','SISTEMA'];
    for (const key of order) {
      const sel = selects.find(s => s.dataset.key === key);
      if (sel) await loadOne(sel);
    }
    const uaSel = container.querySelector('select[name="UNIDAD_ADMINISTRATIVA"]');
    const areaSel = container.querySelector('select[name="AREA"]');
    if (uaSel) {
      uaSel.addEventListener('change', async () => {
        if (areaSel) { areaSel.innerHTML = '<option value="">-- Selecciona AREA--</option>'; await loadOne(areaSel); }
      });
    }
  }

  function ensureAutoTemplateInput(container, templateName, placeholders) {
    if (!placeholders.includes(AUTO_TEMPLATE_PLACEHOLDER)) return;
    let el = container.querySelector(`input[name="${AUTO_TEMPLATE_PLACEHOLDER}"]`);
    if (!el) { el = document.createElement('input'); el.type = 'hidden'; el.name = AUTO_TEMPLATE_PLACEHOLDER; container.appendChild(el); }
    el.value = templateName.replace(/\.html$/i,'').trim();
  }

  async function loadPlaceholders(name) {
    fieldsContainer.innerHTML = '';
    btnGenerar.disabled = true;
    if (!name) return;
    try {
      const data = await fetchJSON(`/templates/${encodeURIComponent(name)}/placeholders`);
      const phs = data.placeholders || [];
      HIDDEN_ADDRESS_PH.forEach(p => { if (!phs.includes(p)) phs.push(p); });
      if (!phs.includes(ADDRESS_MASTER_KEY)) phs.unshift(ADDRESS_MASTER_KEY);
      const rendered = phs.filter(p => p !== AUTO_TEMPLATE_PLACEHOLDER).map(renderField).join('');
      fieldsContainer.innerHTML = rendered;
      ensureHiddenAddressInputs(fieldsContainer);
      ensureAutoTemplateInput(fieldsContainer, name, phs);
      await hydrateSelects(fieldsContainer);
      await initDirecciones(fieldsContainer);
      btnGenerar.disabled = false;
    } catch (e) {
      fieldsContainer.innerHTML = '<p>Error.</p>';
      showMsg('Error placeholders: ' + e.message, true);
    }
  }

  // --- DISPLAY DE FECHA (ESTÉTICO) ---
  function renderDateLabel() {
    const titleEl = document.querySelector('h1') || document.querySelector('header');
    const existingDate = document.getElementById('fecha-emision-display');
    if (existingDate) existingDate.remove();

    const today = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' };
    const dateStr = today.toLocaleDateString('es-MX', options);
    
    const badge = document.createElement('span');
    badge.id = 'fecha-emision-display';
    badge.innerHTML = `<strong>📅 Fecha de emisión:</strong> ${dateStr}`;
    badge.style.cssText = `
        font-size: 1.2rem; 
        color: #374151; 
        background: #f3f4f6; 
        padding: 8px 16px; 
        border-radius: 9999px; 
        border: 1px solid #e5e7eb; 
        margin-left: 20px;
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    `;

    if (titleEl) {
        if (getComputedStyle(titleEl).display === 'block') {
             titleEl.style.display = 'flex';
             titleEl.style.alignItems = 'center';
             titleEl.style.justifyContent = 'center'; 
             titleEl.style.flexWrap = 'wrap';
        }
        titleEl.appendChild(badge);
    } else if (fieldsContainer) {
        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'right';
        wrapper.style.marginBottom = '15px';
        wrapper.appendChild(badge);
        fieldsContainer.parentNode.insertBefore(wrapper, fieldsContainer);
    }
  }

  async function generar() {
    const templateName = templateSelect.value;
    if (!templateName) return showMsg('Selecciona plantilla', true);

    const inputs = fieldsContainer.querySelectorAll('input, select, textarea');
    let valid = true;
    for (const el of inputs) {
        if (el.type !== 'hidden' && !el.checkValidity()) {
            el.reportValidity(); 
            valid = false;
            break; 
        }
    }
    if (!valid) return; 

    const data = {};
    inputs.forEach(el => {
      const key = el.name;
      if (!key) return;
      data[key] = (el.value || '').trim();
    });

    // --- INYECCIÓN AUTOMÁTICA DE FECHA (CORREGIDA: MAYÚSCULAS) ---
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    
    // ¡AQUÍ ESTÁ LA MAGIA! Enviamos la clave en mayúsculas para que coincida con {{FECHA_SOLICITUD}}
    data['FECHA_SOLICITUD'] = `${dd}/${mm}/${yyyy}`; 

    try {
      const resp = await fetch('/generate-pdf-template', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ templateName, data })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(()=>({}));
        throw new Error(err.error || 'Error generando PDF');
      }
      const blob = await resp.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = templateName.replace(/\.html$/,'') + '.pdf';
      a.click();
      showMsg('PDF generado correctamente');
      showSnackbar('PDF generado correctamente', 'success', 3500);
    } catch (e) {      
      showSnackbar(e.message, 'error', 6000);  
    }
  }

  function init() {
    if (!templateSelect || !fieldsContainer || !btnGenerar) return;
    
    loadTemplates();
    renderDateLabel(); 

    templateSelect.addEventListener('change', e => loadPlaceholders(e.target.value));
    btnGenerar.addEventListener('click', generar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();