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
    // Attach action handler if present
    if (actionText) {
      const act = el.querySelector('.snackbar__action');
      act.addEventListener('click', () => { el.classList.remove('show'); });
      act.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') el.classList.remove('show'); });
    }
    // show
    requestAnimationFrame(() => el.classList.add('show'));
    // hide after timeout
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

  // --- Fecha: soporte ---
  const supportsDateInput = (() => {
    const i = document.createElement('input'); i.type='date'; return i.type==='date';
  })();
  const isFecha = s => /fecha/i.test(s || '');

  // --- Pretty label ---
  const prettyLabel = s => (s||'').replace(/_/g,' ').replace(/\s+/g,' ').trim()
    .replace(/\b\p{L}/gu, m => m.toLocaleUpperCase('es'));

  // --- Selects desde catálogos CSV / estáticos ---
  // Quitar TIPO_SOLICITUD de SELECT_KEYS (lo llenamos automático)
  const SELECT_KEYS = new Set([
    'TIPO_CUENTA','AREA','UNIDAD_ADMINISTRATIVA','SISTEMA',
    'PUESTO_SOLICITANTE', "PUESTO_USARIO", "AREA"
  ]);

  const AUTO_TEMPLATE_PLACEHOLDER = 'TIPO_SOLICITUD';

  // Cascadas
  const CASCADE_MAP = {    
    AREA: { parents: ['UNIDAD_ADMINISTRATIVA'] },    
  };

  // Añadimos las llaves de cascada a los selects visibles
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

  // Dirección (CSV)
  const HIDDEN_ADDRESS_PH = ['DIRECCION','CIUDAD','ESTADO','CODIGO_POSTAL'];
  const ADDRESS_MASTER_KEY = 'DIRECCION_ID';
  const ADDRESS_CSV_URL = 'docs/csv/direccion.csv';

  // Render solo de campos visibles (no los de dirección autollenados)
  function renderField(ph) {
    const labelText = prettyLabel(ph);
    if (ph === ADDRESS_MASTER_KEY) {
      return `<div class="field">
        <label>${labelText}</label>
        <select name="${ph}" id="direccionSelect">
          <option value="">-- Selecciona dirección --</option>
        </select>
        <div id="direccionResumen" class="direccion-resumen" style="margin-top:6px;font-size:12px;color:#444;"></div>
        </div>`;
    }
    if (HIDDEN_ADDRESS_PH.includes(ph)) {
      return ''; // Se manejarán como inputs hidden
    }
    if (SELECT_KEYS.has(ph)) return renderSelectHTML(ph, labelText);
    if (isFecha(ph) && supportsDateInput)
      return `<div class="field"><label>${labelText}</label><input type="date" name="${ph}" /></div>`;
    if (isFecha(ph))
      return `<div class="field"><label>${labelText}</label>
        <input type="text" name="${ph}" placeholder="AAAA-MM-DD"
               pattern="\\d{4}-\\d{2}-\\d{2}" title="Formato AAAA-MM-DD"/>
      </div>`;
    return `<div class="field"><label>${labelText}</label>
      <input type="text" name="${ph}" placeholder="${labelText}" />
    </div>`;
  }

  // Leer CSV direcciones (PapaParse ya cargado en index.html)
  async function loadDireccionesCSV() {
    return new Promise((resolve, reject) => {
      Papa.parse(ADDRESS_CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: res => {
          const rows = (res.data || []).filter(r => r && r.ID);
          resolve(rows);
        },
        error: err => reject(err)
      });
    });
  }

  function sanitizeCP(v) {
    return String(v || '').replace(/[^\d]/g, '').slice(0,5);
  }

  function ensureHiddenAddressInputs(container) {
    HIDDEN_ADDRESS_PH.forEach(name => {
      if (!container.querySelector(`input[name="${name}"]`)) {
        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = name;
        hidden.setAttribute('data-auto-fill', name);
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
    const map = {
      CIUDAD: row['Ciudad'] || '',
      ESTADO: row['Estado'] || '',
      CODIGO_POSTAL: sanitizeCP(row['C.P']),
      DIRECCION: row['Dirección'] || row['Direccion'] || ''
    };
    container.querySelectorAll('[data-auto-fill]').forEach(el => {
      const k = el.getAttribute('data-auto-fill');
      if (k && map[k] !== undefined) el.value = map[k];
    });
    const resumen = container.querySelector('#direccionResumen');
    if (resumen) {
      resumen.textContent = map.DIRECCION
        ? `${map.DIRECCION} | ${map.CIUDAD}, ${map.ESTADO} C.P. ${map.CODIGO_POSTAL}`
        : '';
    }
  }

  // Inicializa select de direcciones desde CSV
  async function initDirecciones(container) {
    const sel = container.querySelector('#direccionSelect');
    if (!sel) return;
    try {
      const rows = await loadDireccionesCSV();
      sel.innerHTML = `<option value="">-- Selecciona dirección --</option>` +
        rows.map(r => `<option value="${r.ID}" data-row='${JSON.stringify(r)}'>${r.ID}</option>`).join('');
    } catch {
      sel.innerHTML = '<option value="">Error cargando CSV</option>';
    }
    sel.addEventListener('change', () => {
      resetAutoFill(container);
      const opt = sel.selectedOptions[0];
      if (!opt || !opt.dataset.row) return;
      const row = JSON.parse(opt.dataset.row);
      fillAuto(container, row);
    });
  }

  // Carga selects y maneja cascadas
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
          config.parents.forEach(p => {
            const pSel = container.querySelector(`select[name="${p}"]`);
            deps[p] = pSel?.value || '';
          });
        }
      }
      const opts = await fetchCatalog(key, deps);
      //Es el helper de el select
      sel.innerHTML = `<option value="">-- Selecciona --</option>` +
        opts.map(o => `<option value="${o}">${o}</option>`).join('');
    }

    const selects = [...container.querySelectorAll('select[data-key]')];

    // Orden de carga (padres antes que hijos)
    const order = ['PUESTO_SOLICITANTE', 'PUESTO_USUARIO','PUESTO_AUTORIZA', 'PUESTO_RESPONSABLE_CONAGUA','UNIDAD_ADMINISTRATIVA','AREA','TIPO_CUENTA','SISTEMA'];
    for (const key of order) {
      const sel = selects.find(s => s.dataset.key === key);
      if (sel) await loadOne(sel);
    }

    // Listeners de cascada
    //const dirSel = container.querySelector('select[name="DIRECCION_SUBDIRECCION"]');
    const uaSel = container.querySelector('select[name="UNIDAD_ADMINISTRATIVA"]');
    const areaSel = container.querySelector('select[name="AREA"]');
    //const uaUnidadSel = container.querySelector('select[name="UA_UNIDAD_ADMINISTRATIVA"]');
    //const gerSel = container.querySelector('select[name="GERENCIA_COORDINACION"]');
     
    if (uaSel) {
      uaSel.addEventListener('change', async () => {
        if (areaSel) { areaSel.innerHTML = '<option value="">-- Selecciona AREA--</option>'; await loadOne(areaSel); }
      });
    }
    
  }
  

  // Carga y render de placeholders
  function ensureAutoTemplateInput(container, templateName, placeholders) {
    if (!placeholders.includes(AUTO_TEMPLATE_PLACEHOLDER)) return;
    let el = container.querySelector(`input[name="${AUTO_TEMPLATE_PLACEHOLDER}"]`);
    if (!el) {
      el = document.createElement('input');
      el.type = 'hidden';
      el.name = AUTO_TEMPLATE_PLACEHOLDER;
      container.appendChild(el);
    }
    el.value = templateName.replace(/\.html$/i,'').trim();
  }

  async function loadPlaceholders(name) {
    fieldsContainer.innerHTML = '';
    btnGenerar.disabled = true;
    if (!name) return;
    try {
      const data = await fetchJSON(`/templates/${encodeURIComponent(name)}/placeholders`);
      const phs = data.placeholders || [];

      // Asegura placeholders de dirección (aunque no se muestren)
      HIDDEN_ADDRESS_PH.forEach(p => { if (!phs.includes(p)) phs.push(p); });
      if (!phs.includes(ADDRESS_MASTER_KEY)) phs.unshift(ADDRESS_MASTER_KEY);

      // No renderizamos TIPO_SOLICITUD (auto)
      const rendered = phs
        .filter(p => p !== AUTO_TEMPLATE_PLACEHOLDER) // oculto
        .map(renderField)
        .join('');
      fieldsContainer.innerHTML = rendered;

      ensureHiddenAddressInputs(fieldsContainer);
      ensureAutoTemplateInput(fieldsContainer, name, phs);

      // Catálogos y dirección
      await hydrateSelects(fieldsContainer);
      await initDirecciones(fieldsContainer);

      btnGenerar.disabled = false;
    } catch (e) {
      fieldsContainer.innerHTML = '<p>Error.</p>';
      showMsg('Error placeholders: ' + e.message, true);
    }
  }

  // Generar PDF
  async function generar() {
    const templateName = templateSelect.value;
    if (!templateName) return showMsg('Selecciona plantilla', true);

    const controls = [...fieldsContainer.querySelectorAll('input, select, textarea')];
    const data = {};
    controls.forEach(el => {
      const key = el.name;
      if (!key) return;
      data[key] = (el.value || '').trim();
    });

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
      //e.message da todas las variables
      //showMsg(e.message, true);    
      showSnackbar("Datos faltantes, verifica", 'error', 6000);  
    }
    // expect     
    //   showSnackbar("Datos faltantes, verifica", 'error', 6000);
  }

  // Init
  function init() {
    if (!templateSelect || !fieldsContainer || !btnGenerar) {
      console.error('Faltan elementos: templateSelect / fieldsContainer / btnGenerar');
      return;
    }
    loadTemplates();
    templateSelect.addEventListener('change', e => loadPlaceholders(e.target.value));
    btnGenerar.addEventListener('click', generar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();