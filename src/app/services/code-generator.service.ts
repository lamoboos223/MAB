import { Injectable } from '@angular/core';
import { Page } from '../models/page.model';
import { BuilderElement, ElementStyle } from '../models/element.model';

@Injectable({ providedIn: 'root' })
export class CodeGeneratorService {

  generatePages(pages: Page[]): { fileName: string; html: string }[] {
    return pages.map((page, index) => ({
      fileName: index === 0 ? 'index.html' : `page${index + 1}.html`,
      html: this.generateHtml(page, pages)
    }));
  }

  generateCss(pages: Page[], theme: 'dark' | 'light' = 'dark'): string {
    const t = theme === 'light' ? {
      bg: '#ffffff', text: '#18181b', textSecondary: '#52525b', textMuted: '#a1a1aa',
      inputBg: '#ffffff', inputBorder: '#d4d4d8', border: '#e4e4e7',
      accent: '#7c3aed', accentHover: '#6d28d9',
    } : {
      bg: '#0f0f11', text: '#fafafa', textSecondary: '#d4d4d8', textMuted: '#a1a1aa',
      inputBg: '#18181b', inputBorder: '#3f3f46', border: '#27272a',
      accent: '#8b5cf6', accentHover: '#7c3aed',
    };

    let css = `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  background: ${t.bg}; color: ${t.text}; padding: 16px;
  line-height: 1.5;
}
.el-label {
  font-size: 12px; color: ${t.textMuted}; margin-bottom: 6px; display: block;
  font-weight: 500; letter-spacing: 0.3px;
}
select, input[type="text"], input[type="number"], input[type="email"], input[type="tel"] {
  width: 100%; padding: 11px 14px; background: ${t.inputBg}; border: 1px solid ${t.inputBorder};
  color: ${t.text}; border-radius: 8px; font-size: 14px;
  transition: border-color 0.15s; outline: none;
}
select:focus, input:focus { border-color: ${t.accent}; }
button {
  padding: 11px 22px; background: ${t.accent}; color: white; border: none;
  border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer;
  transition: background 0.15s;
}
button:active { background: ${t.accentHover}; }
img { max-width: 100%; border-radius: 10px; }
hr { border: none; border-top: 1px solid ${t.border}; margin: 14px 0; }
.radio-group label, .checkbox-group label {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0; color: ${t.textSecondary}; font-size: 14px;
}
input[type="radio"], input[type="checkbox"] { accent-color: ${t.accent}; }
.map-container { width: 100%; border-radius: 10px; overflow: hidden; }
.map-container iframe { width: 100%; height: 250px; border: 0; }
`;

    for (const page of pages) {
      for (const el of page.elements) {
        const styles = this.styleObjectToCss(el.styles);
        if (styles) {
          css += `#${el.id} { ${styles} }\n`;
        }
      }
    }
    return css;
  }

  generateJs(pages: Page[]): string {
    let js = `document.addEventListener('DOMContentLoaded', function() {\n`;

    for (const page of pages) {
      for (const el of page.elements) {
        // Auto-load dynamic bindings for display elements
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

        // Button click handlers
        if (el.type === 'button') {
          if (el.pageNavigateTo) {
            const targetIndex = pages.findIndex(p => p.id === el.pageNavigateTo);
            if (targetIndex >= 0) {
              const targetFile = targetIndex === 0 ? 'index.html' : `page${targetIndex + 1}.html`;
              js += `  document.getElementById('${el.id}').addEventListener('click', function() {\n`;
              js += `    window.location.href = '${targetFile}';\n`;
              js += `  });\n\n`;
            }
          } else if (el.dynamicBinding) {
            const b = el.dynamicBinding;
            const params = Object.values(b.params).filter(v => v).map(v => `'${v}'`).join(', ');
            js += `  document.getElementById('${el.id}').addEventListener('click', function() {\n`;
            js += `    TWK.${b.functionName}(${params}).then(function(data) {\n`;
            js += `      console.log('${b.functionName} result:', data);\n`;
            js += `    }).catch(function(err) { console.error('${b.functionName}:', err); });\n`;
            js += `  });\n\n`;
          }
        }

        // Per-option actions for dropdown/radio/checkbox
        if (['dropdown', 'radio', 'checkbox'].includes(el.type) && el.dataSource === 'static') {
          const hasActions = el.options.some(o => o.action);
          if (hasActions && el.type === 'dropdown') {
            js += `  document.getElementById('${el.id}').addEventListener('change', function() {\n`;
            js += `    var actions = {\n`;
            for (const opt of el.options) {
              if (opt.action) {
                const params = Object.values(opt.action.params).filter(v => v).map(v => `'${v}'`).join(', ');
                js += `      '${opt.value}': function() { return TWK.${opt.action.functionName}(${params}); },\n`;
              }
            }
            js += `    };\n`;
            js += `    var fn = actions[this.value];\n`;
            js += `    if (fn) fn().then(function(data) { console.log('Result:', data); }).catch(function(err) { console.error(err); });\n`;
            js += `  });\n\n`;
          }
        }
      }
    }

    js += `});\n`;
    return js;
  }

  private generateHtml(page: Page, allPages: Page[]): string {
    let body = '';
    for (const el of page.elements) {
      body += this.elementToHtml(el) + '\n';
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.name}</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
${body}
  <script src="js/twkhelper.js"></script>
  <script src="js/app.js"></script>
</body>
</html>`;
  }

  private elementToHtml(el: BuilderElement): string {
    switch (el.type) {
      case 'text': {
        const tag = el.settings['headingLevel'] || 'p';
        return `  <${tag} id="${el.id}">${el.dataSource === 'dynamic' ? 'Loading...' : this.escapeHtml(el.staticContent)}</${tag}>`;
      }
      case 'button':
        return `  <button id="${el.id}">${this.escapeHtml(el.staticContent)}</button>`;
      case 'image':
        return `  <img id="${el.id}" src="${el.staticContent || ''}" alt="${el.settings['alt'] || ''}" style="width:${el.settings['width'] || '100%'}">`;
      case 'input':
        return `  <label class="el-label">${this.escapeHtml(el.settings['label'] || '')}</label>\n  <input id="${el.id}" type="${el.settings['inputType'] || 'text'}" placeholder="${this.escapeHtml(el.settings['placeholder'] || '')}">`;
      case 'dropdown': {
        let html = `  <label class="el-label">${this.escapeHtml(el.settings['label'] || '')}</label>\n  <select id="${el.id}">`;
        for (const opt of el.options) {
          html += `\n    <option value="${opt.value}">${this.escapeHtml(opt.label)}</option>`;
        }
        html += `\n  </select>`;
        return html;
      }
      case 'radio': {
        let html = `  <div class="radio-group" id="${el.id}">\n    <label class="el-label">${this.escapeHtml(el.settings['label'] || '')}</label>`;
        for (const opt of el.options) {
          html += `\n    <label><input type="radio" name="${el.settings['groupName'] || el.id}" value="${opt.value}"> ${this.escapeHtml(opt.label)}</label>`;
        }
        html += `\n  </div>`;
        return html;
      }
      case 'checkbox': {
        let html = `  <div class="checkbox-group" id="${el.id}">\n    <label class="el-label">${this.escapeHtml(el.settings['label'] || '')}</label>`;
        for (const opt of el.options) {
          html += `\n    <label><input type="checkbox" value="${opt.value}"> ${this.escapeHtml(opt.label)}</label>`;
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
