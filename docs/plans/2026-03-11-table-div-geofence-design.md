# Table, Div Container, and Map Geofencing Design

## Feature 1: Table Element (`'table'`)

Read-only display table with configurable rows/columns. Data source: static or TWK function.

- **Settings**: `rows`, `columns`, `headerRow` toggle
- **Data**: `tableData: string[][]` on BuilderElement
- **Static**: cell content edited in Settings tab grid
- **Dynamic**: TWK function fills table via binding
- **Canvas**: rendered as HTML table
- **i18n**: Arabic cell translations
- **Styles**: border, cell padding, header bg via Style tab

## Feature 2: Div Container Element (`'container'`)

Simple styled block — visual background only, no parent-child nesting.

- **Default**: grey bg (`#f4f4f5`), 8px radius, 16px padding
- **Canvas**: colored rectangle, positioned behind other elements
- **Use case**: form section backgrounds

## Feature 3: Geofence Condition Source

New `'geofence'` source in existing VisibilityCondition.

- **Fields**: `geofenceLat`, `geofenceLng`, `geofenceRadius` (meters)
- **Operators**: "Inside radius" (equals) / "Outside radius" (not_equals)
- **UI**: lat/lng + radius inputs when source = geofence
- **Generated code**: TWK.getLocation() + haversine distance calculation
- **Reusable**: any element can use geofence conditions
