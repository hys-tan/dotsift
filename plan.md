# Especificación Técnica: Explorador y Filtro de Archivos por Tipo

Documento de requerimientos, diseño de arquitectura y propuestas de stack tecnológico para una aplicación de escritorio nativa, orientada al escaneo, clasificación por extensión y filtrado reactivo de archivos en disco.

---

## 1. Contexto y Requerimientos del Proyecto

### 1.1. Objetivo General

Construir una herramienta de escritorio ligera, rápida e independiente (compilada en un ejecutable `.exe` sin consola) para automatizar la catalogación local de archivos, con foco principal en bibliotecas de audio (`.mp3`, `.flac`, `.wav`, `.aac`, etc.).

### 1.2. Requerimientos Funcionales

* **Selección de Directorio Raíz:** El usuario puede adjuntar o seleccionar cualquier carpeta de su disco duro mediante el explorador nativo.
* **Agrupación y Conteo por Tipo:** A diferencia de un buscador tradicional que recorre el disco buscando nombres de archivo, la aplicación indexa el directorio y agrupa los archivos por su extensión, mostrando contadores inmediatos (ejemplo: `FLAC (150)`, `MP3 (820)`, `WAV (15)`).
* **Filtrado Exclusivo por Extensión:** Al hacer clic en un tipo de archivo, la vista principal muestra de manera estricta y exclusiva los elementos que pertenecen a esa extensión.
* **Barra de Búsqueda Secundaria Reactiva:** Un campo de entrada de texto permite filtrar en tiempo real por coincidencia en el nombre del archivo dentro del subconjunto de extensión ya seleccionado, sin reescanear el almacenamiento.
* **Ejecutable Autónomo:** Empaquetado como un archivo ejecutable portátil (`.exe`), sin requerir entornos de desarrollo abiertos ni scripts en terminal.

### 1.3. Requerimientos No Funcionales

* **Rendimiento:** Escaneo no bloqueante capaz de procesar decenas de miles de archivos en segundos.
* **Consumo de Recursos:** Huella de memoria mínima en estado inactivo y durante búsquedas.
* **Diseño Visual:** Interfaz limpia, minimalista y moderna (soporte para modo oscuro, espaciado legible, microinteracciones), evitando tanto interfaces recargadas como ventanas genéricas anticuadas.
* **Valor Pedagógico:** Estructura de software que permita profundizar en patrones de diseño avanzados, concurrencia y comunicación entre procesos.

---

## 2. Arquitectura de Datos y Retos Técnicos

Para garantizar velocidad instantánea con grandes volúmenes de datos, el flujo interno se rige por tres principios:

```
┌─────────────────────────────────────────────────────────────┐
│                       Interfaz (UI)                         │
│  - Selector de carpeta  - Chips/Botones por extensión       │
│  - Buscador de texto    - Lista virtualizada de resultados  │
└──────────────────────────────┬──────────────────────────────┘
                                │  Eventos / Llamada Asíncrona
┌──────────────────────────────▼──────────────────────────────┐
│                  Capa de Lógica / Sistema                   │
│  - Hilo de trabajo en segundo plano (Worker Thread)         │
│  - Recorrido del sistema de archivos (File System Traversal)│
└──────────────────────────────┬──────────────────────────────┘
                                │  Carga en memoria
┌──────────────────────────────▼──────────────────────────────┐
│                    Índice en Memoria (RAM)                  │
│  Map<Extension, List<{ name, path, size, modified }>>       │
└─────────────────────────────────────────────────────────────┘
```

1. **Indexación Hash Map en Memoria ($O(1)$):**
El disco se recorre una única vez al seleccionar la carpeta. Los resultados se serializan en un mapa estructurado por extensión:
```json
{
  "flac": [
    { "name": "track_01.flac", "path": "D:/Music/Artist/track_01.flac", "size": 31457280 },
    { "name": "track_02.flac", "path": "D:/Music/Artist/track_02.flac", "size": 29884416 }
  ],
  "mp3": [
    { "name": "demo.mp3", "path": "D:/Music/Demos/demo.mp3", "size": 7340032 }
  ]
}
```

Cambiar entre extensiones no toca el disco; accede a una referencia en memoria de forma instantánea.
2. **Concurrencia (Separación de Hilos):**
El hilo principal de renderizado nunca debe procesar la lectura del disco. La operación se delega a un hilo en segundo plano para evitar que Windows marque la ventana como *"No responde"*.
3. **Virtualización de Lista (Windowing):**
Si existen 50 000 canciones, la aplicación solo dibuja en el árbol de renderizado los 15 a 20 elementos visibles en la ventana, reciclando los contenedores durante el desplazamiento (scroll) para mantener el consumo de memoria plano.

---

## 3. Propuestas Tecnológicas

---

### Propuesta A: Tauri v2 (Rust + TypeScript / Tailwind CSS)

Tauri separa la aplicación en dos mundos: una interfaz renderizada mediante el motor web nativo de Windows (WebView2) y un núcleo de sistema de ultra-alto rendimiento escrito en Rust.

#### Especificaciones Técnicas

* **Core / Backend Local:** Rust (utilizando `walkdir` o `rayon` para escaneo paralelo en disco).
* **Frontend:** TypeScript + React / Vue / Svelte + Tailwind CSS (para una interfaz moderna, minimalista y con chips de selección).
* **Virtualización:** `@tanstack/react-virtual` o componentes de lista virtual nativos.
* **Comunicación:** Comandos IPC (`invoke`) fuertemente tipados.

#### Métricas Estimadas

* **Tamaño del `.exe` final:** ~10 MB – 15 MB.
* **Uso de memoria RAM:** ~35 MB – 55 MB.
* **Velocidad de escaneo:** Rendimiento nativo cercano a C/C++.

#### Conceptos Avanzados de Aprendizaje

* **Sistemas y Concurrencia en Rust:** Manejo de hilos de trabajo paralelos y seguridad de memoria garantizada por compilador sin *Garbage Collector*.
* **Protocolos IPC:** Intercambio de estructuras de datos binarias/JSON entre el lenguaje de sistemas y el entorno de presentación mediante `serde`.
* **Seguridad de Aplicaciones de Escritorio:** Configuración de alcances (*scopes*) de acceso al sistema de archivos mediante permisos declarativos en `tauri.conf.json`.

---

### Propuesta B: PySide6 (Python con Qt6)

PySide6 es la suite oficial de bindings en Python para Qt. Permite crear software con componentes nativos de escritorio mediante una arquitectura orientada a objetos estricta.

#### Especificaciones Técnicas

* **Core / Backend Local:** Python nativo utilizando `os.scandir()` o `pathlib` para recorrer rutas.
* **Interfaz:** Qt Widgets con estilos personalizados mediante QSS (Qt Style Sheets) o librerías de diseño contemporáneo como `PyQtDarkTheme` / `qfluentwidgets`.
* **Manejo de Hilos:** `QThread` o `QThreadPool` / `QRunnable`.
* **Renderizado de Datos:** Arquitectura Modelo-Vista nativa con `QAbstractListModel` y `QListView`.

#### Métricas Estimadas

* **Tamaño del `.exe` final:** ~45 MB – 65 MB (empaquetado con PyInstaller).
* **Uso de memoria RAM:** ~60 MB – 90 MB.
* **Velocidad de escaneo:** Alta (optimizada mediante llamadas al kernel de C subyacente).

#### Conceptos Avanzados de Aprendizaje

* **Patrón Arquitectónico Model-View-Controller (MVC):** Desacoplamiento estricto de los datos respecto a los elementos visuales mediante `QAbstractItemModel`, permitiendo virtualización nativa sin librerías externas.
* **Patrón Observer con Signals & Slots:** Comunicación desacoplada y asíncrona entre hilos y componentes de la UI.
* **Gestión del Ciclo de Vida de Procesos:** Control fino de eventos de la ventana, foco y atajos de teclado del sistema operativo.

---

## 4. Matriz Comparativa

| Criterio | Propuesta A: Tauri v2 (Rust + TS) | Propuesta B: PySide6 (Python + Qt) |
| --- | --- | --- |
| **Ecosistema de Diseño** | Flexbox, Tailwind, CSS moderno, animaciones fluidas | Componentes nativos de Windows, QSS, layouts matriciales |
| **Ligereza del Binario** | Máxima (~12 MB) | Media (~50 MB) |
| **Uso de RAM** | Muy bajo (~40 MB) | Moderado (~75 MB) |
| **Manejo de miles de elementos** | Requiere librería de virtualización web | Nativo mediante `QListView` + `QAbstractListModel` |
| **Curva de Aprendizaje** | Alta (aprender Rust y modelo de ownership) | Media (patrones orientados a objetos en Python) |
| **Flexibilidad a futuro** | Reutilizable para aplicaciones web/móviles | Estándar en herramientas de ingeniería y escritorio |

---

## 5. Hoja de Ruta de Implementación Sugerida

1. **Definición de Entidades de Datos:** Estructurar el modelo de metadatos (`FilePath`, `FileName`, `Extension`, `SizeBytes`).
2. **Desarrollo del Módulo de Escaneo:** Implementar la lectura recursiva de carpetas y medir tiempos de respuesta en directorios de prueba con más de 10 000 archivos.
3. **Construcción del Layout Base:**
* Encabezado: Selector de carpeta con ruta actual.
* Barra lateral o superior: Contenedor de etiquetas/chips interactivos con conteo dinámico.
* Barra de herramientas: Entrada de búsqueda textual.
* Cuerpo: Lista o tabla virtualizada de archivos filtrados.

4. **Acoplamiento Asíncrono:** Conectar el escáner al hilo secundario asegurando que la UI mantenga 60 fps durante la carga.
5. **Empaquetado:** Generación del `.exe` final standalone y verificación de arranque en frío.
