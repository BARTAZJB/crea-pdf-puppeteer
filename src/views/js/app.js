(() => {
  const templateSelect = document.getElementById('templateSelect');
  const fieldsContainer = document.getElementById('fieldsContainer');
  const btnGenerar = document.getElementById('btnGenerar');
  const msgEl = document.getElementById('msg');

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
  const isFecha = s => /fecha|inicio_actividades/i.test(s || '');
  const isCurp = s => /curp/i.test(s || ''); 
  const isRfc = s => /rfc/i.test(s || '');

  const prettyLabel = s => (s||'').replace(/_/g,' ').replace(/\s+/g,' ').trim()
    .replace(/\b\p{L}/gu, m => m.toLocaleUpperCase('es'));

  // KEYS que serán SELECTS
  const SELECT_KEYS = new Set([
    'TIPO_CUENTA','AREA','UNIDAD_ADMINISTRATIVA','SISTEMA',
    'PUESTO_SOLICITANTE', "PUESTO_USUARIO", "AREA", 
    "PUESTO_AUTORIZA", "PUESTO_RESPONSABLE_CONAGUA",
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
    const attrsReq = `required oninvalid="this.setCustomValidity('${msgReq}')" oninput="this.setCustomValidity('')"`;

    return `<div class="field">
      <label>${labelText}</label>
      <select name="${key}" data-key="${key}" ${attrsReq}>
        <option value="">-- Selecciona --</option>
      </select>
      ${extraHTML}
    </div>`;
  }

  function renderField(ph) {
    const labelText = prettyLabel(ph);
    
    // VALIDACIÓN COMÚN
    const msgReq = "Completa este campo";
    const attrsReq = `required oninvalid="this.setCustomValidity('${msgReq}')" oninput="this.setCustomValidity('')"`;

    // Ocultar fecha de solicitud (implicita)
    if (/fecha_solicitud/i.test(ph)) return ''; 

    if (ph === ADDRESS_MASTER_KEY) {
      return `<div class="field">
        <label>${labelText}</label>
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
        return `<div class="field"><label>${labelText}</label><input type="text" name="${ph}" placeholder="Ej: ABCD900101HDF..." maxlength="18" style="text-transform: uppercase;" pattern="${curpRegex}" title="Ingresa una CURP válida" oninput="this.value = this.value.toUpperCase(); this.setCustomValidity('')" oninvalid="this.setCustomValidity('CURP inválida o vacía. ${msgReq}')" required /></div>`;
    }
    if (isRfc(ph)) {
        const rfcRegex = "^[A-ZÑ&]{3,4}\\d{6}([A-Z0-9]{3})?$";
        return `<div class="field"><label>${labelText}</label><input type="text" name="${ph}" placeholder="Ej: ABCD900101" maxlength="13" minlength="10" style="text-transform: uppercase;" pattern="${rfcRegex}" title="Ingresa un RFC válido" oninput="this.value = this.value.toUpperCase(); this.setCustomValidity('')" oninvalid="this.setCustomValidity('RFC inválido o vacío. ${msgReq}')" required /></div>`;
    }
    if (isFecha(ph)) {
        const today = new Date().toISOString().split('T')[0];
        if (supportsDateInput) return `<div class="field"><label>${labelText}</label><input type="date" name="${ph}" min="${today}" ${attrsReq} /></div>`;
        return `<div class="field"><label>${labelText}</label><input type="text" name="${ph}" placeholder="AAAA-MM-DD" pattern="\\d{4}-\\d{2}-\\d{2}" ${attrsReq} /></div>`;
    }

    return `<div class="field"><label>${labelText}</label><input type="text" name="${ph}" placeholder="${labelText}" ${attrsReq} /></div>`;
  }

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
      HIDDEN_ADDRESS_PH.forEach(p => { if (!phs.includes(p)) phs.push(p); });
      if (!phs.includes(ADDRESS_MASTER_KEY)) phs.unshift(ADDRESS_MASTER_KEY);
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
    inputs.forEach(el => { const key = el.name; if (!key) return; data[key] = (el.value || '').trim(); });
    
    // Inyectar fecha MANUALMENTE en mayúsculas
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    data['FECHA_SOLICITUD'] = `${dd}/${mm}/${yyyy}`; 

    try {
      const resp = await fetch('/generate-pdf-template', {
        method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ templateName, data })
      });
      if (!resp.ok) throw new Error((await resp.json()).error || 'Error generando PDF');
      const blob = await resp.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = templateName.replace(/\.html$/,'') + '.pdf';
      a.click();
      showMsg('PDF generado');
      showSnackbar('PDF generado correctamente', 'success', 3500);
    } catch (e) { showSnackbar(e.message, 'error', 6000); }
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