# Mini Apps Builder - Design Document

**Goal:** An Angular drag-and-drop website builder for creating Tawakkalna mini apps (HTML/CSS/JS) that run as WebViews inside the Tawakkalna mobile app.

**Target Users:** Developers/teams building embedded services for the Tawakkalna platform who want a visual builder instead of hand-coding HTML/CSS/JS.

---

## Architecture

3-panel layout Angular app using `@angular/cdk` drag-drop:

```
+----------------------------------------------------------+
|  Toolbar (page selector, undo/redo, preview, export)     |
+------------+---------------------+-----------------------+
|  Element   |    Canvas           |   Properties Panel    |
|  Palette   |    (phone frame)    |   - Style tab         |
|            |                     |   - Data tab          |
|  - Text    |   +----------+     |   - Settings tab      |
|  - Button  |   | mini app |     |                       |
|  - Input   |   | preview  |     |                       |
|  - Dropdown|   +----------+     |                       |
|  - Radio   |                     |                       |
|  - Checkbox|                     |                       |
|  - Image   |                     |                       |
|  - Map     |                     |                       |
|  - Divider |                     |                       |
+------------+---------------------+-----------------------+
|  Page tabs: [Page 1] [Page 2] [+]                        |
+----------------------------------------------------------+
```

## Elements

| Element | Settings | Data Source | Item Actions |
|---------|----------|------------|--------------|
| Text/Label | content, heading level | Static text OR TWK function | -- |
| Button | label | Static label | Single TWK function or page navigate |
| Image | src, alt, width/height | Static URL OR TWK function | -- |
| Input | type, placeholder, label | -- | -- |
| Dropdown | label, options list | Static options OR TWK list function | Each option can trigger its own TWK function |
| Radio | label, options list | Static options OR TWK list function | Each option can trigger its own TWK function |
| Checkbox | label, options list | Static options OR TWK list function | Each option can trigger its own TWK function |
| Map | default lat/lng, zoom | Static coords OR getUserLocation() | -- |
| Divider | thickness, color | -- | -- |

## TWK Function Binding Model

Elements can have:

1. **Data Source** - where content comes from:
   - Static: manually entered values
   - Dynamic: TWK function that returns data (auto-runs on page load for display elements)

2. **Item Actions** - per-option TWK function triggers:
   - Each dropdown/radio/checkbox option can call a different TWK function
   - Buttons can call a TWK function or navigate to another page

Example: A dropdown with static options where each triggers a different function:
- "From Camera" -> TWK.getCameraPhoto()
- "From Gallery" -> TWK.getGallerySingle()

## TWK Function Registry

Static catalog of all TWK functions with metadata:
- name, category, params, return type/path, description
- Categories: User Data, Permissions, Media, Interactive, Other

## Properties Panel

3 tabs when an element is selected:
- **Style**: font size, color, background, padding, margin, border, alignment
- **Data**: TWK function binding (data source + item actions)
- **Settings**: Element-specific props (label, placeholder, options list, etc.)

## Multi-Page Support

- Page tabs at bottom for add/remove/switch pages
- Each page is a separate HTML file in export
- Button elements can navigate between pages via `window.location.href`

## Live Preview

Phone-sized iframe (375x667) renders the generated HTML in real-time as you build.

## Export

ZIP download with files at root (no wrapper folder):
```
index.html
page2.html
css/style.css
js/app.js          (auto-generated logic)
js/twkhelper.js    (copied from assets)
images/
```

## Tech Stack

- Angular (latest) with standalone components
- @angular/cdk - drag-and-drop
- jszip - ZIP generation
- file-saver - trigger download
- No backend, no persistence
- No NgRx - single BuilderService holds state

## Project Structure

```
src/app/
  components/
    element-palette/         Left panel
    canvas/                  Center drop zone
    canvas-element/          Renders each element on canvas
    properties-panel/
      style-tab/
      data-tab/
      settings-tab/
    toolbar/                 Top bar
    page-tabs/               Bottom page management
    preview-modal/           Phone-frame iframe preview
  models/
    element.model.ts
    page.model.ts
  services/
    builder.service.ts       Central state
    code-generator.service.ts
    export.service.ts
    twk-functions.service.ts
  data/
    twk-registry.ts          Static TWK function catalog
```
