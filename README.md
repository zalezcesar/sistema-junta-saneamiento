# 💧 Sistema Integral de Gestión y Facturación para Juntas de Saneamiento

Plataforma web **Full Stack** diseñada para administrar de punta a punta las operaciones administrativas, técnicas y financieras de una Junta de Saneamiento en Paraguay. Permite gestionar socios, registrar lecturas de medidores, emitir facturación masiva conforme a normativas fiscales locales, operar punto de venta en ventanilla (POS) y generar copias de seguridad automatizadas.

---

## 🚀 Características Principales

* **Control de Acceso por Roles:** Inicio de sesión diferenciado para **Administrador** (acceso gerencial y configuración total) y **Cajero** (acceso directo a ventanilla de cobro con arqueo diario de turno).
* **Catastro y Ficha de Socios:** Registro de usuarios por número de medidor/conexión y cédula/RUC, control de estado (Activo/Cortado), impresión de planillas de lectura por barrio, historial de facturas paginado y contacto directo por WhatsApp.
* **Carga Rápida de Lecturas:** Interfaz optimizada para teclado en oficina con validación visual del socio, cálculo automático de consumo en m³ y edición controlada de lecturas pendientes.
* **Facturación Legal Paraguay:**
  * Cálculo escalonado de tarifa mínima (m³ base) + consumo excedente.
  * Cálculo automático de IVA (10%), Erssan (2%) y redondeo al múltiplo de ₲ 1.000.
  * Numeración correlativa con control de Timbrado DNIT, anulación controlada, refacturación e impresión individual o en lote.
* **Cajero (POS) y Tesorería:** Cobro de una o múltiples facturas en orden cronológico, resumen diario de personas atendidas y monto recaudado en el turno, libro de caja (ingresos/egresos) y reporte imprimible de morosos.
* **Dashboard Gerencial:** Indicadores en tiempo real de recaudación, deuda pendiente, consumo total en m³ del período y gráficos comparativos mensuales.
* **Respaldos Automatizados:** Copias de seguridad diarias automáticas de la base de datos con retención de los últimos 30 respaldos.

---

## 🛠️ Stack Tecnológico

* **Frontend:** JavaScript (ES6+), React, Tailwind CSS, Vite, Recharts, Lucide Icons.
* **Backend:** Python 3.11, FastAPI, SQLAlchemy, Pydantic, Uvicorn.
* **Bases de Datos:** PostgreSQL (despliegue con Docker) y SQLite (versión ejecutable portable).
* **Despliegue:** Docker, Docker Compose, Nginx y PyInstaller (`.exe` autónomo para Windows).

---

## ⚙️ Instalación y Ejecución

### Opción 1: Ejecución con Docker Compose (Recomendado para servidor/desarrollo)

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/sistema-junta-saneamiento.git
   cd sistema-junta-saneamiento
   ```
2. Levantar los contenedores:
   ```bash
   docker compose up -d --build
   ```
3. Acceder desde el navegador a: `http://localhost:5173`

### Opción 2: Generar Ejecutable Portable para Windows (`.exe`)

1. Ejecutar el script `compilar_exe.bat` incluido en la raíz del proyecto.
2. Abrir el archivo generado en `ENTREGABLE_CLIENTE/AGUASYS.exe` (inicia el servidor local, crea la base de datos SQLite y abre el navegador automáticamente).

---

## 🔐 Credenciales Iniciales

* **Usuario:** `admin`
* **Contraseña:** `admin123`
