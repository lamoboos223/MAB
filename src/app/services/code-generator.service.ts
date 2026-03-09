import { Injectable } from '@angular/core';
import { Page } from '../models/page.model';
import { BuilderElement, ElementStyle } from '../models/element.model';

@Injectable({ providedIn: 'root' })
export class CodeGeneratorService {

  private hasI18nElements(pages: Page[]): boolean {
    return pages.some(p => p.elements.some(e => e.i18nEnabled));
  }

  generatePages(pages: Page[]): { fileName: string; html: string }[] {
    return pages.map((page, index) => ({
      fileName: index === 0 ? 'index.html' : `page${index + 1}.html`,
      html: this.generateHtml(page, pages)
    }));
  }

  generateCss(pages: Page[], themeMode: 'light' | 'dark' | 'auto' = 'auto'): string {
    const hasI18n = this.hasI18nElements(pages);

    const dark = {
      bg: '#0f0f11', text: '#fafafa', textSecondary: '#d4d4d8', textMuted: '#a1a1aa',
      inputBg: '#18181b', inputBorder: '#3f3f46', border: '#27272a',
      accent: '#8b5cf6', accentHover: '#7c3aed',
      dropdownTriggerBg: 'rgba(255,255,255,0.06)', dropdownPanelBg: '#1e1e22',
      dropdownHoverBg: 'rgba(255,255,255,0.08)', dropdownActiveBg: 'rgba(255,255,255,0.12)',
    };
    const light = {
      bg: '#ffffff', text: '#18181b', textSecondary: '#52525b', textMuted: '#a1a1aa',
      inputBg: '#ffffff', inputBorder: '#d4d4d8', border: '#e4e4e7',
      accent: '#7c3aed', accentHover: '#6d28d9',
      dropdownTriggerBg: 'rgba(0,0,0,0.02)', dropdownPanelBg: '#ffffff',
      dropdownHoverBg: 'rgba(0,0,0,0.04)', dropdownActiveBg: 'rgba(0,0,0,0.06)',
    };

    const themeCssVars = (t: typeof dark) => `
  --bg: ${t.bg}; --text: ${t.text}; --text-secondary: ${t.textSecondary}; --text-muted: ${t.textMuted};
  --input-bg: ${t.inputBg}; --input-border: ${t.inputBorder}; --border: ${t.border};
  --accent: ${t.accent}; --accent-hover: ${t.accentHover};
  --dropdown-trigger-bg: ${t.dropdownTriggerBg}; --dropdown-panel-bg: ${t.dropdownPanelBg};
  --dropdown-hover-bg: ${t.dropdownHoverBg}; --dropdown-active-bg: ${t.dropdownActiveBg};`;

    let themeBlock: string;
    if (themeMode === 'light') {
      themeBlock = `:root {${themeCssVars(light)}\n}`;
    } else if (themeMode === 'dark') {
      themeBlock = `:root {${themeCssVars(dark)}\n}`;
    } else {
      // auto: default to dark, runtime JS will switch via data-theme
      themeBlock = `:root {${themeCssVars(dark)}\n}\n[data-theme="dark"] {${themeCssVars(dark)}\n}\n[data-theme="light"] {${themeCssVars(light)}\n}`;
    }

    let css = `* { margin: 0; padding: 0; box-sizing: border-box; }
${themeBlock}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  background: var(--bg); color: var(--text); padding: 16px;
  line-height: 1.5;
}
.el-label {
  font-size: 12px; color: var(--text-muted); margin-bottom: 6px; display: block;
  font-weight: 500; letter-spacing: 0.3px;
}
select, input[type="text"], input[type="number"], input[type="email"], input[type="tel"], textarea {
  width: 100%; padding: 11px 14px; background: var(--input-bg); border: 1px solid var(--input-border);
  color: var(--text); border-radius: 8px; font-size: 14px;
  transition: border-color 0.15s; outline: none; font-family: inherit; box-sizing: border-box;
}
textarea { resize: vertical; }
select:focus, input:focus, textarea:focus { border-color: var(--accent); }
button {
  padding: 11px 22px; background: var(--accent); color: white; border: none;
  border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;
  transition: background 0.15s;
}
button:active { background: var(--accent-hover); }
img { max-width: 100%; border-radius: 10px; }
hr { border: none; border-top: 1px solid var(--border); margin: 14px 0; }
.radio-group label, .checkbox-group label {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0; color: var(--text-secondary); font-size: 14px;
}
input[type="radio"], input[type="checkbox"] { accent-color: var(--accent); }
.required-star { color: #ef4444; font-weight: 600; }
.field-error { font-size: 12px; color: #ef4444; margin-top: 4px; display: none; }
.field-error--visible { display: block; }
input.input-error, textarea.input-error { border-color: #ef4444; }
/* Date picker trigger */
.date-picker-trigger { display: flex; align-items: center; width: 100%; padding: 12px 14px; background: var(--dropdown-trigger-bg); border: 1px solid transparent; border-radius: 8px; font-size: 16px; color: var(--text); cursor: pointer; gap: 10px; transition: border-color 0.2s; font-family: inherit; }
.date-picker-trigger:focus { border-color: var(--accent); outline: none; }
.date-picker-trigger__icon { flex-shrink: 0; opacity: 0.5; }
.date-picker-trigger__text { flex: 1; text-align: left; }
.date-picker-trigger__text--placeholder { color: var(--text-muted); }
/* Calendar bottom sheet */
.cal-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px 8px; }
.cal-header__title { font-size: 16px; font-weight: 600; color: var(--text); }
.cal-header__btn { background: none; border: none; color: var(--text); font-size: 20px; cursor: pointer; padding: 4px 10px; border-radius: 8px; transition: background 0.15s; font-family: inherit; line-height: 1; }
.cal-header__btn:hover { background: var(--dropdown-hover-bg); }
.cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); padding: 4px 16px; width: 100%; box-sizing: border-box; }
.cal-weekdays span { display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: var(--text-muted); padding: 6px 0; }
.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); padding: 4px 16px 16px; gap: 2px; width: 100%; box-sizing: border-box; }
.cal-day { display: flex; align-items: center; justify-content: center; height: 40px; border: none; background: none; border-radius: 50%; font-size: 14px; color: var(--text); cursor: pointer; transition: background 0.15s; font-family: inherit; padding: 0; margin: 0 auto; width: 40px; max-width: 100%; box-sizing: border-box; }
.cal-day:hover { background: var(--dropdown-hover-bg); }
.cal-day--today { font-weight: 700; color: var(--accent); }
.cal-day--selected { background: var(--accent); color: white; font-weight: 600; }
.cal-day--selected:hover { background: var(--accent-hover); }
.cal-day--disabled { opacity: 0.25; pointer-events: none; }
.cal-day--empty { pointer-events: none; }
.map-container { width: 100%; border-radius: 10px; overflow: hidden; }
.map-container iframe { width: 100%; height: 250px; border: 0; }
/* Bottom sheet overlay */
.bottom-sheet-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 999; opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
.bottom-sheet-overlay--open { opacity: 1; pointer-events: auto; }
/* Bottom sheet panel */
.bottom-sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 1000; background: var(--dropdown-panel-bg); border-radius: 16px 16px 0 0; box-shadow: 0 -4px 30px rgba(0,0,0,0.15); transform: translateY(100%); transition: transform 0.3s ease; max-height: 60vh; display: flex; flex-direction: column; }
.bottom-sheet--open { transform: translateY(0); }
.bottom-sheet__handle { display: flex; justify-content: center; padding: 10px 0 6px; }
.bottom-sheet__handle::after { content: ''; width: 36px; height: 4px; border-radius: 2px; background: var(--text-muted); opacity: 0.4; }
.bottom-sheet__title { padding: 0 16px 10px; font-size: 15px; font-weight: 600; color: var(--text); border-bottom: 1px solid var(--border); }
.bottom-sheet__list { display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; padding: 6px; flex: 1; }
.bottom-sheet__item { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: none; background: none; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 400; color: var(--text); transition: background-color 0.15s; font-family: inherit; }
.bottom-sheet__item:hover, .bottom-sheet__item:focus { background-color: var(--dropdown-hover-bg); outline: none; }
.bottom-sheet__item--active { background-color: var(--dropdown-active-bg); }
.bottom-sheet__item img { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; flex-shrink: 0; margin-right: 12px; }
/* Dropdown triggers */
.custom-dropdown { position: relative; width: 100%; }
.custom-dropdown__trigger { display: flex; align-items: center; width: 100%; padding: 12px 14px; background: var(--dropdown-trigger-bg); border: 1px solid transparent; border-radius: 8px; font-size: 16px; font-weight: 400; color: var(--text); cursor: pointer; gap: 10px; transition: border-color 0.2s; font-family: inherit; }
.custom-dropdown__trigger:focus { border-color: var(--accent); outline: none; }
.custom-dropdown__text { flex: 1; text-align: left; }
.custom-dropdown__arrow { margin-left: auto; flex-shrink: 0; transition: transform 0.3s ease; }
.custom-dropdown__panel { display: none; }
/* Media picker */
.img-picker { display: flex; flex-direction: column; gap: 12px; }
.img-picker__trigger { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 24px; border-radius: 8px; cursor: pointer; background-color: var(--input-bg); background-image: url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='8' ry='8' stroke='%23888' stroke-width='2' stroke-dasharray='8%2c 12' stroke-dashoffset='0' stroke-linecap='round'/%3e%3c/svg%3e"); transition: background-color 0.2s; }
.img-picker__trigger:hover, .img-picker__trigger:active { background-color: var(--dropdown-hover-bg); }
.img-picker__text { color: var(--text-muted); font-size: 13px; }
.img-picker__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.img-picker__item { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; opacity: 0; transform: translateY(40px); animation: imgSlideUp 0.4s ease forwards; }
.img-picker__item:nth-child(1) { animation-delay: 0s; }
.img-picker__item:nth-child(2) { animation-delay: 0.06s; }
.img-picker__item:nth-child(3) { animation-delay: 0.12s; }
.img-picker__item:nth-child(4) { animation-delay: 0.18s; }
.img-picker__item:nth-child(5) { animation-delay: 0.24s; }
.img-picker__item:nth-child(6) { animation-delay: 0.3s; }
.img-picker__item:nth-child(7) { animation-delay: 0.36s; }
.img-picker__item:nth-child(8) { animation-delay: 0.42s; }
.img-picker__item:nth-child(9) { animation-delay: 0.48s; }
@keyframes imgSlideUp { to { opacity: 1; transform: translateY(0); } }
.img-picker__item img, .img-picker__item video { width: 100%; height: 100%; object-fit: cover; display: block; }
.img-picker__remove { position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; border-radius: 50%; background: rgba(0,0,0,0.55); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; padding: 0; }
.img-picker__item:hover .img-picker__remove, .img-picker__item:active .img-picker__remove { opacity: 1; }
@media (hover: none) { .img-picker__remove { opacity: 1; } }
.img-picker__item--removing { animation: imgSlideDown 0.3s ease forwards; }
@keyframes imgSlideDown { to { opacity: 0; transform: translateY(30px) scale(0.9); } }
.img-picker__options { display: none; }
/* Toast */
.toast { position: fixed; bottom: -60px; left: 50%; transform: translateX(-50%); background: #ef4444; color: white; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 500; z-index: 2000; transition: bottom 0.3s ease; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
.toast--visible { bottom: 40px; }
`;

    if (hasI18n) {
      css += `[dir="rtl"] { font-family: 'Arial', -apple-system, sans-serif; }\n`;
      css += `[dir="rtl"] select, [dir="rtl"] input { text-align: right; }\n`;
    }

    for (const page of pages) {
      for (const el of page.elements) {
        if (themeMode === 'auto') {
          const lightStyles = this.styleObjectToCss(el.styles);
          const darkStyles = this.styleObjectToCss(el.darkStyles ?? {});
          if (lightStyles) {
            css += `[data-theme="light"] #${el.id} { ${lightStyles} }\n`;
          }
          if (darkStyles) {
            css += `[data-theme="dark"] #${el.id} { ${darkStyles} }\n`;
          }
          if (lightStyles) {
            css += `#${el.id} { ${lightStyles} }\n`;
          }
        } else {
          const styles = this.styleObjectToCss(el.styles);
          if (styles) {
            css += `#${el.id} { ${styles} }\n`;
          }
        }
      }
    }
    return css;
  }

  generateJs(pages: Page[], themeMode: 'light' | 'dark' | 'auto' = 'auto', secretKey: string = '', debugMode: boolean = false): string {
    const hasI18n = this.hasI18nElements(pages);
    const needsDeviceInfo = themeMode === 'auto' || hasI18n;
    const hasRequiredFields = pages.some(p => p.elements.some(e => e.type === 'input' && e.settings['required'] === 'true'));
    const hasSubmit = pages.some(p => p.elements.some(e => e.type === 'button' && e.submitConfig));
    let js = '';

    if (debugMode) {
      js += `// Debug mode\n`;
      js += `var __debugPanel = null;\n`;
      js += `var __origConsoleError = console.error.bind(console);\n`;
      js += `function debugLog(msg, err) {\n`;
      js += `  __origConsoleError(msg, err || '');\n`;
      js += `  if (!__debugPanel) {\n`;
      js += `    __debugPanel = document.createElement('div');\n`;
      js += `    __debugPanel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;max-height:40vh;overflow-y:auto;background:#1a0000;border-top:2px solid #ef4444;z-index:9999;padding:8px 12px;font-family:monospace;font-size:12px;';\n`;
      js += `    document.body.appendChild(__debugPanel);\n`;
      js += `  }\n`;
      js += `  var entry = document.createElement('div');\n`;
      js += `  entry.style.cssText = 'color:#fca5a5;padding:4px 0;border-bottom:1px solid #350000;word-break:break-all;';\n`;
      js += `  var time = new Date().toLocaleTimeString();\n`;
      js += `  entry.textContent = '[' + time + '] ' + msg + (err ? ' — ' + (err.message || err) : '');\n`;
      js += `  __debugPanel.insertBefore(entry, __debugPanel.firstChild);\n`;
      js += `}\n`;
      js += `window.onerror = function(msg, src, line, col, err) { debugLog('Uncaught: ' + msg, err); };\n`;
      js += `window.addEventListener('unhandledrejection', function(e) { debugLog('Unhandled Promise', e.reason); });\n\n`;
    }

    if (hasSubmit) {
      js += `// Timeout helper\n`;
      js += `function withTimeout(promise, ms, label) {\n`;
      js += `  return Promise.race([\n`;
      js += `    promise,\n`;
      js += `    new Promise(function(_, reject) { setTimeout(function() { reject(new Error(label + ' timed out after ' + ms + 'ms')); }, ms); })\n`;
      js += `  ]);\n`;
      js += `}\n\n`;
      js += `// HMAC-SHA256 request signing\n`;
      js += `var SECRET_KEY = '${secretKey}';\n`;
      js += `async function hashRequest(body) {\n`;
      js += `  var cryptoSubtle = (typeof window !== 'undefined' && window.crypto) ? window.crypto.subtle : crypto.subtle;\n`;
      js += `  var timestamp = new Date().toISOString();\n`;
      js += `  var nonce = Math.random().toString(36).substring(2);\n`;
      js += `  var encoder = new TextEncoder();\n`;
      js += `  var keyData = encoder.encode(SECRET_KEY);\n`;
      js += `  var payload = body + '|' + timestamp + '|' + nonce;\n`;
      js += `  var data = encoder.encode(payload);\n`;
      js += `  var cryptoKey = await cryptoSubtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);\n`;
      js += `  var signature = await cryptoSubtle.sign('HMAC', cryptoKey, data);\n`;
      js += `  var hex = Array.from(new Uint8Array(signature)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');\n`;
      js += `  return { signature: hex, timestamp: timestamp, nonce: nonce };\n`;
      js += `}\n\n`;
      js += `function showToast(msg) {\n`;
      js += `  var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;\n`;
      js += `  document.body.appendChild(t);\n`;
      js += `  setTimeout(function() { t.classList.add('toast--visible'); }, 10);\n`;
      js += `  setTimeout(function() { t.classList.remove('toast--visible'); setTimeout(function() { t.remove(); }, 300); }, 3000);\n`;
      js += `}\n\n`;
    }

    js += `document.addEventListener('DOMContentLoaded', function() {\n`;

    if (hasRequiredFields) {
      js += `  // Clear validation errors on input\n`;
      js += `  document.querySelectorAll('[required]').forEach(function(field) {\n`;
      js += `    field.addEventListener('input', function() {\n`;
      js += `      if (field.value && field.value.trim()) {\n`;
      js += `        field.classList.remove('input-error');\n`;
      js += `        var errorEl = document.getElementById(field.id + '-error');\n`;
      js += `        if (errorEl) errorEl.classList.remove('field-error--visible');\n`;
      js += `      }\n`;
      js += `    });\n`;
      js += `  });\n\n`;
    }

    if (needsDeviceInfo) {
      const purposes = [];
      if (themeMode === 'auto') purposes.push('theme');
      if (hasI18n) purposes.push('language');
      js += `  // Detect device info for ${purposes.join(' and ')}\n`;
      js += `  if (typeof TWK !== 'undefined' && TWK.getDeviceInfo) {\n`;
      js += `    TWK.getDeviceInfo().then(function(data) {\n`;
      js += `      var info = data.result;\n`;

      if (themeMode === 'auto') {
        js += `      // Apply theme based on device appearance\n`;
        js += `      var theme = info.appearance === '1' ? 'light' : 'dark';\n`;
        js += `      document.documentElement.setAttribute('data-theme', theme);\n`;
      }

      if (hasI18n) {
        js += `      // Apply language and direction\n`;
        js += `      var lang = (info.app_language || 'en').toLowerCase();\n`;
        js += `      var isAr = lang === 'ar' || lang.startsWith('ar');\n`;
        js += `      document.documentElement.setAttribute('lang', isAr ? 'ar' : 'en');\n`;
        js += `      document.documentElement.setAttribute('dir', isAr ? 'rtl' : 'ltr');\n`;
        js += `      if (isAr) { applyArabicTranslations(); }\n`;
      }

      js += `    }).catch(function(err) { console.error('getDeviceInfo:', err); });\n`;
      js += `  }\n\n`;
    }

    // Generate the i18n translations function
    if (hasI18n) {
      js += this.generateI18nFunction(pages);
    }

    for (const page of pages) {
      for (const el of page.elements) {
        if (el.dataSource === 'dynamic' && el.dynamicBinding) {
          const b = el.dynamicBinding;
          const params = Object.values(b.params).filter(v => v).map(v => `'${v}'`).join(', ');
          const call = `TWK.${b.functionName}(${params})`;

          if (el.type === 'text') {
            js += `  ${call}.then(function(data) {\n`;
            js += `    document.getElementById('${el.id}').textContent = data.${b.resultPath};\n`;
            js += `  }).catch(function(err) { console.error('${b.functionName}:', err); });\n\n`;
          } else if (el.type === 'image') {
            js += `  ${call}.then(function(data) {\n`;
            js += `    document.getElementById('${el.id}').src = data.${b.resultPath};\n`;
            js += `  }).catch(function(err) { console.error('${b.functionName}:', err); });\n\n`;
          } else if (el.type === 'map') {
            js += `  ${call}.then(function(data) {\n`;
            js += `    var loc = data.${b.resultPath};\n`;
            js += `    document.getElementById('${el.id}-iframe').src = 'https://maps.google.com/maps?q=' + loc.latitude + ',' + loc.longitude + '&output=embed';\n`;
            js += `  }).catch(function(err) { console.error('${b.functionName}:', err); });\n\n`;
          } else if (['dropdown', 'radio', 'checkbox'].includes(el.type)) {
            js += `  ${call}.then(function(data) {\n`;
            js += `    var items = data.${b.resultPath};\n`;
            js += `    var container = document.getElementById('${el.id}');\n`;
            if (el.type === 'dropdown') {
              js += `    container.innerHTML = '';\n`;
              js += `    items.forEach(function(item) {\n`;
              js += `      var opt = document.createElement('option');\n`;
              js += `      opt.textContent = JSON.stringify(item);\n`;
              js += `      container.appendChild(opt);\n`;
              js += `    });\n`;
            }
            js += `  }).catch(function(err) { console.error('${b.functionName}:', err); });\n\n`;
          }
        }

        if (el.type === 'button') {
          const validate = el.settings['validateRequired'] === 'true';
          const hasAction = !!el.pageNavigateTo || !!el.dynamicBinding;
          const hasSubmit = !!el.submitConfig;

          if (hasSubmit && el.submitConfig) {
            const cfg = el.submitConfig;
            const successIndex = pages.findIndex(p => p.id === cfg.successPage);
            const successFile = successIndex >= 0 ? (successIndex === 0 ? 'index.html' : `page${successIndex + 1}.html`) : '';

            js += `  // Submit button: ${el.id}\n`;
            js += `  document.getElementById('${el.id}').addEventListener('click', async function() {\n`;
            if (validate) {
              js += `    var requiredFields = document.querySelectorAll('[required]');\n`;
              js += `    var allValid = true;\n`;
              js += `    requiredFields.forEach(function(field) {\n`;
              js += `      var errorEl = document.getElementById(field.id + '-error');\n`;
              js += `      if (!field.value || !field.value.trim()) { allValid = false; field.classList.add('input-error'); if (errorEl) errorEl.classList.add('field-error--visible'); }\n`;
              js += `      else { field.classList.remove('input-error'); if (errorEl) errorEl.classList.remove('field-error--visible'); }\n`;
              js += `    });\n`;
              js += `    if (!allValid) return;\n`;
            }
            js += `    var btn = this;\n`;
            js += `    var originalText = btn.textContent;\n`;
            js += `    btn.disabled = true; btn.textContent = 'Submitting...';\n`;
            js += `    try {\n`;
            // Build body from field mappings
            js += `      var bodyObj = {};\n`;
            for (const m of cfg.fieldMappings) {
              const varName = m.elementId.replace(/-/g, '_');
              if (m.source === 'input') {
                js += `      var f_${varName} = document.getElementById('${m.elementId}');\n`;
                js += `      if (f_${varName}) bodyObj['${m.keyName}'] = f_${varName}.value;\n`;
              } else if (m.source === 'dropdown') {
                js += `      var f_${varName} = document.querySelector('#${m.elementId} .custom-dropdown__value');\n`;
                js += `      if (f_${varName}) bodyObj['${m.keyName}'] = f_${varName}.value || '';\n`;
              } else if (m.source === 'radio') {
                const srcEl = pages.flatMap(p => p.elements).find(e => e.id === m.elementId);
                const radioName = srcEl?.settings['groupName'] || m.elementId;
                js += `      var f_${varName} = document.querySelector('input[name="${radioName}"]:checked');\n`;
                js += `      bodyObj['${m.keyName}'] = f_${varName} ? f_${varName}.value : '';\n`;
              } else if (m.source === 'checkbox') {
                js += `      var f_${varName} = document.querySelectorAll('#${m.elementId} input[type="checkbox"]:checked');\n`;
                js += `      bodyObj['${m.keyName}'] = Array.from(f_${varName}).map(function(c) { return c.value; });\n`;
              } else if (m.source === 'date-picker') {
                js += `      var f_${varName} = document.querySelector('#${m.elementId} .date-picker-trigger__text');\n`;
                js += `      bodyObj['${m.keyName}'] = f_${varName} && !f_${varName}.classList.contains('date-picker-trigger__text--placeholder') ? f_${varName}.textContent : '';\n`;
              } else if (m.source === 'media-select') {
                js += `      var f_${varName} = document.querySelectorAll('#${m.elementId} .img-picker__item img, #${m.elementId} .img-picker__item video');\n`;
                js += `      bodyObj['${m.keyName}'] = Array.from(f_${varName}).map(function(m) { return m.src; });\n`;
              } else if (m.source === 'map') {
                js += `      var f_${varName} = document.querySelector('#${m.elementId} iframe');\n`;
                js += `      if (f_${varName}) { var src = f_${varName}.getAttribute('src') || ''; var match = src.match(/q=([\\d.-]+),([\\d.-]+)/); bodyObj['${m.keyName}'] = match ? { lat: parseFloat(match[1]), lng: parseFloat(match[2]) } : null; }\n`;
              } else if (m.source === 'dynamic') {
                const srcEl = pages.flatMap(p => p.elements).find(e => e.id === m.elementId);
                if (srcEl?.dynamicBinding) {
                  const b = srcEl.dynamicBinding;
                  const params = Object.values(b.params).filter(v => v).map(v => `'${v}'`).join(', ');
                  js += `      var dyn_${varName} = await TWK.${b.functionName}(${params});\n`;
                  js += `      bodyObj['${m.keyName}'] = dyn_${varName}.${b.resultPath};\n`;
                }
              }
            }
            js += `      var body = JSON.stringify(bodyObj);\n`;
            js += `      console.error('[Submit] body:', body);\n`;
            js += `      var headers = { 'Content-Type': 'application/json' };\n`;
            js += `      try {\n`;
            js += `        console.error('[Submit] getting token...');\n`;
            js += `        var tokenData = await withTimeout(TWK.generateToken(), 10000, 'generateToken');\n`;
            js += `        var token = tokenData.result && tokenData.result.token ? tokenData.result.token : '';\n`;
            js += `        if (token) headers['Authorization'] = 'Bearer ' + token;\n`;
            js += `        console.error('[Submit] token ok');\n`;
            js += `      } catch(tokenErr) { console.error('[Submit] Token error (continuing):', tokenErr); }\n`;
            js += `      if (SECRET_KEY) {\n`;
            js += `        console.error('[Submit] signing...');\n`;
            js += `        var signed = await withTimeout(hashRequest(body), 5000, 'hashRequest');\n`;
            js += `        headers['signature'] = signed.signature;\n`;
            js += `        headers['timestamp'] = signed.timestamp;\n`;
            js += `        headers['nonce'] = signed.nonce;\n`;
            js += `      }\n`;
            js += `      console.error('[Submit] fetching ${cfg.apiUrl}...');\n`;
            js += `      var resp = await withTimeout(fetch('${cfg.apiUrl}', {\n`;
            js += `        method: 'POST',\n`;
            js += `        headers: headers,\n`;
            js += `        body: body\n`;
            js += `      }), 30000, 'fetch');\n`;
            js += `      console.error('[Submit] response status:', resp.status);\n`;
            js += `      if (!resp.ok) throw new Error('HTTP ' + resp.status);\n`;
            js += `      var respText = await resp.text();\n`;
            js += `      var data = null;\n`;
            js += `      try { data = JSON.parse(respText); } catch(e) { data = respText; }\n`;
            js += `      console.error('[Submit] success:', JSON.stringify(data).substring(0, 200));\n`;
            if (successFile) {
              js += `      window.location.href = '${successFile}';\n`;
            } else {
              js += `      showToast('Submitted successfully!');\n`;
              js += `      btn.disabled = false; btn.textContent = originalText;\n`;
            }
            js += `    } catch(err) {\n`;
            js += `      console.error('[Submit] error:', err);\n`;
            js += `      showToast(${JSON.stringify(cfg.errorMessage || 'Submission failed. Please try again.')});\n`;
            js += `      btn.disabled = false; btn.textContent = originalText;\n`;
            js += `    }\n`;
            js += `  });\n\n`;
          } else if (hasAction) {
            js += `  document.getElementById('${el.id}').addEventListener('click', function() {\n`;
            if (validate) {
              js += `    var requiredFields = document.querySelectorAll('[required]');\n`;
              js += `    var allValid = true;\n`;
              js += `    requiredFields.forEach(function(field) {\n`;
              js += `      var errorEl = document.getElementById(field.id + '-error');\n`;
              js += `      if (!field.value || !field.value.trim()) { allValid = false; field.classList.add('input-error'); if (errorEl) errorEl.classList.add('field-error--visible'); }\n`;
              js += `      else { field.classList.remove('input-error'); if (errorEl) errorEl.classList.remove('field-error--visible'); }\n`;
              js += `    });\n`;
              js += `    if (!allValid) return;\n`;
            }
            if (el.pageNavigateTo) {
              const targetIndex = pages.findIndex(p => p.id === el.pageNavigateTo);
              if (targetIndex >= 0) {
                const targetFile = targetIndex === 0 ? 'index.html' : `page${targetIndex + 1}.html`;
                js += `    window.location.href = '${targetFile}';\n`;
              }
            } else if (el.dynamicBinding) {
              const b = el.dynamicBinding;
              const params = Object.values(b.params).filter(v => v).map(v => `'${v}'`).join(', ');
              js += `    TWK.${b.functionName}(${params}).then(function(data) {\n`;
              js += `      console.log('${b.functionName} result:', data);\n`;
              js += `    }).catch(function(err) { console.error('${b.functionName}:', err); });\n`;
            }
            js += `  });\n\n`;
          }
        }

        if (el.type === 'dropdown') {
          const hasActions = el.options.some(o => o.action);
          const label = el.settings['label'] || 'Select';
          js += `  // Custom dropdown bottom sheet: ${el.id}\n`;
          js += `  (function() {\n`;
          js += `    var dd = document.getElementById('${el.id}');\n`;
          js += `    if (!dd) return;\n`;
          js += `    var trigger = dd.querySelector('.custom-dropdown__trigger');\n`;
          js += `    var textEl = dd.querySelector('.custom-dropdown__text');\n`;
          js += `    var hiddenInput = dd.querySelector('.custom-dropdown__value');\n`;
          js += `    var overlay = document.getElementById('bsOverlay');\n`;
          js += `    var sheet = document.getElementById('bsSheet');\n`;
          js += `    var bsList = document.getElementById('bsList');\n`;
          js += `    var bsTitle = document.getElementById('bsTitle');\n`;
          if (el.options.length > 0) {
            js += `    hiddenInput.value = '${el.options[0].value}';\n`;
          }
          js += `    function closeSheet() { overlay.classList.remove('bottom-sheet-overlay--open'); sheet.classList.remove('bottom-sheet--open'); }\n`;
          js += `    trigger.addEventListener('click', function() {\n`;
          js += `      bsTitle.textContent = ${JSON.stringify(label)};\n`;
          js += `      bsList.innerHTML = '';\n`;
          js += `      dd.querySelectorAll('.custom-dropdown__item').forEach(function(srcItem) {\n`;
          js += `        var btn = document.createElement('button');\n`;
          js += `        btn.className = 'bottom-sheet__item' + (srcItem.getAttribute('data-value') === hiddenInput.value ? ' bottom-sheet__item--active' : '');\n`;
          js += `        btn.type = 'button';\n`;
          js += `        var iconEl = srcItem.querySelector('i.pi');\n`;
          js += `        if (iconEl) btn.appendChild(iconEl.cloneNode(true));\n`;
          js += `        var span = document.createElement('span');\n`;
          js += `        span.textContent = srcItem.querySelector('span').textContent;\n`;
          js += `        btn.appendChild(span);\n`;
          js += `        btn.addEventListener('click', function() {\n`;
          js += `          textEl.textContent = span.textContent;\n`;
          js += `          hiddenInput.value = srcItem.getAttribute('data-value');\n`;
          if (hasActions) {
            js += `          var actions = {\n`;
            for (const opt of el.options) {
              if (opt.action) {
                const params = Object.values(opt.action.params).filter(v => v).map(v => `'${v}'`).join(', ');
                js += `            '${opt.value}': function() { return TWK.${opt.action.functionName}(${params}); },\n`;
              }
            }
            js += `          };\n`;
            js += `          var fn = actions[srcItem.getAttribute('data-value')];\n`;
            js += `          if (fn) fn().then(function(data) { console.log('Result:', data); }).catch(function(err) { console.error(err); });\n`;
          }
          js += `          closeSheet();\n`;
          js += `        });\n`;
          js += `        bsList.appendChild(btn);\n`;
          js += `      });\n`;
          js += `      overlay.classList.add('bottom-sheet-overlay--open');\n`;
          js += `      sheet.classList.add('bottom-sheet--open');\n`;
          js += `    });\n`;
          js += `    overlay.addEventListener('click', closeSheet);\n`;
          js += `  })();\n\n`;
        }

        if (el.type === 'date-picker') {
          js += `  // Date picker calendar: ${el.id}\n`;
          js += `  (function() {\n`;
          js += `    var btn = document.getElementById('${el.id}');\n`;
          js += `    if (!btn) return;\n`;
          js += `    var fmt = btn.getAttribute('data-format') || 'yyyy-MM-dd';\n`;
          js += `    var minStr = btn.getAttribute('data-min');\n`;
          js += `    var maxStr = btn.getAttribute('data-max');\n`;
          js += `    var minDate = minStr ? new Date(minStr + 'T00:00:00') : null;\n`;
          js += `    var maxDate = maxStr ? new Date(maxStr + 'T00:00:00') : null;\n`;
          js += `    var textEl = btn.querySelector('.date-picker-trigger__text');\n`;
          js += `    var overlay = document.getElementById('bsOverlay');\n`;
          js += `    var sheet = document.getElementById('bsSheet');\n`;
          js += `    var selectedDate = null;\n`;
          js += `    var viewYear, viewMonth;\n`;
          js += `    var now = new Date(); viewYear = now.getFullYear(); viewMonth = now.getMonth();\n`;
          js += `    function pad(n) { return n < 10 ? '0' + n : '' + n; }\n`;
          js += `    function formatDate(d) {\n`;
          js += `      var y = '' + d.getFullYear(), m = pad(d.getMonth()+1), dd = pad(d.getDate());\n`;
          js += `      return fmt.replace('yyyy',y).replace('MM',m).replace('dd',dd);\n`;
          js += `    }\n`;
          js += `    function closeSheet() { overlay.classList.remove('bottom-sheet-overlay--open'); sheet.classList.remove('bottom-sheet--open'); }\n`;
          js += `    function renderCal() {\n`;
          js += `      var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];\n`;
          js += `      var days = ['Su','Mo','Tu','We','Th','Fr','Sa'];\n`;
          js += `      var title = sheet.querySelector('.bottom-sheet__title');\n`;
          js += `      var list = sheet.querySelector('.bottom-sheet__list');\n`;
          js += `      title.textContent = '';\n`;
          js += `      list.innerHTML = '';\n`;
          // Calendar header with nav
          js += `      var hdr = document.createElement('div'); hdr.className = 'cal-header';\n`;
          js += `      var prevBtn = document.createElement('button'); prevBtn.className = 'cal-header__btn'; prevBtn.type = 'button'; prevBtn.innerHTML = '&#8249;';\n`;
          js += `      prevBtn.addEventListener('click', function() { viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } renderCal(); });\n`;
          js += `      var nextBtn = document.createElement('button'); nextBtn.className = 'cal-header__btn'; nextBtn.type = 'button'; nextBtn.innerHTML = '&#8250;';\n`;
          js += `      nextBtn.addEventListener('click', function() { viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } renderCal(); });\n`;
          js += `      var titleSpan = document.createElement('span'); titleSpan.className = 'cal-header__title'; titleSpan.textContent = months[viewMonth] + ' ' + viewYear;\n`;
          js += `      hdr.appendChild(prevBtn); hdr.appendChild(titleSpan); hdr.appendChild(nextBtn);\n`;
          js += `      list.appendChild(hdr);\n`;
          // Weekday headers
          js += `      var wk = document.createElement('div'); wk.className = 'cal-weekdays';\n`;
          js += `      days.forEach(function(d) { var s = document.createElement('span'); s.textContent = d; wk.appendChild(s); });\n`;
          js += `      list.appendChild(wk);\n`;
          // Calendar grid
          js += `      var grid = document.createElement('div'); grid.className = 'cal-grid';\n`;
          js += `      var firstDay = new Date(viewYear, viewMonth, 1).getDay();\n`;
          js += `      var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();\n`;
          js += `      var today = new Date(); today.setHours(0,0,0,0);\n`;
          // Empty cells before first day
          js += `      for (var i = 0; i < firstDay; i++) { var e = document.createElement('button'); e.className = 'cal-day cal-day--empty'; e.type = 'button'; e.textContent = ''; grid.appendChild(e); }\n`;
          // Day cells
          js += `      for (var d = 1; d <= daysInMonth; d++) {\n`;
          js += `        var cell = document.createElement('button'); cell.type = 'button'; cell.textContent = d;\n`;
          js += `        var cellDate = new Date(viewYear, viewMonth, d);\n`;
          js += `        var cls = 'cal-day';\n`;
          js += `        if (cellDate.getTime() === today.getTime()) cls += ' cal-day--today';\n`;
          js += `        if (selectedDate && cellDate.getTime() === selectedDate.getTime()) cls += ' cal-day--selected';\n`;
          js += `        if ((minDate && cellDate < minDate) || (maxDate && cellDate > maxDate)) cls += ' cal-day--disabled';\n`;
          js += `        cell.className = cls;\n`;
          js += `        (function(cd) { cell.addEventListener('click', function() {\n`;
          js += `          selectedDate = cd;\n`;
          js += `          textEl.textContent = formatDate(cd);\n`;
          js += `          textEl.classList.remove('date-picker-trigger__text--placeholder');\n`;
          js += `          closeSheet();\n`;
          js += `        }); })(cellDate);\n`;
          js += `        grid.appendChild(cell);\n`;
          js += `      }\n`;
          js += `      list.appendChild(grid);\n`;
          js += `    }\n`;
          // Open on click
          js += `    btn.addEventListener('click', function() {\n`;
          js += `      if (selectedDate) { viewYear = selectedDate.getFullYear(); viewMonth = selectedDate.getMonth(); }\n`;
          js += `      renderCal();\n`;
          js += `      overlay.classList.add('bottom-sheet-overlay--open');\n`;
          js += `      sheet.classList.add('bottom-sheet--open');\n`;
          js += `    });\n`;
          js += `    overlay.addEventListener('click', closeSheet);\n`;
          js += `  })();\n\n`;
        }

        if (el.type === 'media-select') {
          const label = el.settings['label'] || 'Select Media';
          js += `  // Media select: ${el.id}\n`;
          js += `  (function() {\n`;
          js += `    var picker = document.getElementById('${el.id}');\n`;
          js += `    if (!picker) return;\n`;
          js += `    var trigger = picker.querySelector('.img-picker__trigger');\n`;
          js += `    var grid = picker.querySelector('.img-picker__grid');\n`;
          js += `    var overlay = document.getElementById('bsOverlay');\n`;
          js += `    var sheet = document.getElementById('bsSheet');\n`;
          js += `    var bsList = document.getElementById('bsList');\n`;
          js += `    var bsTitle = document.getElementById('bsTitle');\n`;
          js += `    var itemCount = 0;\n`;
          js += `    function closeSheet() { overlay.classList.remove('bottom-sheet-overlay--open'); sheet.classList.remove('bottom-sheet--open'); }\n`;
          js += `    function addPreviewItem(src, mimeType, index) {\n`;
          js += `      var item = document.createElement('div');\n`;
          js += `      item.className = 'img-picker__item';\n`;
          js += `      item.style.animationDelay = (index * 0.06) + 's';\n`;
          js += `      var isVideo = mimeType && mimeType.startsWith('video');\n`;
          js += `      if (isVideo) {\n`;
          js += `        var vid = document.createElement('video'); vid.src = src; vid.controls = true; item.appendChild(vid);\n`;
          js += `      } else {\n`;
          js += `        var img = document.createElement('img'); img.src = src; img.alt = 'Preview'; item.appendChild(img);\n`;
          js += `      }\n`;
          js += `      var removeBtn = document.createElement('button'); removeBtn.type = 'button'; removeBtn.className = 'img-picker__remove';\n`;
          js += `      removeBtn.innerHTML = '<svg width=\"12\" height=\"12\" viewBox=\"0 0 12 12\" fill=\"none\"><path d=\"M1 1l10 10M11 1L1 11\" stroke=\"#fff\" stroke-width=\"1.8\" stroke-linecap=\"round\"/></svg>';\n`;
          js += `      removeBtn.addEventListener('click', function() { item.classList.add('img-picker__item--removing'); item.addEventListener('animationend', function() { item.remove(); }); });\n`;
          js += `      item.appendChild(removeBtn);\n`;
          js += `      grid.appendChild(item);\n`;
          js += `    }\n`;
          js += `    function handleMediaResult(data) {\n`;
          js += `      var items = [];\n`;
          js += `      if (data && data.result) {\n`;
          js += `        if (Array.isArray(data.result)) { items = data.result; }\n`;
          js += `        else if (data.result.data) { items = [data.result]; }\n`;
          js += `      }\n`;
          js += `      items.forEach(function(mediaItem, i) {\n`;
          js += `        if (!mediaItem.data) return;\n`;
          js += `        TWK.getRawData(mediaItem.data).then(function(ret) {\n`;
          js += `          var mime = mediaItem.mime_type || data.mime_type || 'image/png';\n`;
          js += `          var src = 'data:' + mime + ';base64,' + ret.result.data;\n`;
          js += `          addPreviewItem(src, mime, itemCount + i);\n`;
          js += `        }).catch(function(e) { console.error('getRawData error:', e); });\n`;
          js += `      });\n`;
          js += `      itemCount += items.length;\n`;
          js += `    }\n`;
          // Build the actions map
          js += `    var actions = {\n`;
          for (const opt of el.options) {
            if (opt.action) {
              const params = Object.values(opt.action.params).filter(v => v).map(v => `'${v}'`).join(', ');
              js += `      '${opt.value}': function() { return TWK.${opt.action.functionName}(${params}); },\n`;
            }
          }
          js += `    };\n`;
          js += `    trigger.addEventListener('click', function() {\n`;
          js += `      bsTitle.textContent = ${JSON.stringify(label)};\n`;
          js += `      bsList.innerHTML = '';\n`;
          js += `      picker.querySelectorAll('.img-picker__option').forEach(function(optBtn) {\n`;
          js += `        var btn = document.createElement('button'); btn.className = 'bottom-sheet__item'; btn.type = 'button';\n`;
          js += `        var optIcon = optBtn.querySelector('i.pi'); if (optIcon) btn.appendChild(optIcon.cloneNode(true));\n`;
          js += `        var span = document.createElement('span'); span.textContent = optBtn.querySelector('span') ? optBtn.querySelector('span').textContent : optBtn.textContent; btn.appendChild(span);\n`;
          js += `        btn.addEventListener('click', function() {\n`;
          js += `          closeSheet();\n`;
          js += `          var fn = actions[optBtn.getAttribute('data-value')];\n`;
          js += `          if (fn) fn().then(handleMediaResult).catch(function(err) { console.error('Media error:', err); });\n`;
          js += `        });\n`;
          js += `        bsList.appendChild(btn);\n`;
          js += `      });\n`;
          js += `      overlay.classList.add('bottom-sheet-overlay--open');\n`;
          js += `      sheet.classList.add('bottom-sheet--open');\n`;
          js += `    });\n`;
          js += `    overlay.addEventListener('click', closeSheet);\n`;
          js += `  })();\n\n`;
        }

        if (['radio', 'checkbox'].includes(el.type) && el.dataSource === 'static') {
        }
      }
    }

    js += `});\n`;
    if (debugMode) {
      js = js.replace(/console\.error\(/g, 'debugLog(');
    }
    return js;
  }

  private generateI18nFunction(pages: Page[]): string {
    let js = `  function applyArabicTranslations() {\n`;

    for (const page of pages) {
      for (const el of page.elements) {
        if (!el.i18nEnabled || !el.i18n?.ar) continue;
        const ar = el.i18n.ar;

        if (el.type === 'text' && ar.staticContent && el.dataSource === 'static') {
          js += `    var el_${el.id.replace(/-/g, '_')} = document.getElementById('${el.id}');\n`;
          js += `    if (el_${el.id.replace(/-/g, '_')}) el_${el.id.replace(/-/g, '_')}.textContent = ${JSON.stringify(ar.staticContent)};\n`;
        }

        if (el.type === 'button' && ar.staticContent) {
          js += `    var el_${el.id.replace(/-/g, '_')} = document.getElementById('${el.id}');\n`;
          js += `    if (el_${el.id.replace(/-/g, '_')}) el_${el.id.replace(/-/g, '_')}.textContent = ${JSON.stringify(ar.staticContent)};\n`;
        }

        if (el.type === 'input') {
          if (ar.settings?.['label']) {
            js += `    var label_${el.id.replace(/-/g, '_')} = document.getElementById('${el.id}');\n`;
            js += `    if (label_${el.id.replace(/-/g, '_')}) label_${el.id.replace(/-/g, '_')}.previousElementSibling.textContent = ${JSON.stringify(ar.settings['label'])};\n`;
          }
          if (ar.settings?.['placeholder']) {
            js += `    var input_${el.id.replace(/-/g, '_')} = document.getElementById('${el.id}');\n`;
            js += `    if (input_${el.id.replace(/-/g, '_')}) input_${el.id.replace(/-/g, '_')}.placeholder = ${JSON.stringify(ar.settings['placeholder'])};\n`;
          }
        }

        if (el.type === 'date-picker') {
          if (ar.settings?.['label']) {
            js += `    var dp_${el.id.replace(/-/g, '_')} = document.getElementById('${el.id}');\n`;
            js += `    if (dp_${el.id.replace(/-/g, '_')}) dp_${el.id.replace(/-/g, '_')}.previousElementSibling.textContent = ${JSON.stringify(ar.settings['label'])};\n`;
          }
        }

        if (el.type === 'media-select') {
          if (ar.settings?.['label']) {
            js += `    var ms_${el.id.replace(/-/g, '_')} = document.getElementById('${el.id}');\n`;
            js += `    if (ms_${el.id.replace(/-/g, '_')}) ms_${el.id.replace(/-/g, '_')}.previousElementSibling.textContent = ${JSON.stringify(ar.settings['label'])};\n`;
          }
          if (ar.options && ar.options.length > 0) {
            js += `    var ms_opts_${el.id.replace(/-/g, '_')} = document.getElementById('${el.id}').querySelectorAll('.img-picker__option');\n`;
            for (let i = 0; i < ar.options.length; i++) {
              if (ar.options[i].label) {
                js += `    if (ms_opts_${el.id.replace(/-/g, '_')}[${i}]) ms_opts_${el.id.replace(/-/g, '_')}[${i}].textContent = ${JSON.stringify(ar.options[i].label)};\n`;
              }
            }
          }
        }

        if (['dropdown', 'radio', 'checkbox'].includes(el.type)) {
          if (ar.settings?.['label']) {
            js += `    var group_${el.id.replace(/-/g, '_')} = document.getElementById('${el.id}');\n`;
            if (el.type === 'dropdown') {
              js += `    if (group_${el.id.replace(/-/g, '_')}) group_${el.id.replace(/-/g, '_')}.previousElementSibling.textContent = ${JSON.stringify(ar.settings['label'])};\n`;
            } else {
              js += `    if (group_${el.id.replace(/-/g, '_')}) group_${el.id.replace(/-/g, '_')}.querySelector('.el-label').textContent = ${JSON.stringify(ar.settings['label'])};\n`;
            }
          }
          if (ar.options && ar.options.length > 0 && el.dataSource === 'static') {
            if (el.type === 'dropdown') {
              js += `    var dd_items_${el.id.replace(/-/g, '_')} = document.getElementById('${el.id}').querySelectorAll('.custom-dropdown__item span');\n`;
              js += `    var dd_text_${el.id.replace(/-/g, '_')} = document.getElementById('${el.id}').querySelector('.custom-dropdown__text');\n`;
              for (let i = 0; i < ar.options.length; i++) {
                if (ar.options[i].label) {
                  js += `    if (dd_items_${el.id.replace(/-/g, '_')}[${i}]) dd_items_${el.id.replace(/-/g, '_')}[${i}].textContent = ${JSON.stringify(ar.options[i].label)};\n`;
                }
              }
              // Update the trigger text if first option is selected
              if (ar.options[0]?.label) {
                js += `    if (dd_text_${el.id.replace(/-/g, '_')}) dd_text_${el.id.replace(/-/g, '_')}.textContent = ${JSON.stringify(ar.options[0].label)};\n`;
              }
            } else {
              js += `    var labels_${el.id.replace(/-/g, '_')} = document.getElementById('${el.id}').querySelectorAll('label:not(.el-label)');\n`;
              for (let i = 0; i < ar.options.length; i++) {
                if (ar.options[i].label) {
                  js += `    if (labels_${el.id.replace(/-/g, '_')}[${i}]) { var inp = labels_${el.id.replace(/-/g, '_')}[${i}].querySelector('input'); labels_${el.id.replace(/-/g, '_')}[${i}].textContent = ''; labels_${el.id.replace(/-/g, '_')}[${i}].appendChild(inp); labels_${el.id.replace(/-/g, '_')}[${i}].appendChild(document.createTextNode(' ' + ${JSON.stringify(ar.options[i].label)})); }\n`;
                }
              }
            }
          }
        }
      }
    }

    js += `  }\n\n`;
    return js;
  }

  private generateHtml(page: Page, allPages: Page[]): string {
    let body = '';
    for (const el of page.elements) {
      body += this.elementToHtml(el) + '\n';
    }

    const hasDropdowns = page.elements.some(e => e.type === 'dropdown' || e.type === 'date-picker' || e.type === 'media-select');
    const sheetHtml = hasDropdowns ? `  <div class="bottom-sheet-overlay" id="bsOverlay"></div>\n  <div class="bottom-sheet" id="bsSheet">\n    <div class="bottom-sheet__handle"></div>\n    <div class="bottom-sheet__title" id="bsTitle"></div>\n    <div class="bottom-sheet__list" id="bsList"></div>\n  </div>\n` : '';
    const hasIcons = allPages.some(p => p.elements.some(e =>
      e.settings['icon'] || e.options.some(o => o.icon)
    ));
    const iconLink = hasIcons ? `\n  <link rel="stylesheet" href="css/primeicons.css">` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.name}</title>
  <link rel="stylesheet" href="css/style.css">${iconLink}
</head>
<body>
${body}${sheetHtml}
  <script src="js/twkhelper.js"></script>
  <script src="js/app.js"></script>
</body>
</html>`;
  }

  private iconHtml(icon: string | undefined): string {
    return icon ? `<i class="pi pi-${icon}"></i> ` : '';
  }

  private elementToHtml(el: BuilderElement): string {
    const elIcon = this.iconHtml(el.settings['icon']);
    switch (el.type) {
      case 'text': {
        const tag = el.settings['headingLevel'] || 'p';
        return `  <${tag} id="${el.id}">${el.dataSource === 'dynamic' ? 'Loading...' : elIcon + this.escapeHtml(el.staticContent)}</${tag}>`;
      }
      case 'button':
        return `  <button id="${el.id}">${elIcon}${this.escapeHtml(el.staticContent)}</button>`;
      case 'image':
        return `  <img id="${el.id}" src="${el.staticContent || ''}" alt="${el.settings['alt'] || ''}" style="width:${el.settings['width'] || '100%'}">`;
      case 'input': {
        const h = parseInt(el.settings['inputHeight'] || '0', 10);
        const isArea = h > 40;
        const isRequired = el.settings['required'] === 'true';
        const star = isRequired ? ' <span class="required-star">*</span>' : '';
        const reqAttr = isRequired ? ' required' : '';
        const label = `  <label class="el-label">${this.escapeHtml(el.settings['label'] || '')}${star}</label>\n`;
        const errorDiv = isRequired ? `\n  <div class="field-error" id="${el.id}-error">This field is required</div>` : '';
        if (isArea) {
          return label + `  <textarea id="${el.id}" placeholder="${this.escapeHtml(el.settings['placeholder'] || '')}" style="height:${h}px"${reqAttr}></textarea>${errorDiv}`;
        }
        return label + `  <input id="${el.id}" type="${el.settings['inputType'] || 'text'}" placeholder="${this.escapeHtml(el.settings['placeholder'] || '')}"${reqAttr}>${errorDiv}`;
      }
      case 'dropdown': {
        let html = `  <label class="el-label">${this.escapeHtml(el.settings['label'] || '')}</label>\n`;
        html += `  <div class="custom-dropdown" id="${el.id}">\n`;
        html += `    <input type="hidden" class="custom-dropdown__value" value="" />\n`;
        html += `    <button type="button" class="custom-dropdown__trigger">\n`;
        html += `      <span class="custom-dropdown__text">${el.options.length ? this.escapeHtml(el.options[0].label) : ''}</span>\n`;
        html += `      <svg class="custom-dropdown__arrow" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>\n`;
        html += `    </button>\n`;
        html += `    <div class="custom-dropdown__panel">\n`;
        html += `      <div class="custom-dropdown__list">`;
        for (const opt of el.options) {
          html += `\n        <button type="button" class="custom-dropdown__item" data-value="${opt.value}">`;
          html += `${this.iconHtml(opt.icon)}<span>${this.escapeHtml(opt.label)}</span></button>`;
        }
        html += `\n      </div>\n    </div>\n  </div>`;
        return html;
      }
      case 'radio': {
        let html = `  <div class="radio-group" id="${el.id}">\n    <label class="el-label">${this.escapeHtml(el.settings['label'] || '')}</label>`;
        for (const opt of el.options) {
          html += `\n    <label><input type="radio" name="${el.settings['groupName'] || el.id}" value="${opt.value}"> ${this.iconHtml(opt.icon)}${this.escapeHtml(opt.label)}</label>`;
        }
        html += `\n  </div>`;
        return html;
      }
      case 'checkbox': {
        let html = `  <div class="checkbox-group" id="${el.id}">\n    <label class="el-label">${this.escapeHtml(el.settings['label'] || '')}</label>`;
        for (const opt of el.options) {
          html += `\n    <label><input type="checkbox" value="${opt.value}"> ${this.iconHtml(opt.icon)}${this.escapeHtml(opt.label)}</label>`;
        }
        html += `\n  </div>`;
        return html;
      }
      case 'map': {
        const lat = el.settings['lat'] || '24.7136';
        const lng = el.settings['lng'] || '46.6753';
        const zoom = el.settings['zoom'] || '13';
        return `  <div class="map-container" id="${el.id}">\n    <iframe id="${el.id}-iframe" src="https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed"></iframe>\n  </div>`;
      }
      case 'date-picker': {
        const fmt = el.settings['dateFormat'] || 'yyyy-MM-dd';
        const min = el.settings['minDate'] || '';
        const max = el.settings['maxDate'] || '';
        let html = `  <label class="el-label">${this.escapeHtml(el.settings['label'] || '')}</label>\n`;
        html += `  <button type="button" class="date-picker-trigger" id="${el.id}" data-format="${fmt}" data-min="${min}" data-max="${max}">\n`;
        html += `    <svg class="date-picker-trigger__icon" width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.2"/><path d="M1 7h14" stroke="currentColor" stroke-width="1.2"/><path d="M5 1v4M11 1v4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>\n`;
        html += `    <span class="date-picker-trigger__text date-picker-trigger__text--placeholder">${this.escapeHtml(fmt)}</span>\n`;
        html += `  </button>`;
        return html;
      }
      case 'media-select': {
        let html = `  <label class="el-label">${this.escapeHtml(el.settings['label'] || '')}</label>\n`;
        html += `  <div class="img-picker" id="${el.id}">\n`;
        html += `    <div class="img-picker__trigger">\n`;
        html += `      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>\n`;
        html += `      <span class="img-picker__text">${this.escapeHtml(el.settings['triggerText'] || 'Tap to add media')}</span>\n`;
        html += `    </div>\n`;
        html += `    <div class="img-picker__options">`;
        for (const opt of el.options) {
          html += `\n      <button type="button" class="img-picker__option" data-value="${opt.value}"`;
          if (opt.action) {
            html += ` data-fn="${opt.action.functionName}"`;
          }
          html += `>${this.iconHtml(opt.icon)}${this.escapeHtml(opt.label)}</button>`;
        }
        html += `\n    </div>\n`;
        html += `    <div class="img-picker__grid"></div>\n`;
        html += `  </div>`;
        return html;
      }
      case 'divider':
        return `  <hr id="${el.id}">`;
      default:
        return '';
    }
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private styleObjectToCss(styles: ElementStyle): string {
    const map: Record<string, string> = {
      fontSize: 'font-size', fontWeight: 'font-weight', color: 'color',
      backgroundColor: 'background-color', textAlign: 'text-align', padding: 'padding',
      margin: 'margin', borderRadius: 'border-radius', border: 'border',
      width: 'width', height: 'height'
    };
    const parts: string[] = [];
    for (const [key, cssKey] of Object.entries(map)) {
      const val = (styles as any)[key];
      if (val) parts.push(`${cssKey}: ${val}`);
    }
    return parts.join('; ');
  }
}
