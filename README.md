# DotSift

Explorador y clasificador de archivos en disco por extensión y categoría.

---

## Descargas (Windows x64)

| Tipo | Archivo | Descripción |
| :--- | :--- | :--- |
| **Instalador** | [📥 Descargar instalador (`.exe`)](https://github.com/hys-tan/dotsift/releases/latest/download/DotSift_0.1.0_x64-setup.exe) | Asistente de instalación y acceso directo en Windows |
| **Portable** | [📥 Descargar versión portable (`.exe`)](https://github.com/hys-tan/dotsift/releases/latest/download/DotSift.exe) | Ejecutar directamente sin necesidad de instalación |

> Todas las versiones y notas de lanzamiento están disponibles en la sección de [Releases](https://github.com/hys-tan/dotsift/releases).

---

## Características

- **Escaneo multihilo:** Recorre carpetas en segundo plano utilizando Rust sin bloquear la interfaz.
- **Soporte multi-carpeta:** Selección o arrastre (drag-and-drop) de hasta 5 carpetas en una misma sesión.
- **Filtrado por tipo y extensión:** Clasifica automáticamente en categorías (Audio, Video, Imágenes, Documentos, Archivos comprimidos, Código, etc.) o por extensiones individuales, mostrando tamaño total y conteo de archivos.
- **Tabla con virtualización:** Permite visualizar listados con gran cantidad de archivos manteniendo un desplazamiento fluido y bajo consumo de memoria.
- **Búsqueda en tiempo real:** Filtrado instantáneo por nombre de archivo dentro del resultado.
- **Menú contextual:** Click derecho sobre cualquier archivo para abrirlo con el programa predeterminado, ubicarlo en el explorador de Windows o copiar su ruta completa.
- **Uso local:** Opera completamente en local, sin conexión a internet ni telemetría.

---

## Uso de la aplicación

Si solo deseas utilizar el programa:

1. Descarga el instalador o la versión portable desde la sección de [Descargas](#descargas-windows-x64).
2. Ejecuta el instalador o abre la versión portable.
3. En la pantalla inicial:
   - Haz clic en **"Agregar carpeta"** o arrastra entre 1 y 5 carpetas al área indicada.
   - Selecciona el tipo de archivo o la extensión que deseas listar.
   - Haz clic en **"Explorar archivos"**.
4. En la pantalla de resultados puedes usar la barra de búsqueda para filtrar por nombre o hacer clic derecho sobre una fila para abrir el archivo o su ubicación.

---

## Desarrollo y ejecución desde el código

Si deseas clonar el repositorio para modificarlo o probarlo localmente:

### Requisitos previos

- [Node.js](https://nodejs.org/) (versión 18 o superior)
- [pnpm](https://pnpm.io/)
- [Rust y Cargo](https://www.rust-lang.org/tools/install)
- En Windows: Herramientas de compilación de C++ (Build Tools para Visual Studio).

### Instalación y ejecución

1. Clona el repositorio:
   ```bash
   git clone https://github.com/hys-tan/dotsift.git
   cd dotsift
   ```

2. Instala las dependencias del proyecto:
   ```bash
   pnpm install
   ```

3. Inicia la aplicación en modo desarrollo:
   ```bash
   pnpm tauri dev
   ```

### Empaquetar el ejecutable

Para generar el instalador y el ejecutable optimizado para distribución:

```bash
pnpm tauri build
```

Los archivos generados se guardarán en:
- Instalador: `src-tauri/target/release/bundle/nsis/`
- Ejecutable directo: `src-tauri/target/release/DotSift.exe`

---

## Tecnologías utilizadas

- **Backend:** [Rust](https://www.rust-lang.org/) + [Tauri v2](https://tauri.app/) + [WalkDir](https://crates.io/crates/walkdir)
- **Frontend:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Componentes y utilidades:** [TanStack Virtual](https://tanstack.com/virtual), [Lucide React](https://lucide.dev/)

---

## Próximas mejoras previstas

- Soporte nativo para sistemas Linux y macOS.
- Opción de exportar los resultados a formatos CSV o JSON.

---

## Autor

Desarrollado por [Eliot](https://github.com/hys-tan).
