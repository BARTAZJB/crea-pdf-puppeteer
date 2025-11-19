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
  const SELECT_KEYS = new Set([
    'TIPO_SOLICITUD','TIPO_CUENTA','AREA','UNIDAD_ADMINISTRATIVA','SISTEMA',
    'PUESTO_USUARIO','PUESTO_SOLICITANTE','PUESTO_AUTORIZA'
  ]);

  async function fetchCatalog(key) {
    const r = await fetch(`/api/catalogs/${encodeURIComponent(key)}`);
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
  const REQUIRED_ADDRESS_PH = ['DIRECCION','CIUDAD','ESTADO','CODIGO_POSTAL'];
  const ADDRESS_MASTER_KEY = 'DIRECCION_ID';
  const ADDRESS_CSV_URL = 'docs/csv/direccion.csv';

  function renderField(ph) {
    const labelText = prettyLabel(ph);
    if (ph === ADDRESS_MASTER_KEY) {
      return `<div class="field">
        <label>${labelText}</label>
        <select name="${ph}" id="direccionSelect">
          <option value="">-- Selecciona dirección --</option>
        </select>
      </div>`;
    }
    if (REQUIRED_ADDRESS_PH.includes(ph)) {
      return `<div class="field">
        <label>${labelText}</label>
        <input type="text" name="${ph}" data-auto-fill="${ph}" readonly />
      </div>`;
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

  function resetAutoFill(container) {
    container.querySelectorAll('[data-auto-fill]').forEach(el => el.value = '');
  }

  function sanitizeCP(v) {
    return String(v || '').replace(/[^\d]/g, '').slice(0,5);
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
  }

  async function hydrateSelects(container) {
    const selects = [...container.querySelectorAll('select[data-key]')];
    for (const sel of selects) {
      const key = sel.dataset.key;
      const opts = await fetchCatalog(key);
      sel.innerHTML = `<option value="">-- Selecciona --</option>` +
        opts.map(o => `<option value="${o}">${o}</option>`).join('');
    }
  }

  // --- Placeholders de plantilla ---
  async function loadPlaceholders(name) {
    fieldsContainer.innerHTML = '';
    btnGenerar.disabled = true;
    if (!name) return;
    try {
      const data = await fetchJSON(`/templates/${encodeURIComponent(name)}/placeholders`);
      const phs = data.placeholders || [];

      // Garantizar que siempre estén los de dirección
      REQUIRED_ADDRESS_PH.forEach(p => { if (!phs.includes(p)) phs.push(p); });
      if (!phs.includes(ADDRESS_MASTER_KEY)) phs.unshift(ADDRESS_MASTER_KEY);

      if (!phs.length) {
        fieldsContainer.innerHTML = '<p>No hay placeholders.</p>';
        btnGenerar.disabled = false;
        return;
      }

      fieldsContainer.innerHTML = phs.map(renderField).join('');
      await hydrateSelects(fieldsContainer);
      await initDirecciones(fieldsContainer);

      btnGenerar.disabled = false;
    } catch (e) {
      fieldsContainer.innerHTML = '<p>Error.</p>';
      showMsg('Error placeholders: ' + e.message, true);
    }
  }

  // --- Generar PDF ---
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
    } catch (e) {
      showMsg(e.message, true);
    }
  }

  // Carga y parsea el CSV usando PapaParse
  async function loadAddressesFromCSV() {
    return new Promise((resolve, reject) => {
      Papa.parse(ADDRESS_CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Filtra filas válidas con ID
          const rows = (results.data || []).filter(r => r && r.ID);
          resolve(rows);
        },
        error: (err) => reject(err)
      });
    });
  }

  // Normaliza CP a 5 dígitos
  function sanitizeCP(value) {
    if (!value) return '';
    return String(value).replace(/[^\d]/g, '').slice(0, 5);
  }

  // Setea un campo del formulario dinámico si existe
  function setDynamicFieldValue(name, value) {
    const el = document.querySelector(`#dynamicFormFields [name="${name}"]`);
    if (!el) return;
    el.value = value ?? '';
    // Dispara eventos por si hay validaciones/enlaces
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Autocompleta los campos de dirección según la fila seleccionada del CSV
  function fillAddressFieldsFromRow(row) {
    setDynamicFieldValue('ciudad', row['Ciudad'] || '');
    setDynamicFieldValue('estado', row['Estado'] || '');
    setDynamicFieldValue('codigo_postal', sanitizeCP(row['C.P']));
    setDynamicFieldValue('direccion', row['Dirección'] || row['Direccion'] || '');
  }

  // Inicializa el selector y maneja cambios
  async function initAddressCsvSelector() {
    const select = document.getElementById('addressSelect');
    if (!select) return;

    try {
      const rows = await loadAddressesFromCSV();

      // Llena el select
      for (const row of rows) {
        const opt = document.createElement('option');
        opt.value = row['ID'];
        // Etiqueta amigable
        opt.textContent = row['ID'];
        // Guarda todo el objeto en dataset (como JSON)
        opt.dataset.row = JSON.stringify(row);
        select.appendChild(opt);
      }

      // Limpia selección cuando cambia de plantilla
      const templateSelect = document.getElementById('templateSelect');
      if (templateSelect) {
        templateSelect.addEventListener('change', () => {
          select.value = '';
        });
      }

      // Autocompletar al seleccionar una ubicación
      select.addEventListener('change', (e) => {
        const option = select.selectedOptions[0];
        if (!option || !option.dataset.row) return;
        const row = JSON.parse(option.dataset.row);
        fillAddressFieldsFromRow(row);
      });
    } catch (e) {
      console.error('Error cargando direcciones CSV:', e);
      const hint = document.getElementById('addressHint');
      if (hint) hint.textContent = 'No se pudo cargar el catálogo CSV.';
    }
  }

  // --- Init ---
  function init() {
    if (!templateSelect || !fieldsContainer || !btnGenerar) return;
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