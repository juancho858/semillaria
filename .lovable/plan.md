## Semillaria — Observatorio Agrícola de Antioquia

### Stack y decisiones
- TanStack Start + React + TypeScript + Tailwind (ya configurado).
- Recharts para gráficas; react-simple-maps + GeoJSON real de las 9 subregiones de Antioquia para el mapa.
- Lovable Cloud + Lovable AI Gateway (`google/gemini-3-flash-preview`) para el Analizador IA. El usuario **no** maneja API key — todo se llama desde un server function seguro. Esto reemplaza la idea original de Anthropic key en localStorage.
- Logo: subo la imagen como asset CDN (lovable-assets) y la uso en sidebar/header.
- **Datos**: necesito que adjuntes el CSV. Al recibirlo lo transformo a JSON tipado y lo embebido en `src/data/dataset.ts`. Mientras tanto puedo dejar un dataset placeholder mínimo con la forma correcta para que la UI compile.

### Diseño visual
- Fondo `#0D1B2A`, superficies `#132237`, bordes `#1E3A5F`, primario `#2D9E6B`, secundario `#F4A261`, texto `#F0F4F8`.
- Tipografía: IBM Plex Sans (cuerpo) + IBM Plex Mono (números) vía Google Fonts.
- Tokens semánticos definidos en `src/styles.css` (oklch). Sin colores hardcoded en componentes.
- Transiciones 150ms ease. Números con separadores de miles (`Intl.NumberFormat('es-CO')`).

### Estructura de rutas (TanStack file-based)
```
src/routes/
  __root.tsx            (shell: sidebar + header + Outlet)
  index.tsx             → /  (Resumen General)
  mapa.tsx              → /mapa
  predicciones.tsx      → /predicciones
  analizador.tsx        → /analizador
  api/analizador.ts     (server route POST → Lovable AI Gateway, streaming)
```
Sidebar colapsable con íconos lucide; en mobile → bottom nav. Selector de año global en el header (context React).

### Módulos

**1. Resumen General (`/`)**
- 4 KPI cards: Total Área Cultivada, Total Volumen, Cultivo Líder, Subregión Líder — calculados con `useMemo` sobre el dataset filtrado.
- Filtros: año, tipo (Transitorio/Permanente/Anual), subregión.
- Gráficas Recharts: barras top 10 cultivos por área, barras por subregión, área temporal de evolución.
- Tabla paginada (shadcn Table) con columnas Cultivo, Subregión, Área Total, Volumen, Tipo. Paginación cliente, 20 filas/página.

**2. Mapa de Calor (`/mapa`)**
- `src/data/antioquia-subregiones.geojson` con los 9 polígonos reales (lo incluyo en el bundle).
- `react-simple-maps` con `ComposableMap` + `Geographies`. Escala de color interpolada `#E8F5E9 → #1B5E20` con `d3-scale`.
- Selector de métrica encima (Área Total / Área Producción / Volumen). Año del header global.
- Hover: tooltip con nombre, valor, top 3 cultivos.
- Click: drawer lateral derecho con top 10 cultivos (barras) + evolución 2018–2023 (línea).

**3. Predicciones (`/predicciones`)**
- Controles: dropdown buscable de cultivo (Combobox shadcn), variable, k (2|3), método (SMA|WMA), botón Calcular.
- Lógica en `src/lib/forecast.ts`:
  - SMA: promedio simple de últimos k.
  - WMA: pesos lineales `[1..k]` normalizados.
  - Predicción 2024 a partir de la serie completa.
  - Métricas en muestra con shift de 1: MAE, RMSE, MAPE.
- Output: gráfica Recharts (línea sólida histórica, línea punteada MA, punto destacado 2024 con `F4A261`).
- Cards de métricas + tabla histórico/MA/predicción.
- Banner de advertencia fijo sobre horizonte de 1 período.

**4. Analizador de Oportunidad IA (`/analizador`)**
- UI: selectores (subregión incl. "Antioquia completa", cultivo incl. "Todos", enfoque), textarea de contexto, botón "Analizar".
- Al enviar: POST a `/api/analizador` con `{ subregion, cultivo, enfoque, contexto }`.
- Server route construye el prompt **incluyendo datos reales** (área/volumen agregados, tendencia 2018–2023, comparación entre subregiones calculada server-side desde el mismo dataset) y llama a Lovable AI Gateway con streaming.
- Frontend renderiza el stream en 4 secciones colapsables: Diagnóstico, Oportunidad, Riesgos, Recomendación. Le pido al modelo respuesta en JSON estructurado (`Output.object`) para parsear secciones limpiamente.
- Manejo de 429 y 402 con mensajes claros; spinner durante carga.

### Detalles técnicos

- **Lovable Cloud**: lo habilito al inicio (provisiona `LOVABLE_API_KEY` automáticamente). No hay tablas DB — solo se usa el gateway de IA.
- **Server route** `src/routes/api/analizador.ts` con `createLovableAiGatewayProvider` y `streamText` (patrón del knowledge `ai-sdk-lovable-gateway`).
- **Datos**: `src/data/dataset.ts` exporta `RECORDS: Record[]` y helpers en `src/lib/dataset.ts` (filtros, agregaciones, top-N, series temporales).
- **Componentes por módulo** en `src/modules/{resumen,mapa,predicciones,analizador}/` con comentarios en español.
- **GeoJSON**: incluyo un GeoJSON real simplificado de las 9 subregiones (lo embebo como JSON estático). Si tienes uno preferido (DANE, IGAC), súbelo y lo uso.

### Lo que necesito de ti
1. **CSV oficial** con los registros 2018–2023 (lo convierto a JSON embebido).
2. (Opcional) GeoJSON específico si tienes uno preferido; si no, uso uno público estándar de subregiones de Antioquia.

Al implementar habilito Lovable Cloud, subo el logo como asset, y construyo los 4 módulos en este orden: shell+tema → Resumen → Mapa → Predicciones → Analizador IA.