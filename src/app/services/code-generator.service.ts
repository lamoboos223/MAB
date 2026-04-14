import { Injectable } from '@angular/core';
import { Page } from '../models/page.model';
import { BuilderElement, ElementStyle, VisibilityCondition } from '../models/element.model';
import { PartnerTheme } from '../models/partner-theme.model';

@Injectable({ providedIn: 'root' })
export class CodeGeneratorService {

  /** Get all conditions for an element (migrates old single to array) */
  private getConditions(el: BuilderElement): VisibilityCondition[] {
    if (el.visibilityConditions?.length) return el.visibilityConditions;
    if (el.visibilityCondition) return [{ ...el.visibilityCondition, behavior: el.visibilityCondition.behavior || (el.visibilityCondition.source === 'geofence' ? 'enable_disable' : 'show_hide') }];
    return [];
  }

  private hasI18nElements(pages: Page[]): boolean {
    return pages.some(p => p.elements.some(e => e.i18nEnabled));
  }

  generatePages(pages: Page[], partnerTheme: PartnerTheme | null = null): { fileName: string; html: string }[] {
    return pages.map((page, index) => ({
      fileName: index === 0 ? 'index.html' : `page${index + 1}.html`,
      html: this.generateHtml(page, pages, partnerTheme)
    }));
  }

  generateCss(pages: Page[], themeMode: 'light' | 'dark' | 'auto' = 'auto', partnerTheme: PartnerTheme | null = null): string {
    const hasI18n = this.hasI18nElements(pages);

    const dark = {
      bg: '#0f0f11', text: '#fafafa', textSecondary: '#d4d4d8', textMuted: '#a1a1aa',
      inputBg: '#18181b', inputBorder: '#3f3f46', border: '#27272a',
      accent: '#1b7a5f', accentHover: '#114b47',
      dropdownTriggerBg: 'rgba(255,255,255,0.06)', dropdownPanelBg: '#1e1e22',
      dropdownHoverBg: 'rgba(255,255,255,0.08)', dropdownActiveBg: 'rgba(255,255,255,0.12)',
    };
    const light = {
      bg: '#ffffff', text: '#18181b', textSecondary: '#52525b', textMuted: '#a1a1aa',
      inputBg: '#ffffff', inputBorder: '#d4d4d8', border: '#e4e4e7',
      accent: '#114b47', accentHover: '#0d3a37',
      dropdownTriggerBg: 'rgba(0,0,0,0.02)', dropdownPanelBg: '#ffffff',
      dropdownHoverBg: 'rgba(0,0,0,0.04)', dropdownActiveBg: 'rgba(0,0,0,0.06)',
    };

    if (partnerTheme?.accent) {
      dark.accent = partnerTheme.accent;
      light.accent = partnerTheme.accent;
    }
    if (partnerTheme?.accentHover) {
      dark.accentHover = partnerTheme.accentHover;
      light.accentHover = partnerTheme.accentHover;
    }

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

    const fontImport = partnerTheme?.fontUrl ? `@import url("${partnerTheme.fontUrl}");\n` : '';

    let css = `${fontImport}* { margin: 0; padding: 0; box-sizing: border-box; }
${themeBlock}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  background: var(--bg); color: var(--text); padding: 16px;
  line-height: 1.5; position: relative; min-height: 100vh;
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
button.active { background: var(--accent-hover); box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); }
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
.map-container { width: 100%; border-radius: 10px; overflow: hidden; position: relative; }
.map-container iframe { width: 100%; height: 250px; border: 0; }
.map-interaction-blocker { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
.map-geofence-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
.map-zoom-controls { position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 4px; z-index: 3; }
.map-zoom-btn { width: 32px; height: 32px; border-radius: 4px; border: none; background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.3); font-size: 18px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #333; padding: 0; }
.map-zoom-btn:active { background: #e0e0e0; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
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
.img-picker--compact { display: inline-flex; flex-direction: column; }
.img-picker__trigger--compact { width: 100%; height: 100%; padding: 0; border: 1px solid var(--input-border); border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--input-bg); cursor: pointer; transition: background-color 0.2s; box-sizing: border-box; }
.img-picker__trigger--compact:hover, .img-picker__trigger--compact:active { background-color: var(--dropdown-hover-bg); }
/* Toast */
.toast { position: fixed; bottom: -60px; left: 50%; transform: translateX(-50%); background: #ef4444; color: white; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 500; z-index: 2000; transition: bottom 0.3s ease; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
.toast--success { background: #22c55e; }
.toast--visible { bottom: 40px; }
`;

    css += `.data-table { width: 100%; border-collapse: collapse; }\n`;
    css += `.data-table th, .data-table td { padding: 8px 12px; border: 1px solid var(--border, #e4e4e7); text-align: left; font-size: 14px; }\n`;
    css += `.data-table th { background: rgba(0,0,0,0.03); font-weight: 600; }\n`;
    css += `.container-block { box-sizing: border-box; }\n`;

    if (hasI18n) {
      css += `[dir="rtl"] { font-family: 'Arial', -apple-system, sans-serif; }\n`;
      css += `[dir="rtl"] select, [dir="rtl"] input { text-align: right; }\n`;
    }

    css += `.partner-header { display: flex; align-items: center; gap: 10px; padding: 10px 0 18px; }\n`;
    css += `.partner-header img { max-height: 36px; width: auto; border-radius: 0; }\n`;
    css += `.partner-header__name { font-size: 14px; font-weight: 600; color: var(--text); letter-spacing: 0.2px; }\n`;

    if (partnerTheme?.fontFamily) {
      const ff = partnerTheme.fontFamily.replace(/"/g, '\\"');
      css += `body, button, input, select, textarea { font-family: ${ff} !important; }\n`;
    }

    if (partnerTheme?.borderRadius) {
      const r = partnerTheme.borderRadius;
      css += `:root { --radius: ${r}; }\n`;
      css += `button, input[type="text"], input[type="number"], input[type="email"], input[type="tel"], textarea, select, .date-picker-trigger, .custom-dropdown__trigger, img { border-radius: ${r} !important; }\n`;
    }

    if (partnerTheme?.accentSecondary) {
      const c = partnerTheme.accentSecondary;
      css += `:root { --accent-secondary: ${c}; }\n`;
      css += `button.active, button:active { background: ${c} !important; }\n`;
      css += `input[type="radio"]:checked, input[type="checkbox"]:checked { accent-color: ${c}; }\n`;
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

  generateJs(pages: Page[], themeMode: 'light' | 'dark' | 'auto' = 'auto', secretKey: string = '', debugMode: boolean = false, debugTarget: 'preview' | 'standalone' = 'preview'): string {
    const hasI18n = this.hasI18nElements(pages);
    const needsDeviceInfo = themeMode === 'auto' || hasI18n;
    const hasRequiredFields = pages.some(p => p.elements.some(e => e.type === 'input' && e.settings['required'] === 'true'));
    const hasSubmit = pages.some(p => p.elements.some(e => e.type === 'button' && e.submitConfig));
    let js = '';

    if (debugMode) {
      js += `// Debug mode\n`;
      js += `var __origConsoleError = console.error.bind(console);\n`;

      if (debugTarget === 'standalone') {
        // On-screen debug panel for exported ZIP
        js += `(function() {\n`;
        js += `  var panel = document.createElement('div');\n`;
        js += `  panel.id = '__debug_panel';\n`;
        js += `  panel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;max-height:40vh;overflow-y:auto;background:rgba(0,0,0,0.92);color:#0f0;font-family:monospace;font-size:11px;z-index:99999;padding:0;display:none;border-top:2px solid #0f0;';\n`;
        js += `  var header = document.createElement('div');\n`;
        js += `  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:6px 10px;position:sticky;top:0;background:rgba(0,0,0,0.95);border-bottom:1px solid #333;';\n`;
        js += `  header.innerHTML = '<span style=\"color:#0f0;font-weight:bold;\">DEBUG</span><div><button id=\"__debug_clear\" style=\"background:none;border:1px solid #555;color:#aaa;padding:2px 8px;border-radius:4px;font-size:10px;margin-right:4px;cursor:pointer;\">Clear</button><button id=\"__debug_close\" style=\"background:none;border:1px solid #555;color:#aaa;padding:2px 8px;border-radius:4px;font-size:10px;cursor:pointer;\">Close</button></div>';\n`;
        js += `  panel.appendChild(header);\n`;
        js += `  var logs = document.createElement('div');\n`;
        js += `  logs.id = '__debug_logs';\n`;
        js += `  logs.style.cssText = 'padding:6px 10px;';\n`;
        js += `  panel.appendChild(logs);\n`;
        js += `  document.body.appendChild(panel);\n`;
        js += `  var btn = document.createElement('button');\n`;
        js += `  btn.id = '__debug_toggle';\n`;
        js += `  btn.textContent = 'DBG';\n`;
        js += `  btn.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:100000;background:#111;color:#0f0;border:1px solid #0f0;border-radius:50%;width:40px;height:40px;font-size:10px;font-weight:bold;font-family:monospace;cursor:pointer;';\n`;
        js += `  document.body.appendChild(btn);\n`;
        js += `  btn.onclick = function() { panel.style.display = panel.style.display === 'none' ? 'block' : 'none'; };\n`;
        js += `  document.getElementById('__debug_clear').onclick = function() { logs.innerHTML = ''; };\n`;
        js += `  document.getElementById('__debug_close').onclick = function() { panel.style.display = 'none'; };\n`;
        js += `})();\n`;
        js += `function debugLog(msg, err) {\n`;
        js += `  __origConsoleError(msg, err || '');\n`;
        js += `  var el = document.getElementById('__debug_logs');\n`;
        js += `  if (!el) return;\n`;
        js += `  var line = document.createElement('div');\n`;
        js += `  line.style.cssText = 'padding:3px 0;border-bottom:1px solid #222;word-break:break-all;';\n`;
        js += `  var t = new Date().toLocaleTimeString();\n`;
        js += `  line.innerHTML = '<span style=\"color:#666;\">' + t + '</span> ' + msg + (err ? ' <span style=\"color:#f44;\">' + err + '</span>' : '');\n`;
        js += `  el.appendChild(line);\n`;
        js += `  el.parentElement.scrollTop = el.parentElement.scrollHeight;\n`;
        js += `}\n`;
      } else {
        // Preview mode — relay to parent iframe
        js += `function debugLog(msg, err) {\n`;
        js += `  __origConsoleError(msg, err || '');\n`;
        js += `  window.parent.postMessage({ type: 'debug-log', message: '' + msg, error: err ? '' + (err.message || err) : '' }, '*');\n`;
        js += `}\n`;
      }

      js += `window.onerror = function(msg, src, line, col, err) { debugLog('Uncaught: ' + msg, err); };\n`;
      js += `window.addEventListener('unhandledrejection', function(e) { debugLog('Unhandled Promise', e.reason); });\n\n`;

      if (debugTarget === 'standalone') {
        // CORS-safe fetch wrapper — retries without preflight on failure
        js += `var __origFetch = window.fetch.bind(window);\n`;
        js += `window.fetch = function(url, opts) {\n`;
        js += `  return __origFetch(url, opts).catch(function(err) {\n`;
        js += `    if (!err.message || (err.message.indexOf('Failed to fetch') === -1 && err.message.indexOf('NetworkError') === -1)) throw err;\n`;
        js += `    debugLog('[CORS] Preflight blocked, retrying without preflight: ' + url);\n`;
        js += `    var safeOpts = Object.assign({}, opts);\n`;
        js += `    var h = {};\n`;
        js += `    if (opts && opts.headers) { for (var k in opts.headers) { h[k] = opts.headers[k]; } }\n`;
        js += `    if (h['Content-Type'] && h['Content-Type'].indexOf('application/json') !== -1) {\n`;
        js += `      h['Content-Type'] = 'text/plain';\n`;
        js += `    }\n`;
        js += `    safeOpts.headers = h;\n`;
        js += `    return __origFetch(url, safeOpts);\n`;
        js += `  });\n`;
        js += `};\n\n`;
      }

      if (debugTarget === 'preview') {
        // Proxy fetch through parent to avoid CORS issues in preview iframe
        js += `// Fetch proxy — relay through parent window to avoid CORS\n`;
        js += `var __fetchId = 0;\n`;
        js += `var __fetchCallbacks = {};\n`;
        js += `window.addEventListener('message', function(e) {\n`;
        js += `  if (e.data && e.data.type === 'fetch-response' && __fetchCallbacks[e.data.id]) {\n`;
        js += `    __fetchCallbacks[e.data.id](e.data);\n`;
        js += `    delete __fetchCallbacks[e.data.id];\n`;
        js += `  }\n`;
        js += `});\n`;
        js += `function __proxyFetch(url, opts) {\n`;
        js += `  var id = ++__fetchId;\n`;
        js += `  return new Promise(function(resolve, reject) {\n`;
        js += `    __fetchCallbacks[id] = function(data) {\n`;
        js += `      if (data.error) { reject(new Error(data.error)); }\n`;
        js += `      else { resolve({ ok: data.ok, status: data.status, text: function() { return Promise.resolve(data.body); }, json: function() { return Promise.resolve(JSON.parse(data.body)); } }); }\n`;
        js += `    };\n`;
        js += `    window.parent.postMessage({ type: 'fetch-request', id: id, url: url, method: (opts && opts.method) || 'GET', headers: (opts && opts.headers) || {}, body: (opts && opts.body) || null }, '*');\n`;
        js += `  });\n`;
        js += `}\n\n`;
      }
    }

    if (hasSubmit) {
      js += `// Timeout helper\n`;
      js += `function withTimeout(promise, ms, label) {\n`;
      js += `  return Promise.race([\n`;
      js += `    promise,\n`;
      js += `    new Promise(function(_, reject) { setTimeout(function() { reject(new Error(label + ' timed out after ' + ms + 'ms')); }, ms); })\n`;
      js += `  ]);\n`;
      js += `}\n\n`;
      js += `function showToast(msg, type) {\n`;
      js += `  var t = document.createElement('div'); t.className = 'toast' + (type === 'success' ? ' toast--success' : ''); t.textContent = msg;\n`;
      js += `  document.body.appendChild(t);\n`;
      js += `  setTimeout(function() { t.classList.add('toast--visible'); }, 10);\n`;
      js += `  setTimeout(function() { t.classList.remove('toast--visible'); setTimeout(function() { t.remove(); }, 300); }, 3000);\n`;
      js += `}\n\n`;
    }

    const hasConditions = pages.some(p => p.elements.some(e => this.getConditions(e).length > 0));

    js += `document.addEventListener('DOMContentLoaded', function() {\n`;

    // Map zoom controls and geofence circle rendering
    const allMapElements = pages.flatMap(p => p.elements).filter(e => e.type === 'map');
    const allGeofenceConds: VisibilityCondition[] = [];
    for (const p of pages) {
      for (const e of p.elements) {
        for (const c of this.getConditions(e)) {
          if (c.source === 'geofence') allGeofenceConds.push(c);
        }
      }
    }
    if (allMapElements.length > 0) {
      js += `  // Map zoom and geofence circles\n`;
      if (allGeofenceConds.length > 0) {
        js += `  var __geofences = [\n`;
        for (const vc of allGeofenceConds) {
          js += `    { lat: ${vc.geofenceLat || '24.7136'}, lng: ${vc.geofenceLng || '46.6753'}, radius: ${vc.geofenceRadius || '500'} },\n`;
        }
        js += `  ];\n`;
        js += `  function drawGeofenceCircles(mapId) {\n`;
        js += `    var container = document.getElementById(mapId);\n`;
        js += `    var svg = document.getElementById(mapId + '-svg');\n`;
        js += `    if (!container || !svg) return;\n`;
        js += `    var mapLat = parseFloat(container.getAttribute('data-lat'));\n`;
        js += `    var mapLng = parseFloat(container.getAttribute('data-lng'));\n`;
        js += `    var zoom = parseFloat(container.getAttribute('data-zoom'));\n`;
        js += `    var w = container.offsetWidth;\n`;
        js += `    var h = container.offsetHeight || 250;\n`;
        js += `    var metersPerPx = 156543.03 * Math.cos(mapLat * Math.PI / 180) / Math.pow(2, zoom);\n`;
        js += `    var circles = '';\n`;
        js += `    __geofences.forEach(function(gf) {\n`;
        js += `      var r = gf.radius / metersPerPx;\n`;
        js += `      var dx = (gf.lng - mapLng) * 111320 * Math.cos(mapLat * Math.PI / 180) / metersPerPx;\n`;
        js += `      var dy = (gf.lat - mapLat) * 110574 / metersPerPx;\n`;
        js += `      var cx = w / 2 + dx;\n`;
        js += `      var cy = h / 2 - dy;\n`;
        js += `      circles += '<circle cx=\"' + cx.toFixed(1) + '\" cy=\"' + cy.toFixed(1) + '\" r=\"' + r.toFixed(1) + '\" fill=\"rgba(66,133,244,0.15)\" stroke=\"rgba(66,133,244,0.8)\" stroke-width=\"2\"/>';\n`;
        js += `    });\n`;
        js += `    svg.innerHTML = circles;\n`;
        js += `  }\n`;
      }
      js += `  function updateMapZoom(mapId, dir) {\n`;
      js += `    var container = document.getElementById(mapId);\n`;
      js += `    if (!container) return;\n`;
      js += `    var z = parseInt(container.getAttribute('data-zoom'), 10);\n`;
      js += `    z = dir === 'in' ? Math.min(z + 1, 20) : Math.max(z - 1, 1);\n`;
      js += `    container.setAttribute('data-zoom', z);\n`;
      js += `    var lat = container.getAttribute('data-lat');\n`;
      js += `    var lng = container.getAttribute('data-lng');\n`;
      js += `    var iframe = document.getElementById(mapId + '-iframe');\n`;
      js += `    if (iframe) iframe.src = 'https://maps.google.com/maps?q=' + lat + ',' + lng + '&z=' + z + '&output=embed';\n`;
      if (allGeofenceConds.length > 0) {
        js += `    drawGeofenceCircles(mapId);\n`;
      }
      js += `  }\n`;
      js += `  document.querySelectorAll('.map-zoom-btn').forEach(function(btn) {\n`;
      js += `    btn.addEventListener('click', function() { updateMapZoom(btn.getAttribute('data-map'), btn.getAttribute('data-dir')); });\n`;
      js += `  });\n`;
      if (allGeofenceConds.length > 0) {
        for (const mapEl of allMapElements) {
          js += `  drawGeofenceCircles('${mapEl.id}');\n`;
        }
      }
      js += `\n`;
    }

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

    if (hasConditions) {
      js += `  // Visibility condition evaluation\n`;
      js += `  function evalCondition(cond) {\n`;
      js += `    var val = '';\n`;
      js += `    if (cond.source === 'element' && cond.elementId) {\n`;
      js += `      var srcEl = document.getElementById(cond.elementId);\n`;
      js += `      if (srcEl) {\n`;
      js += `        if (srcEl.tagName === 'INPUT' || srcEl.tagName === 'TEXTAREA' || srcEl.tagName === 'SELECT') val = srcEl.value;\n`;
      js += `        else if (srcEl.querySelector('.custom-dropdown__value')) val = srcEl.querySelector('.custom-dropdown__value').value;\n`;
      js += `        else if (srcEl.querySelector('input[type="radio"]:checked')) val = srcEl.querySelector('input[type="radio"]:checked').value;\n`;
      js += `        else if (srcEl.querySelectorAll('input[type="checkbox"]:checked').length) val = Array.from(srcEl.querySelectorAll('input[type="checkbox"]:checked')).map(function(c){return c.value}).join(',');\n`;
      js += `        else val = srcEl.textContent || '';\n`;
      js += `      }\n`;
      js += `    }\n`;
      js += `    var op = cond.operator, cv = cond.value || '';\n`;
      js += `    if (op === 'button_active' || op === 'button_not_active') {\n`;
      js += `      var btn = cond.elementId ? document.getElementById(cond.elementId) : null;\n`;
      js += `      var isActive = btn && btn.getAttribute('data-active') === 'true';\n`;
      js += `      return op === 'button_active' ? isActive : !isActive;\n`;
      js += `    }\n`;
      js += `    switch(op) {\n`;
      js += `      case 'equals': return val === cv;\n`;
      js += `      case 'not_equals': return val !== cv;\n`;
      js += `      case 'contains': return val.indexOf(cv) >= 0;\n`;
      js += `      case 'empty': return !val || !val.trim();\n`;
      js += `      case 'not_empty': return !!val && !!val.trim();\n`;
      js += `      case 'greater_than': return parseFloat(val) > parseFloat(cv);\n`;
      js += `      case 'less_than': return parseFloat(val) < parseFloat(cv);\n`;
      js += `      default: return true;\n`;
      js += `    }\n`;
      js += `  }\n`;
      js += `  function applyConditions(el) {\n`;
      js += `    try {\n`;
      js += `      var conds = JSON.parse(el.getAttribute('data-conditions') || '[]');\n`;
      js += `      var shouldShow = true, shouldEnable = true;\n`;
      js += `      for (var i = 0; i < conds.length; i++) {\n`;
      js += `        var c = conds[i];\n`;
      js += `        if (c.source === 'geofence') continue;\n`;
      js += `        var pass = evalCondition(c);\n`;
      js += `        if (c.behavior === 'enable_disable') { if (!pass) shouldEnable = false; }\n`;
      js += `        else { if (!pass) shouldShow = false; }\n`;
      js += `      }\n`;
      js += `      el.style.display = shouldShow ? '' : 'none';\n`;
      js += `      var interactable = el.querySelector('button, input, select, textarea, [type=\"submit\"]');\n`;
      js += `      if (interactable) {\n`;
      js += `        interactable.disabled = !shouldEnable;\n`;
      js += `        interactable.style.opacity = shouldEnable ? '' : '0.5';\n`;
      js += `        interactable.style.cursor = shouldEnable ? '' : 'not-allowed';\n`;
      js += `      }\n`;
      js += `    } catch(e) {}\n`;
      js += `  }\n`;
      js += `  function checkConditions() {\n`;
      js += `    document.querySelectorAll('[data-conditions]').forEach(applyConditions);\n`;
      js += `  }\n`;
      js += `  document.addEventListener('input', checkConditions);\n`;
      js += `  document.addEventListener('change', checkConditions);\n`;

      // Evaluate function-based conditions on page load
      const processedFunctions = new Set<string>();
      for (const page of pages) {
        for (const el of page.elements) {
          for (const cond of this.getConditions(el)) {
            if (cond.source === 'function' && cond.functionBinding && !processedFunctions.has(cond.functionBinding.functionName)) {
              processedFunctions.add(cond.functionBinding.functionName);
              const b = cond.functionBinding;
              const params = Object.values(b.params).filter(v => v).map(v => `'${v}'`).join(', ');
              js += `  TWK.${b.functionName}(${params}).then(function(data) {\n`;
              js += `    checkConditions();\n`;
              js += `  }).catch(function(err) { console.error('Condition ${b.functionName}:', err); });\n`;
            }
          }
        }
      }

      js += `  checkConditions();\n`;

      // Geofence conditions
      const hasGeofence = allGeofenceConds.length > 0;
      if (hasGeofence) {
        js += `  // Geofence evaluation\n`;
        js += `  function haversineDistance(lat1, lon1, lat2, lon2) {\n`;
        js += `    var R = 6371e3;\n`;
        js += `    var toRad = function(d) { return d * Math.PI / 180; };\n`;
        js += `    var dLat = toRad(lat2 - lat1);\n`;
        js += `    var dLon = toRad(lon2 - lon1);\n`;
        js += `    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);\n`;
        js += `    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));\n`;
        js += `  }\n`;
        js += `  function applyGeofence(userLat, userLng) {\n`;
        js += `    debugLog('[Geofence] User location: ' + userLat + ', ' + userLng);\n`;
        js += `    document.querySelectorAll('[data-conditions]').forEach(function(el) {\n`;
        js += `      try {\n`;
        js += `        var conds = JSON.parse(el.getAttribute('data-conditions') || '[]');\n`;
        js += `        var shouldShow = true, shouldEnable = true;\n`;
        js += `        for (var i = 0; i < conds.length; i++) {\n`;
        js += `          var c = conds[i];\n`;
        js += `          if (c.source === 'geofence') {\n`;
        js += `            var dist = haversineDistance(userLat, userLng, parseFloat(c.geofenceLat), parseFloat(c.geofenceLng));\n`;
        js += `            var radius = parseFloat(c.geofenceRadius) || 500;\n`;
        js += `            var inside = dist <= radius;\n`;
        js += `            var pass = c.operator === 'equals' ? inside : !inside;\n`;
        js += `            debugLog('[Geofence] dist=' + dist.toFixed(1) + 'm, radius=' + radius + 'm, inside=' + inside + ', pass=' + pass + ', behavior=' + c.behavior);\n`;
        js += `            if (c.behavior === 'enable_disable') { if (!pass) shouldEnable = false; }\n`;
        js += `            else { if (!pass) shouldShow = false; }\n`;
        js += `          } else {\n`;
        js += `            var pass2 = evalCondition(c);\n`;
        js += `            if (c.behavior === 'enable_disable') { if (!pass2) shouldEnable = false; }\n`;
        js += `            else { if (!pass2) shouldShow = false; }\n`;
        js += `          }\n`;
        js += `        }\n`;
        js += `        el.style.display = shouldShow ? '' : 'none';\n`;
        js += `        var interactable = el.querySelector('button, input, select, textarea, [type=\"submit\"]');\n`;
        js += `        if (interactable) {\n`;
        js += `          interactable.disabled = !shouldEnable;\n`;
        js += `          interactable.style.opacity = shouldEnable ? '' : '0.5';\n`;
        js += `          interactable.style.cursor = shouldEnable ? '' : 'not-allowed';\n`;
        js += `        }\n`;
        js += `      } catch(e) { debugLog('[Geofence] Error processing element:', e); }\n`;
        js += `    });\n`;
        js += `  }\n`;
        js += `  // Try TWK first, fallback to browser Geolocation API\n`;
        js += `  if (typeof TWK !== 'undefined' && TWK.getUserLocation) {\n`;
        js += `    debugLog('[Geofence] Using TWK.getUserLocation');\n`;
        js += `    TWK.getUserLocation().then(function(data) {\n`;
        js += `      debugLog('[Geofence] TWK response: ' + JSON.stringify(data).substring(0, 200));\n`;
        js += `      var loc = data.result || data;\n`;
        js += `      if (!loc) { debugLog('[Geofence] No location in response'); return; }\n`;
        js += `      if (loc.location) loc = loc.location;\n`;
        js += `      var userLat = parseFloat(loc.latitude || loc.lat);\n`;
        js += `      var userLng = parseFloat(loc.longitude || loc.lng);\n`;
        js += `      if (isNaN(userLat) || isNaN(userLng)) { debugLog('[Geofence] Invalid coords: ' + JSON.stringify(loc)); return; }\n`;
        js += `      applyGeofence(userLat, userLng);\n`;
        js += `    }).catch(function(err) { debugLog('[Geofence] TWK.getUserLocation failed:', err); });\n`;
        js += `  } else if (navigator.geolocation) {\n`;
        js += `    debugLog('[Geofence] Using browser Geolocation API');\n`;
        js += `    navigator.geolocation.getCurrentPosition(function(pos) {\n`;
        js += `      applyGeofence(pos.coords.latitude, pos.coords.longitude);\n`;
        js += `    }, function(err) { debugLog('[Geofence] Browser geolocation failed:', err.message); });\n`;
        js += `  } else {\n`;
        js += `    debugLog('[Geofence] No location API available');\n`;
        js += `  }\n`;
      }
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
          } else if (el.type === 'input') {
            js += `  ${call}.then(function(data) {\n`;
            js += `    var inp = document.getElementById('${el.id}');\n`;
            js += `    inp.value = data.${b.resultPath};\n`;
            js += `    inp.setAttribute('readonly', 'true');\n`;
            js += `  }).catch(function(err) { console.error('${b.functionName}:', err); });\n\n`;
          } else if (el.type === 'image') {
            js += `  ${call}.then(function(data) {\n`;
            js += `    document.getElementById('${el.id}').src = data.${b.resultPath};\n`;
            js += `  }).catch(function(err) { console.error('${b.functionName}:', err); });\n\n`;
          } else if (el.type === 'map') {
            js += `  ${call}.then(function(data) {\n`;
            js += `    var loc = data.${b.resultPath};\n`;
            js += `    if (loc.location) loc = loc.location;\n`;
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
          } else if (el.type === 'table') {
            js += `  ${call}.then(function(data) {\n`;
            js += `    var items = data.${b.resultPath};\n`;
            js += `    var table = document.getElementById('${el.id}');\n`;
            js += `    if (!table || !Array.isArray(items)) return;\n`;
            js += `    var hasHeader = ${el.settings['headerRow'] === 'true'};\n`;
            js += `    var html = '';\n`;
            js += `    items.forEach(function(row, i) {\n`;
            js += `      if (!Array.isArray(row)) row = Object.values(row);\n`;
            js += `      if (i === 0 && hasHeader) {\n`;
            js += `        html += '<thead><tr>' + row.map(function(c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead>';\n`;
            js += `      } else {\n`;
            js += `        html += '<tr>' + row.map(function(c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';\n`;
            js += `      }\n`;
            js += `    });\n`;
            js += `    table.innerHTML = html;\n`;
            js += `  }).catch(function(err) { console.error('${b.functionName}:', err); });\n\n`;
          }
        }

        // Toggle button handler
        if (el.type === 'button' && el.settings['toggleable'] === 'true') {
          const group = el.settings['toggleGroup'] || '';
          js += `  // Toggle button: ${el.id}\n`;
          js += `  (function() {\n`;
          js += `    var btn = document.getElementById('${el.id}');\n`;
          js += `    if (!btn) return;\n`;
          js += `    btn.setAttribute('data-active', 'false');\n`;
          if (group) {
            js += `    btn.setAttribute('data-toggle-group', '${group}');\n`;
          }
          js += `    btn.addEventListener('click', function() {\n`;
          js += `      var isActive = btn.getAttribute('data-active') === 'true';\n`;
          if (group) {
            js += `      if (!isActive) {\n`;
            js += `        document.querySelectorAll('[data-toggle-group="${group}"]').forEach(function(other) {\n`;
            js += `          other.setAttribute('data-active', 'false');\n`;
            js += `          other.classList.remove('active');\n`;
            js += `        });\n`;
            js += `      }\n`;
          }
          js += `      btn.setAttribute('data-active', String(!isActive));\n`;
          js += `      btn.classList.toggle('active');\n`;
          if (hasConditions) {
            js += `      checkConditions();\n`;
          }
          js += `    });\n`;
          js += `  })();\n\n`;
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
              js += `    var patternFields = document.querySelectorAll('[data-pattern]');\n`;
              js += `    patternFields.forEach(function(field) {\n`;
              js += `      var patternErrorEl = document.getElementById(field.id + '-pattern-error');\n`;
              js += `      var regex = new RegExp(field.getAttribute('data-pattern'));\n`;
              js += `      if (field.value && !regex.test(field.value)) { allValid = false; field.classList.add('input-error'); if (patternErrorEl) patternErrorEl.classList.add('field-error--visible'); }\n`;
              js += `      else { field.classList.remove('input-error'); if (patternErrorEl) patternErrorEl.classList.remove('field-error--visible'); }\n`;
              js += `    });\n`;
              js += `    var lengthFields = document.querySelectorAll('[data-min-length], [data-max-length]');\n`;
              js += `    lengthFields.forEach(function(field) {\n`;
              js += `      if (field.getAttribute('data-twk-set') === 'true') return;\n`;
              js += `      var lengthErrorEl = document.getElementById(field.id + '-length-error');\n`;
              js += `      var minLen = field.getAttribute('data-min-length');\n`;
              js += `      var maxLen = field.getAttribute('data-max-length');\n`;
              js += `      var len = (field.value || '').length;\n`;
              js += `      var invalid = false;\n`;
              js += `      if (minLen && len < parseInt(minLen, 10) && len > 0) invalid = true;\n`;
              js += `      if (maxLen && len > parseInt(maxLen, 10)) invalid = true;\n`;
              js += `      if (invalid) { allValid = false; field.classList.add('input-error'); if (lengthErrorEl) lengthErrorEl.classList.add('field-error--visible'); }\n`;
              js += `      else { field.classList.remove('input-error'); if (lengthErrorEl) lengthErrorEl.classList.remove('field-error--visible'); }\n`;
              js += `    });\n`;
              js += `    if (!allValid) return;\n`;
            }
            js += `    var btn = this;\n`;
            js += `    var originalText = btn.textContent;\n`;
            js += `    btn.disabled = true; btn.textContent = 'Submitting...';\n`;
            const method = cfg.method || 'POST';
            js += `    try {\n`;
            if (method !== 'GET') {
            // Build field values for template substitution
            js += `      var __fields = {};\n`;
            for (const m of cfg.fieldMappings) {
              const varName = m.elementId.replace(/-/g, '_');
              if (m.source === 'input') {
                js += `      var f_${varName} = document.getElementById('${m.elementId}');\n`;
                js += `      __fields['${m.keyName}'] = f_${varName} ? f_${varName}.value : '';\n`;
              } else if (m.source === 'dropdown') {
                js += `      var f_${varName} = document.querySelector('#${m.elementId} .custom-dropdown__value');\n`;
                js += `      __fields['${m.keyName}'] = f_${varName} ? (f_${varName}.value || '') : '';\n`;
              } else if (m.source === 'radio') {
                const srcEl = pages.flatMap(p => p.elements).find(e => e.id === m.elementId);
                const radioName = srcEl?.settings['groupName'] || m.elementId;
                js += `      var f_${varName} = document.querySelector('input[name="${radioName}"]:checked');\n`;
                js += `      __fields['${m.keyName}'] = f_${varName} ? f_${varName}.value : '';\n`;
              } else if (m.source === 'checkbox') {
                js += `      var f_${varName} = document.querySelectorAll('#${m.elementId} input[type="checkbox"]:checked');\n`;
                js += `      __fields['${m.keyName}'] = JSON.stringify(Array.from(f_${varName}).map(function(c) { return c.value; }));\n`;
              } else if (m.source === 'date-picker') {
                js += `      var f_${varName} = document.querySelector('#${m.elementId} .date-picker-trigger__text');\n`;
                js += `      __fields['${m.keyName}'] = f_${varName} && !f_${varName}.classList.contains('date-picker-trigger__text--placeholder') ? f_${varName}.textContent : '';\n`;
              } else if (m.source === 'media-select') {
                js += `      var f_${varName} = document.querySelectorAll('#${m.elementId} .img-picker__item img, #${m.elementId} .img-picker__item video');\n`;
                js += `      __fields['${m.keyName}'] = JSON.stringify(Array.from(f_${varName}).map(function(m) { return m.src; }));\n`;
              } else if (m.source === 'map') {
                js += `      var f_${varName} = document.querySelector('#${m.elementId} iframe');\n`;
                js += `      if (f_${varName}) { var src = f_${varName}.getAttribute('src') || ''; var match = src.match(/q=([\\d.-]+),([\\d.-]+)/); __fields['${m.keyName}'] = match ? JSON.stringify({ lat: parseFloat(match[1]), lng: parseFloat(match[2]) }) : 'null'; }\n`;
                js += `      else { __fields['${m.keyName}'] = 'null'; }\n`;
              } else if (m.source === 'dynamic') {
                const srcEl = pages.flatMap(p => p.elements).find(e => e.id === m.elementId);
                if (srcEl?.dynamicBinding) {
                  const b = srcEl.dynamicBinding;
                  const params = Object.values(b.params).filter(v => v).map(v => `'${v}'`).join(', ');
                  js += `      var dyn_${varName} = await TWK.${b.functionName}(${params});\n`;
                  js += `      __fields['${m.keyName}'] = typeof dyn_${varName}.${b.resultPath} === 'string' ? dyn_${varName}.${b.resultPath} : JSON.stringify(dyn_${varName}.${b.resultPath});\n`;
                }
              }
            }
            // Apply template substitution
            const escapedTemplate = JSON.stringify(cfg.payloadTemplate || '{}');
            js += `      var bodyTemplate = ${escapedTemplate};\n`;
            js += `      var body = bodyTemplate.replace(/\\{\\{(\\w+)\\}\\}/g, function(_, key) {\n`;
            js += `        var val = __fields[key];\n`;
            js += `        if (val === undefined) return '{{' + key + '}}';\n`;
            js += `        return val;\n`;
            js += `      });\n`;
            js += `      console.error('[Submit] body:', body);\n`;
            }
            // Build headers
            js += `      var headers = { 'Content-Type': 'application/json' };\n`;
            if (cfg.headers && cfg.headers.length > 0) {
              for (const h of cfg.headers) {
                if (!h.key) continue;
                const escapedVal = JSON.stringify(h.value || '');
                if (h.value.includes('{{')) {
                  js += `      headers[${JSON.stringify(h.key)}] = ${escapedVal}.replace(/\\{\\{(\\w+)\\}\\}/g, function(_, key) { return __fields[key] || ''; });\n`;
                } else {
                  js += `      headers[${JSON.stringify(h.key)}] = ${escapedVal};\n`;
                }
              }
            }
            js += `      console.error('[Submit] headers:', JSON.stringify(headers));\n`;
            js += `      console.error('[Submit] fetching ${cfg.apiUrl}...');\n`;
            if (method === 'GET') {
              js += `      var resp = await withTimeout(fetch('${cfg.apiUrl}', {\n`;
              js += `        method: 'GET',\n`;
              js += `        headers: headers\n`;
              js += `      }), 30000, 'fetch');\n`;
            } else {
              js += `      var resp = await withTimeout(fetch('${cfg.apiUrl}', {\n`;
              js += `        method: '${method}',\n`;
              js += `        headers: headers,\n`;
              js += `        body: body\n`;
              js += `      }), 30000, 'fetch');\n`;
            }
            js += `      console.error('[Submit] response status:', resp.status);\n`;
            js += `      if (!resp.ok) throw new Error('HTTP ' + resp.status);\n`;
            js += `      var respText = await resp.text();\n`;
            js += `      var data = null;\n`;
            js += `      try { data = JSON.parse(respText); } catch(e) { data = respText; }\n`;
            js += `      console.error('[Submit] success:', JSON.stringify(data).substring(0, 200));\n`;
            if (successFile) {
              js += `      window.location.href = '${successFile}';\n`;
            } else {
              js += `      showToast('Submitted successfully!', 'success');\n`;
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
              js += `    var patternFields = document.querySelectorAll('[data-pattern]');\n`;
              js += `    patternFields.forEach(function(field) {\n`;
              js += `      var patternErrorEl = document.getElementById(field.id + '-pattern-error');\n`;
              js += `      var regex = new RegExp(field.getAttribute('data-pattern'));\n`;
              js += `      if (field.value && !regex.test(field.value)) { allValid = false; field.classList.add('input-error'); if (patternErrorEl) patternErrorEl.classList.add('field-error--visible'); }\n`;
              js += `      else { field.classList.remove('input-error'); if (patternErrorEl) patternErrorEl.classList.remove('field-error--visible'); }\n`;
              js += `    });\n`;
              js += `    var lengthFields = document.querySelectorAll('[data-min-length], [data-max-length]');\n`;
              js += `    lengthFields.forEach(function(field) {\n`;
              js += `      if (field.getAttribute('data-twk-set') === 'true') return;\n`;
              js += `      var lengthErrorEl = document.getElementById(field.id + '-length-error');\n`;
              js += `      var minLen = field.getAttribute('data-min-length');\n`;
              js += `      var maxLen = field.getAttribute('data-max-length');\n`;
              js += `      var len = (field.value || '').length;\n`;
              js += `      var invalid = false;\n`;
              js += `      if (minLen && len < parseInt(minLen, 10) && len > 0) invalid = true;\n`;
              js += `      if (maxLen && len > parseInt(maxLen, 10)) invalid = true;\n`;
              js += `      if (invalid) { allValid = false; field.classList.add('input-error'); if (lengthErrorEl) lengthErrorEl.classList.add('field-error--visible'); }\n`;
              js += `      else { field.classList.remove('input-error'); if (lengthErrorEl) lengthErrorEl.classList.remove('field-error--visible'); }\n`;
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
      if (debugTarget === 'preview') {
        js = js.replace(/\bfetch\(/g, '__proxyFetch(');
      }
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

        if (el.type === 'alert' && ar.staticContent) {
          js += `    var el_${el.id.replace(/-/g, '_')} = document.getElementById('${el.id}');\n`;
          js += `    if (el_${el.id.replace(/-/g, '_')}) { var sp = el_${el.id.replace(/-/g, '_')}.querySelector('span'); if (sp) sp.textContent = ${JSON.stringify(ar.staticContent)}; }\n`;
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

  private generateHtml(page: Page, allPages: Page[], partnerTheme: PartnerTheme | null = null): string {
    let body = '';
    if (partnerTheme?.logoUrl) {
      body += `  <div class="partner-header"><img src="${this.escapeHtml(partnerTheme.logoUrl)}" alt="${this.escapeHtml(partnerTheme.name || '')}"/></div>\n`;
    }
    for (const el of page.elements) {
      const conditions = this.getConditions(el);
      const hasShowHide = conditions.some(c => c.behavior === 'show_hide' || (!c.behavior && c.source !== 'geofence'));
      const hasEnableDisable = conditions.some(c => c.behavior === 'enable_disable' || (!c.behavior && c.source === 'geofence'));
      // Elements with only enable_disable conditions start visible; show_hide start hidden
      const hideStyle = conditions.length > 0 && hasShowHide ? 'display:none;' : '';
      const condAttr = conditions.length > 0 ? ` data-conditions="${this.escapeHtml(JSON.stringify(conditions))}"` : '';
      const pos = el.position;
      if (pos) {
        const leftVw = parseFloat((pos.x / CodeGeneratorService.CANVAS_WIDTH * 100).toFixed(2));
        const topVw = parseFloat((pos.y / CodeGeneratorService.CANVAS_WIDTH * 100).toFixed(2));
        body += `  <div style="${hideStyle}position:absolute;left:${leftVw}vw;top:${topVw}vw;max-width:calc(100% - ${leftVw}vw)"${condAttr}>\n  ${this.elementToHtml(el, page.elements, hasEnableDisable)}\n  </div>\n`;
      } else {
        if (conditions.length > 0) {
          body += `  <div${condAttr} style="${hideStyle}">\n  ${this.elementToHtml(el, page.elements, hasEnableDisable)}\n  </div>\n`;
        } else {
          body += this.elementToHtml(el, page.elements) + '\n';
        }
      }
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

  private elementToHtml(el: BuilderElement, pageElements?: BuilderElement[], startDisabled = false): string {
    const elIcon = this.iconHtml(el.settings['icon']);
    switch (el.type) {
      case 'text': {
        const tag = el.settings['headingLevel'] || 'p';
        return `  <${tag} id="${el.id}">${el.dataSource === 'dynamic' ? 'Loading...' : elIcon + this.escapeHtml(el.staticContent)}</${tag}>`;
      }
      case 'button': {
        const disabledAttr = startDisabled ? ' disabled style="opacity:0.5;cursor:not-allowed"' : '';
        return `  <button id="${el.id}"${disabledAttr}>${elIcon}${this.escapeHtml(el.staticContent)}</button>`;
      }
      case 'image':
        return `  <img id="${el.id}" src="${el.staticContent || ''}" alt="${el.settings['alt'] || ''}" style="width:${el.settings['width'] || '100%'}">`;
      case 'input': {
        const h = parseInt(el.settings['inputHeight'] || '0', 10);
        const isArea = h > 40;
        const isRequired = el.settings['required'] === 'true';
        const star = isRequired ? ' <span class="required-star">*</span>' : '';
        const reqAttr = isRequired ? ' required' : '';
        const disabledAttr = el.settings['disabled'] === 'true' ? ' disabled' : '';
        const regexPattern = el.settings['regexPattern'] || '';
        const regexError = el.settings['regexError'] || 'Invalid format';
        const patternAttr = regexPattern ? ` data-pattern="${this.escapeHtml(regexPattern)}" data-pattern-error="${this.escapeHtml(regexError)}"` : '';
        const minLen = el.settings['minLength'] || '';
        const maxLen = el.settings['maxLength'] || '';
        let lengthAttr = '';
        if (minLen) lengthAttr += ` data-min-length="${minLen}"`;
        if (maxLen) lengthAttr += ` data-max-length="${maxLen}"`;
        let defaultLengthMsg = '';
        if (minLen && maxLen) defaultLengthMsg = `Must be between ${minLen} and ${maxLen} characters`;
        else if (minLen) defaultLengthMsg = `Must be at least ${minLen} characters`;
        else if (maxLen) defaultLengthMsg = `Must be at most ${maxLen} characters`;
        const lengthErrorMsg = el.settings['lengthError'] || defaultLengthMsg;
        const label = `  <label class="el-label">${this.escapeHtml(el.settings['label'] || '')}${star}</label>\n`;
        let errorDiv = isRequired ? `\n  <div class="field-error" id="${el.id}-error">This field is required</div>` : '';
        if (regexPattern) {
          errorDiv += `\n  <div class="field-error" id="${el.id}-pattern-error">${this.escapeHtml(regexError)}</div>`;
        }
        if (minLen || maxLen) {
          errorDiv += `\n  <div class="field-error" id="${el.id}-length-error">${this.escapeHtml(lengthErrorMsg)}</div>`;
        }
        let result: string;
        if (isArea) {
          const hVw = parseFloat((h / CodeGeneratorService.CANVAS_WIDTH * 100).toFixed(2));
          result = label + `  <textarea id="${el.id}" placeholder="${this.escapeHtml(el.settings['placeholder'] || '')}" style="height:${hVw}vw"${reqAttr}${patternAttr}${lengthAttr}${disabledAttr}></textarea>${errorDiv}`;
        } else {
          result = label + `  <input id="${el.id}" type="${el.settings['inputType'] || 'text'}" placeholder="${this.escapeHtml(el.settings['placeholder'] || '')}"${reqAttr}${patternAttr}${lengthAttr}${disabledAttr}>${errorDiv}`;
        }
        if (el.settings['hidden'] === 'true') {
          return `  <div style="display:none">${result}</div>`;
        }
        return result;
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
        const locked = el.settings['locked'] !== 'false';
        const geofences = (pageElements || []).filter(e => this.getConditions(e).some(c => c.source === 'geofence'));
        let mapHtml = `  <div class="map-container" id="${el.id}" data-lat="${lat}" data-lng="${lng}" data-zoom="${zoom}">\n`;
        mapHtml += `    <iframe id="${el.id}-iframe" src="https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed"></iframe>\n`;
        if (locked) {
          mapHtml += `    <div class="map-interaction-blocker"></div>\n`;
        }
        if (geofences.length > 0 && locked) {
          mapHtml += `    <svg class="map-geofence-overlay" id="${el.id}-svg"></svg>\n`;
        }
        mapHtml += `    <div class="map-zoom-controls">\n`;
        mapHtml += `      <button type="button" class="map-zoom-btn" data-map="${el.id}" data-dir="in">+</button>\n`;
        mapHtml += `      <button type="button" class="map-zoom-btn" data-map="${el.id}" data-dir="out">&minus;</button>\n`;
        mapHtml += `    </div>\n`;
        mapHtml += `  </div>`;
        return mapHtml;
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
        const isCompact = el.settings['triggerStyle'] === 'compact';
        let html = `  <label class="el-label">${this.escapeHtml(el.settings['label'] || '')}</label>\n`;
        html += `  <div class="img-picker${isCompact ? ' img-picker--compact' : ''}" id="${el.id}">\n`;
        if (isCompact) {
          html += `    <div class="img-picker__trigger img-picker__trigger--compact">\n`;
          html += `      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>\n`;
          html += `    </div>\n`;
        } else {
          html += `    <div class="img-picker__trigger">\n`;
          html += `      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>\n`;
          html += `      <span class="img-picker__text">${this.escapeHtml(el.settings['triggerText'] || 'Tap to add media')}</span>\n`;
          html += `    </div>\n`;
        }
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
      case 'alert': {
        const icon = el.settings['icon'] ? `<i class="pi pi-${el.settings['icon']}" style="flex-shrink:0;font-size:18px;opacity:0.85"></i> ` : '';
        const showIcon = el.settings['showIcon'] !== 'false';
        const style = this.styleObjectToCss(el.styles);
        const styleAttr = style ? ` style="${style};display:flex;align-items:center;gap:10px;border-radius:12px"` : ' style="display:flex;align-items:center;gap:10px;border-radius:12px"';
        return `  <div class="alert" id="${el.id}"${styleAttr}>${showIcon ? icon : ''}<span>${this.escapeHtml(el.staticContent)}</span></div>`;
      }
      case 'table': {
        const hasHeader = el.settings['headerRow'] === 'true';
        const data = el.tableData || [];
        let html = `  <table class="data-table" id="${el.id}">\n`;
        for (let i = 0; i < data.length; i++) {
          if (i === 0 && hasHeader) {
            html += `    <thead><tr>`;
            for (const cell of data[i]) {
              html += `<th>${this.escapeHtml(cell)}</th>`;
            }
            html += `</tr></thead>\n`;
          } else {
            html += `    <tr>`;
            for (const cell of data[i]) {
              html += `<td>${this.escapeHtml(cell)}</td>`;
            }
            html += `</tr>\n`;
          }
        }
        html += `  </table>`;
        return html;
      }
      case 'container': {
        const style = this.styleObjectToCss(el.styles);
        return `  <div class="container-block" id="${el.id}"${style ? ` style="${style}"` : ''}></div>`;
      }
      default:
        return '';
    }
  }

  private escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private static readonly CANVAS_WIDTH = 375;

  private pxToVw(pxValue: string): string {
    const match = pxValue.match(/^(\d+(?:\.\d+)?)px$/);
    if (!match) return pxValue;
    const vw = (parseFloat(match[1]) / CodeGeneratorService.CANVAS_WIDTH * 100);
    return `${parseFloat(vw.toFixed(2))}vw`;
  }

  private styleObjectToCss(styles: ElementStyle): string {
    const map: Record<string, string> = {
      fontSize: 'font-size', fontWeight: 'font-weight', color: 'color',
      backgroundColor: 'background-color', textAlign: 'text-align', padding: 'padding',
      margin: 'margin', borderRadius: 'border-radius', border: 'border',
      width: 'width', height: 'height'
    };
    const responsiveKeys = new Set(['width', 'height', 'fontSize', 'padding', 'margin', 'borderRadius']);
    const parts: string[] = [];
    for (const [key, cssKey] of Object.entries(map)) {
      let val = (styles as any)[key];
      if (!val) continue;
      if (responsiveKeys.has(key)) val = this.pxToVw(val);
      parts.push(`${cssKey}: ${val}`);
    }
    return parts.join('; ');
  }
}
