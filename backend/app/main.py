import os
import sys
import math
import shutil
import threading
import webbrowser
from datetime import date, datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, ForeignKey, func, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
import uvicorn

# Determinar ruta base (funciona tanto en desarrollo como empaquetado en .exe)
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
    BUNDLE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    BUNDLE_DIR = BASE_DIR

DB_PATH = os.path.join(BASE_DIR, "junta.db")

# Respaldo automático al iniciar el programa (modo .exe / SQLite)
def realizar_backup_inicio():
    if os.path.exists(DB_PATH):
        backup_dir = os.path.join(BASE_DIR, "backups")
        os.makedirs(backup_dir, exist_ok=True)
        fecha_str = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        destino = os.path.join(backup_dir, f"junta_{fecha_str}.db")
        try:
            shutil.copy2(DB_PATH, destino)
            # Mantener solo los últimos 30 respaldos
            archivos = sorted([
                os.path.join(backup_dir, f) for f in os.listdir(backup_dir)
                if f.startswith("junta_") and f.endswith(".db")
            ])
            while len(archivos) > 30:
                os.remove(archivos.pop(0))
        except Exception:
            pass

# Modo híbrido: usa PostgreSQL si está en Docker (DATABASE_URL) o SQLite si es .exe local
ENV_DB_URL = os.getenv("DATABASE_URL")

if ENV_DB_URL:
    DATABASE_URL = ENV_DB_URL
    engine = create_engine(DATABASE_URL)
else:
    realizar_backup_inicio()
    DATABASE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI(title="Sistema Junta de Saneamiento 25 de Diciembre")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= MODELOS DE BASE DE DATOS =================

class ConfiguracionDB(Base):
    __tablename__ = "configuracion"
    id = Column(Integer, primary_key=True, index=True)
    nombre_junta = Column(String, default='JUNTA DE SANEAMIENTO "25 DE DICIEMBRE"')
    subtitulo = Column(String, default='"25 DE DICIEMBRE"')
    direccion = Column(String, default="RUTA N° 3 GRAL ELIZARDO AQUINO - TEL. 0451 230067")
    ciudad = Column(String, default="25 DE DICIEMBRE - DPTO. SAN PEDRO - PARAGUAY")
    telefono = Column(String, default="0451 230067")
    ruc = Column(String, default="80053205-8")
    timbrado = Column(String, default="18877580")
    vigencia_inicio = Column(String, default="2026-05-26")
    vigencia_fin = Column(String, default="2027-05-31")
    establecimiento = Column(String, default="001")
    punto_expedicion = Column(String, default="001")
    ultimo_numero = Column(Integer, default=0)
    tarifa_minima = Column(Float, default=13350.0)
    m3_minimo = Column(Float, default=10.0)
    precio_excedente = Column(Float, default=2500.0)
    porc_iva = Column(Float, default=10.0)
    porc_erssan = Column(Float, default=2.0)
    dias_vencimiento = Column(Integer, default=15)

class UsuarioDB(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    numero_conexion = Column(String, unique=True, index=True)
    ci = Column(String, index=True)
    nombre = Column(String)
    direccion = Column(String, default="")
    barrio = Column(String, default="")
    telefono = Column(String, default="")
    estado = Column(String, default="ACTIVO")
    lecturas = relationship("LecturaDB", back_populates="usuario")
    facturas = relationship("FacturaDB", back_populates="usuario")

class LecturaDB(Base):
    __tablename__ = "lecturas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    periodo = Column(String, index=True)
    lectura_anterior = Column(Float, default=0.0)
    lectura_actual = Column(Float, default=0.0)
    consumo_m3 = Column(Float, default=0.0)
    fecha_lectura = Column(Date, default=date.today)
    facturada = Column(String, default="NO")
    usuario = relationship("UsuarioDB", back_populates="lecturas")

class FacturaDB(Base):
    __tablename__ = "facturas"
    id = Column(Integer, primary_key=True, index=True)
    numero_factura = Column(String, unique=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    periodo = Column(String, index=True)
    consumo_m3 = Column(Float, default=0.0)
    monto_agua = Column(Float, default=0.0)
    iva = Column(Float, default=0.0)
    ersan = Column(Float, default=0.0)
    redondeo = Column(Float, default=0.0)
    atrasos = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    saldo = Column(Float, default=0.0)
    estado = Column(String, default="PENDIENTE")
    fecha_emision = Column(Date, default=date.today)
    fecha_vencimiento = Column(Date)
    usuario = relationship("UsuarioDB", back_populates="facturas")

class CajaDB(Base):
    __tablename__ = "caja"
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String)
    concepto = Column(String)
    monto = Column(Float)
    fecha = Column(DateTime, default=datetime.now)

class UsuarioSistemaDB(Base):
    __tablename__ = "usuarios_sistema"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    rol = Column(String, default="CAJERO")
    zona_asignada = Column(String, default="CENTRO")

class ReclamoDB(Base):
    __tablename__ = "reclamos"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    tipo = Column(String)
    descripcion = Column(String)
    estado = Column(String, default="PENDIENTE")
    fecha = Column(DateTime, default=datetime.now)
    usuario = relationship("UsuarioDB")

Base.metadata.create_all(bind=engine)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE configuracion ADD COLUMN telefono VARCHAR DEFAULT ''"))
        conn.commit()
    except Exception:
        pass

@app.on_event("startup")
def init_admin():
    db = SessionLocal()
    try:
        if not db.query(UsuarioSistemaDB).filter(UsuarioSistemaDB.username == "admin").first():
            db.add(UsuarioSistemaDB(username="admin", password="admin123", rol="ADMIN", zona_asignada="TODAS"))
            db.commit()
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_or_create_config(db: Session) -> ConfiguracionDB:
    cfg = db.query(ConfiguracionDB).first()
    if not cfg:
        cfg = ConfiguracionDB()
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg

# ================= ESQUEMAS PYDANTIC =================

class ConfiguracionSchema(BaseModel):
    nombre_junta: str
    subtitulo: Optional[str] = ""
    direccion: Optional[str] = ""
    ciudad: Optional[str] = ""
    telefono: Optional[str] = ""
    ruc: str
    timbrado: str
    vigencia_inicio: str
    vigencia_fin: str
    establecimiento: str
    punto_expedicion: str
    tarifa_minima: float
    m3_minimo: float
    precio_excedente: float
    porc_iva: float
    porc_erssan: float
    dias_vencimiento: int

class UsuarioCreate(BaseModel):
    numero_conexion: str
    ci: str
    nombre: str
    direccion: Optional[str] = ""
    barrio: Optional[str] = ""
    telefono: Optional[str] = ""
    estado: Optional[str] = "ACTIVO"

class LecturaCreate(BaseModel):
    usuario_id: int
    periodo: str
    lectura_anterior: float
    lectura_actual: float
    fecha_lectura: Optional[date] = None

class LecturaRapidaCreate(BaseModel):
    numero_conexion: str
    lectura_actual: float
    periodo: str

class LecturaUpdate(BaseModel):
    lectura_actual: float

class CobroFacturas(BaseModel):
    factura_ids: List[int]

class MovimientoCajaCreate(BaseModel):
    tipo: str
    concepto: str
    monto: float

class EmpleadoCreate(BaseModel):
    username: str
    password: str
    rol: str
    zona_asignada: str

class ReclamoCreate(BaseModel):
    usuario_id: int
    tipo: str
    descripcion: str

# ================= ENDPOINTS CONFIGURACIÓN =================

@app.get("/api/configuracion")
def obtener_configuracion(db: Session = Depends(get_db)):
    return get_or_create_config(db)

@app.put("/api/configuracion")
def actualizar_configuracion(data: ConfiguracionSchema, db: Session = Depends(get_db)):
    cfg = get_or_create_config(db)
    for key, value in data.dict().items():
        setattr(cfg, key, value)
    db.commit()
    db.refresh(cfg)
    return cfg

# ================= ENDPOINTS USUARIOS =================

@app.get("/api/usuarios")
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(UsuarioDB).order_by(UsuarioDB.id.asc()).all()

@app.post("/api/usuarios")
def crear_usuario(data: UsuarioCreate, db: Session = Depends(get_db)):
    existe = db.query(UsuarioDB).filter(UsuarioDB.numero_conexion == data.numero_conexion).first()
    if existe:
        raise HTTPException(400, "Ya existe un usuario con ese número de medidor/conexión")
    u = UsuarioDB(**data.dict())
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

@app.put("/api/usuarios/{usuario_id}")
def editar_usuario(usuario_id: int, data: UsuarioCreate, db: Session = Depends(get_db)):
    u = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    for key, value in data.dict().items():
        setattr(u, key, value)
    db.commit()
    db.refresh(u)
    return u

@app.put("/api/usuarios/{usuario_id}/estado")
def cambiar_estado_usuario(usuario_id: int, db: Session = Depends(get_db)):
    u = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    u.estado = "CORTADO" if u.estado == "ACTIVO" else "ACTIVO"
    db.commit()
    return {"ok": True, "estado": u.estado}

@app.get("/api/usuarios/planilla/{zona}")
def planilla_lectura(zona: str, db: Session = Depends(get_db)):
    q = db.query(UsuarioDB).filter(UsuarioDB.estado == "ACTIVO")
    if zona != "TODAS":
        q = q.filter(UsuarioDB.barrio == zona)
    usuarios = q.order_by(UsuarioDB.id.asc()).all()
    resultado = []
    for u in usuarios:
        ultima_lect = db.query(LecturaDB).filter(
            LecturaDB.usuario_id == u.id
        ).order_by(LecturaDB.periodo.desc(), LecturaDB.id.desc()).first()
        resultado.append({
            "medidor": u.numero_conexion,
            "nombre": u.nombre,
            "direccion": u.direccion or "S/D",
            "ci": u.ci,
            "lectura_anterior": ultima_lect.lectura_actual if ultima_lect else 0
        })
    return resultado

@app.get("/api/usuarios/{usuario_id}/ficha")
def ficha_usuario(usuario_id: int, db: Session = Depends(get_db)):
    u = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    lecturas = db.query(LecturaDB).filter(LecturaDB.usuario_id == usuario_id).order_by(LecturaDB.periodo.desc()).all()
    facturas = db.query(FacturaDB).filter(FacturaDB.usuario_id == usuario_id).order_by(FacturaDB.periodo.desc()).all()
    return {
        "usuario": u,
        "lecturas": lecturas,
        "facturas": [
            {
                "id": f.id,
                "numero": f.numero_factura,
                "periodo": f.periodo,
                "consumo": f.consumo_m3,
                "total": f.total,
                "saldo": f.saldo,
                "estado": f.estado,
                "vence": f.fecha_vencimiento.isoformat() if f.fecha_vencimiento else ""
            }
            for f in facturas
        ]
    }

# ================= ENDPOINTS LECTURAS Y CARGA RÁPIDA =================

@app.get("/api/buscar-usuario")
def buscar_usuario_rapido(q: str, db: Session = Depends(get_db)):
    u = db.query(UsuarioDB).filter(
        (UsuarioDB.numero_conexion == q.strip()) | (UsuarioDB.ci == q.strip())
    ).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")

    ultima_lect = db.query(LecturaDB).filter(
        LecturaDB.usuario_id == u.id
    ).order_by(LecturaDB.periodo.desc(), LecturaDB.id.desc()).first()

    return {
        "id": u.id,
        "nombre": u.nombre,
        "ci": u.ci,
        "medidor": u.numero_conexion,
        "estado": u.estado,
        "lectura_anterior": float(ultima_lect.lectura_actual) if ultima_lect else 0.0
    }

@app.post("/api/lecturas/rapida")
def registrar_lectura_rapida(data: LecturaRapidaCreate, db: Session = Depends(get_db)):
    u = db.query(UsuarioDB).filter(
        (UsuarioDB.numero_conexion == data.numero_conexion.strip()) | (UsuarioDB.ci == data.numero_conexion.strip())
    ).first()
    if not u:
        raise HTTPException(404, "Usuario no encontrado")

    existe = db.query(LecturaDB).filter(
        LecturaDB.usuario_id == u.id,
        LecturaDB.periodo == data.periodo
    ).first()
    if existe:
        raise HTTPException(400, f"Ya existe una lectura registrada para {u.nombre} en el período {data.periodo}")

    ultima_lect = db.query(LecturaDB).filter(
        LecturaDB.usuario_id == u.id,
        LecturaDB.periodo < data.periodo
    ).order_by(LecturaDB.periodo.desc(), LecturaDB.id.desc()).first()

    lectura_anterior = float(ultima_lect.lectura_actual) if ultima_lect else 0.0

    if data.lectura_actual < lectura_anterior:
        raise HTTPException(400, f"La lectura actual ({data.lectura_actual}) no puede ser menor a la anterior ({lectura_anterior})")

    consumo = data.lectura_actual - lectura_anterior

    l = LecturaDB(
        usuario_id=u.id,
        periodo=data.periodo,
        lectura_anterior=lectura_anterior,
        lectura_actual=data.lectura_actual,
        consumo_m3=consumo,
        fecha_lectura=date.today(),
        facturada="NO"
    )
    db.add(l)
    db.commit()

    return {
        "ok": True,
        "usuario": u.nombre,
        "consumo": consumo
    }

@app.get("/api/lecturas")
def listar_lecturas(periodo: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(LecturaDB).join(UsuarioDB)
    if periodo:
        q = q.filter(LecturaDB.periodo == periodo)
    lecturas = q.order_by(LecturaDB.id.desc()).all()
    return [
        {
            "id": l.id,
            "usuario_id": l.usuario_id,
            "usuario": l.usuario.nombre,
            "medidor": l.usuario.numero_conexion,
            "periodo": l.periodo,
            "lectura_anterior": l.lectura_anterior,
            "lectura_actual": l.lectura_actual,
            "consumo_m3": l.consumo_m3,
            "fecha_lectura": l.fecha_lectura.isoformat() if l.fecha_lectura else "",
            "facturada": l.facturada
        }
        for l in lecturas
    ]

@app.post("/api/lecturas")
def registrar_lectura(data: LecturaCreate, db: Session = Depends(get_db)):
    if data.lectura_actual < data.lectura_anterior:
        raise HTTPException(400, "La lectura actual no puede ser menor a la anterior")
    existe = db.query(LecturaDB).filter(
        LecturaDB.usuario_id == data.usuario_id,
        LecturaDB.periodo == data.periodo
    ).first()
    if existe:
        raise HTTPException(400, "Ya existe una lectura registrada para este usuario en ese período")

    consumo = data.lectura_actual - data.lectura_anterior
    l = LecturaDB(
        usuario_id=data.usuario_id,
        periodo=data.periodo,
        lectura_anterior=data.lectura_anterior,
        lectura_actual=data.lectura_actual,
        consumo_m3=consumo,
        fecha_lectura=data.fecha_lectura or date.today(),
        facturada="NO"
    )
    db.add(l)
    db.commit()
    db.refresh(l)
    return l

@app.put("/api/lecturas/{lectura_id}")
def editar_lectura(lectura_id: int, data: LecturaUpdate, db: Session = Depends(get_db)):
    l = db.query(LecturaDB).filter(LecturaDB.id == lectura_id).first()
    if not l:
        raise HTTPException(404, "Lectura no encontrada")
    if l.facturada == "SI":
        raise HTTPException(400, "No se puede editar una lectura ya facturada. Anule la factura primero.")
    if data.lectura_actual < l.lectura_anterior:
        raise HTTPException(400, f"La lectura actual ({data.lectura_actual}) no puede ser menor a la anterior ({l.lectura_anterior})")

    l.lectura_actual = data.lectura_actual
    l.consumo_m3 = data.lectura_actual - l.lectura_anterior
    db.commit()
    return {"ok": True, "consumo": l.consumo_m3}

# ================= ENDPOINTS FACTURACIÓN Y CIERRE =================

@app.post("/api/facturacion/cierre-mes/{periodo}")
def cierre_mes(periodo: str, db: Session = Depends(get_db)):
    cfg = get_or_create_config(db)
    lecturas = db.query(LecturaDB).join(UsuarioDB).filter(
        LecturaDB.periodo == periodo,
        LecturaDB.facturada == "NO",
        UsuarioDB.estado == "ACTIVO"
    ).all()

    if not lecturas:
        raise HTTPException(400, "No hay lecturas pendientes para facturar en este período")

    facturas_generadas = 0
    est = (cfg.establecimiento or "001").zfill(3)
    pto = (cfg.punto_expedicion or "001").zfill(3)

    for l in lecturas:
        factura_existente = db.query(FacturaDB).filter(
            FacturaDB.usuario_id == l.usuario_id,
            FacturaDB.periodo == periodo,
            FacturaDB.estado != "ANULADA"
        ).first()
        if factura_existente:
            continue

        consumo = float(l.consumo_m3)
        excedente_m3 = max(0.0, consumo - float(cfg.m3_minimo))
        monto_agua = float(cfg.tarifa_minima) + (excedente_m3 * float(cfg.precio_excedente))

        iva = round(monto_agua * (float(cfg.porc_iva) / 100.0))
        ersan = round(monto_agua * (float(cfg.porc_erssan) / 100.0))

        total_mes_sin_redondeo = monto_agua + iva + ersan
        total_mes = float(math.ceil(total_mes_sin_redondeo / 1000.0) * 1000)
        redondeo = total_mes - total_mes_sin_redondeo

        deuda_anterior = float(db.query(func.sum(FacturaDB.saldo)).filter(
            FacturaDB.usuario_id == l.usuario_id,
            FacturaDB.estado == "PENDIENTE",
            FacturaDB.periodo < periodo
        ).scalar() or 0.0)

        total_a_pagar = total_mes + deuda_anterior

        cfg.ultimo_numero = (cfg.ultimo_numero or 0) + 1
        num_factura = f"{est}-{pto}-{cfg.ultimo_numero:07d}"

        f = FacturaDB(
            numero_factura=num_factura,
            usuario_id=l.usuario_id,
            periodo=periodo,
            consumo_m3=l.consumo_m3,
            monto_agua=monto_agua,
            iva=iva,
            ersan=ersan,
            redondeo=redondeo,
            atrasos=deuda_anterior,
            total=total_a_pagar,
            saldo=total_mes,
            estado="PENDIENTE",
            fecha_emision=date.today(),
            fecha_vencimiento=date.today() + timedelta(days=int(cfg.dias_vencimiento or 15))
        )
        db.add(f)
        l.facturada = "SI"
        facturas_generadas += 1

    db.commit()
    return {"mensaje": f"Se generaron {facturas_generadas} facturas correctamente"}

@app.post("/api/facturas/{factura_id}/anular")
def anular_factura(factura_id: int, db: Session = Depends(get_db)):
    f = db.query(FacturaDB).filter(FacturaDB.id == factura_id).first()
    if not f:
        raise HTTPException(404, "Factura no encontrada")
    if f.estado == "PAGADA":
        raise HTTPException(400, "No se puede anular una factura que ya fue cobrada")
    if f.estado == "ANULADA":
        raise HTTPException(400, "La factura ya se encuentra anulada")

    f.estado = "ANULADA"
    f.saldo = 0.0

    lectura = db.query(LecturaDB).filter(
        LecturaDB.usuario_id == f.usuario_id,
        LecturaDB.periodo == f.periodo
    ).first()
    if lectura:
        lectura.facturada = "NO"

    db.commit()
    return {"ok": True, "mensaje": f"Factura {f.numero_factura} anulada. Lectura liberada para refacturar."}

@app.get("/api/facturas")
def listar_facturas(db: Session = Depends(get_db)):
    cfg = get_or_create_config(db)
    facturas = db.query(FacturaDB).join(UsuarioDB).order_by(FacturaDB.id.desc()).all()
    resultado = []

    for f in facturas:
        lectura_actual_obj = db.query(LecturaDB).filter(
            LecturaDB.usuario_id == f.usuario_id,
            LecturaDB.periodo == f.periodo
        ).first()

        lectura_previa_obj = db.query(LecturaDB).filter(
            LecturaDB.usuario_id == f.usuario_id,
            LecturaDB.periodo < f.periodo
        ).order_by(LecturaDB.periodo.desc()).first()

        anteriores = db.query(FacturaDB).filter(
            FacturaDB.usuario_id == f.usuario_id,
            FacturaDB.periodo < f.periodo,
            FacturaDB.estado != "ANULADA"
        ).order_by(FacturaDB.periodo.desc()).limit(3).all()

        historial = [
            {
                "periodo": ant.periodo,
                "consumo": ant.consumo_m3,
                "total": float(ant.saldo) if ant.estado == "PENDIENTE" else float(ant.monto_agua + ant.iva + ant.ersan + ant.redondeo),
                "estado": ant.estado
            }
            for ant in anteriores
        ]

        if f.estado == "PENDIENTE":
            atrasos_reales = float(db.query(func.sum(FacturaDB.saldo)).filter(
                FacturaDB.usuario_id == f.usuario_id,
                FacturaDB.estado == "PENDIENTE",
                FacturaDB.periodo < f.periodo
            ).scalar() or 0.0)
            total_real = float(f.saldo) + atrasos_reales
        else:
            atrasos_reales = float(f.atrasos)
            total_real = float(f.total)

        excedente_m3 = max(0.0, float(f.consumo_m3) - float(cfg.m3_minimo))
        dias = 30
        if lectura_actual_obj and lectura_previa_obj and lectura_actual_obj.fecha_lectura and lectura_previa_obj.fecha_lectura:
            diff = (lectura_actual_obj.fecha_lectura - lectura_previa_obj.fecha_lectura).days
            if diff > 0:
                dias = diff

        resultado.append({
            "id": f.id,
            "numero": f.numero_factura,
            "periodo": f.periodo,
            "usuario": f.usuario.nombre,
            "ci": f.usuario.ci,
            "direccion": f.usuario.direccion if f.usuario.direccion and f.usuario.direccion.strip() else "S/D",
            "barrio": f.usuario.barrio if f.usuario.barrio and f.usuario.barrio.strip() else "S/D",
            "medidor": f.usuario.numero_conexion,
            "lectura_anterior": lectura_actual_obj.lectura_anterior if lectura_actual_obj else 0,
            "lectura_actual": lectura_actual_obj.lectura_actual if lectura_actual_obj else f.consumo_m3,
            "fecha_anterior": lectura_previa_obj.fecha_lectura.isoformat() if (lectura_previa_obj and lectura_previa_obj.fecha_lectura) else "",
            "fecha_actual": lectura_actual_obj.fecha_lectura.isoformat() if (lectura_actual_obj and lectura_actual_obj.fecha_lectura) else "",
            "dias": dias,
            "consumo": f.consumo_m3,
            "excedente": excedente_m3,
            "monto_agua": float(f.monto_agua),
            "iva": float(f.iva),
            "ersan": float(f.ersan),
            "redondeo": float(f.redondeo),
            "atrasos": atrasos_reales,
            "total": total_real,
            "saldo": float(f.saldo),
            "estado": f.estado,
            "vence": f.fecha_vencimiento.isoformat() if f.fecha_vencimiento else "",
            "historial": historial
        })

    return resultado

# ================= ENDPOINTS CAJERO Y COBRO MÚLTIPLE =================

@app.get("/api/cajero/buscar")
def buscar_factura(q: str, db: Session = Depends(get_db)):
    usuario = db.query(UsuarioDB).filter(
        (UsuarioDB.numero_conexion == q) | (UsuarioDB.ci == q)
    ).first()

    if not usuario:
        return []

    pendientes = db.query(FacturaDB).filter(
        FacturaDB.usuario_id == usuario.id,
        FacturaDB.estado == "PENDIENTE"
    ).order_by(FacturaDB.periodo.asc(), FacturaDB.id.asc()).all()

    if not pendientes:
        return []

    return [{
        "usuario_id": usuario.id,
        "usuario": usuario.nombre,
        "medidor": usuario.numero_conexion,
        "ci": usuario.ci,
        "direccion": usuario.direccion or "S/D",
        "barrio": usuario.barrio or "S/D",
        "facturas": [
            {
                "id": f.id,
                "numero": f.numero_factura,
                "periodo": f.periodo,
                "monto": float(f.saldo),
                "vence": f.fecha_vencimiento.isoformat() if f.fecha_vencimiento else ""
            }
            for f in pendientes
        ]
    }]

@app.post("/api/facturas/pagar")
def pagar_factura(data: CobroFacturas, db: Session = Depends(get_db)):
    if not data.factura_ids:
        raise HTTPException(400, "Debe seleccionar al menos una factura para cobrar")

    facturas = db.query(FacturaDB).filter(
        FacturaDB.id.in_(data.factura_ids),
        FacturaDB.estado == "PENDIENTE"
    ).order_by(FacturaDB.periodo.asc(), FacturaDB.id.asc()).all()

    if len(facturas) != len(data.factura_ids):
        raise HTTPException(400, "Una o más facturas seleccionadas ya están pagadas o no existen")

    usuario_id = facturas[0].usuario_id

    todas_pendientes = db.query(FacturaDB).filter(
        FacturaDB.usuario_id == usuario_id,
        FacturaDB.estado == "PENDIENTE"
    ).order_by(FacturaDB.periodo.asc(), FacturaDB.id.asc()).all()

    ids_esperados = [f.id for f in todas_pendientes[:len(facturas)]]
    ids_recibidos = [f.id for f in facturas]

    if ids_recibidos != ids_esperados:
        raise HTTPException(400, "Debe cobrar las facturas en orden cronológico, empezando por la más antigua.")

    monto_cobrado = sum(float(f.saldo) for f in facturas)
    periodos_pagados = ", ".join(f.periodo for f in facturas)
    nombre_usuario = facturas[0].usuario.nombre

    for f in facturas:
        f.saldo = 0
        f.estado = "PAGADA"

    db.add(CajaDB(
        tipo="INGRESO",
        concepto=f"Cobro Facturas ({periodos_pagados}) - {nombre_usuario}",
        monto=monto_cobrado
    ))
    db.commit()

    return {"ok": True, "monto_cobrado": monto_cobrado}

@app.get("/api/cajero/resumen-hoy")
def resumen_cajero_hoy(db: Session = Depends(get_db)):
    hoy = date.today()
    cobros = db.query(CajaDB).filter(
        CajaDB.tipo == "INGRESO",
        func.date(CajaDB.fecha) == hoy,
        CajaDB.concepto.like("Cobro Facturas%")
    ).order_by(CajaDB.id.desc()).all()

    total_cobrado = sum(float(c.monto) for c in cobros)
    return {
        "atendidos": len(cobros),
        "total_cobrado": total_cobrado,
        "cobros": [
            {
                "id": c.id,
                "hora": c.fecha.strftime("%H:%M") if c.fecha else "",
                "concepto": c.concepto,
                "monto": float(c.monto)
            }
            for c in cobros
        ]
    }

# ================= ENDPOINTS CAJA, DASHBOARD Y REPORTES =================

@app.get("/api/caja")
def listar_caja(db: Session = Depends(get_db)):
    movimientos = db.query(CajaDB).order_by(CajaDB.id.desc()).all()
    ingresos = sum(m.monto for m in movimientos if m.tipo == "INGRESO")
    egresos = sum(m.monto for m in movimientos if m.tipo == "EGRESO")
    saldo = ingresos - egresos
    return {
        "saldo": saldo,
        "saldo_actual": saldo,
        "ingresos": ingresos,
        "egresos": egresos,
        "movimientos": movimientos
    }

@app.post("/api/caja")
def registrar_movimiento_caja(data: MovimientoCajaCreate, db: Session = Depends(get_db)):
    m = CajaDB(**data.dict())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

@app.get("/api/dashboard")
def obtener_dashboard(db: Session = Depends(get_db)):
    usuarios_activos = db.query(UsuarioDB).filter(UsuarioDB.estado == "ACTIVO").count()
    facturas_pendientes = db.query(FacturaDB).filter(FacturaDB.estado == "PENDIENTE").count()
    facturas_pagadas = db.query(FacturaDB).filter(FacturaDB.estado == "PAGADA").count()
    deuda_total = float(db.query(func.sum(FacturaDB.saldo)).filter(FacturaDB.estado == "PENDIENTE").scalar() or 0.0)
    recaudacion = float(db.query(func.sum(FacturaDB.monto_agua + FacturaDB.iva + FacturaDB.ersan + FacturaDB.redondeo)).filter(FacturaDB.estado == "PAGADA").scalar() or 0.0)
    movimientos = db.query(CajaDB).all()
    saldo_caja = sum(m.monto for m in movimientos if m.tipo == "INGRESO") - sum(m.monto for m in movimientos if m.tipo == "EGRESO")
    reclamos_pendientes = db.query(ReclamoDB).filter(ReclamoDB.estado == "PENDIENTE").count()

    ultimo_periodo = db.query(LecturaDB.periodo).order_by(LecturaDB.periodo.desc()).first()
    periodo_actual = ultimo_periodo[0] if ultimo_periodo else ""
    consumo_mes = float(db.query(func.sum(LecturaDB.consumo_m3)).filter(LecturaDB.periodo == periodo_actual).scalar() or 0.0) if periodo_actual else 0.0
    lecturas_mes_count = db.query(LecturaDB).filter(LecturaDB.periodo == periodo_actual).count() if periodo_actual else 0
    promedio_consumo = round(consumo_mes / lecturas_mes_count, 1) if lecturas_mes_count > 0 else 0.0

    periodos_q = db.query(FacturaDB.periodo).filter(FacturaDB.estado != "ANULADA").distinct().order_by(FacturaDB.periodo.desc()).limit(6).all()
    periodos_lista = sorted([p[0] for p in periodos_q])
    mensual = []
    for p in periodos_lista:
        facts_p = db.query(FacturaDB).filter(FacturaDB.periodo == p, FacturaDB.estado != "ANULADA").all()
        facturado_p = sum(float(f.monto_agua + f.iva + f.ersan + f.redondeo) for f in facts_p)
        recaudado_p = sum(float(f.monto_agua + f.iva + f.ersan + f.redondeo) for f in facts_p if f.estado == "PAGADA")
        mensual.append({
            "periodo": p,
            "Facturado": facturado_p,
            "Recaudado": recaudado_p
        })

    ultimos_movs = db.query(CajaDB).order_by(CajaDB.id.desc()).limit(5).all()
    movimientos_recientes = [
        {
            "id": m.id,
            "tipo": m.tipo,
            "concepto": m.concepto,
            "monto": float(m.monto),
            "fecha": m.fecha.strftime("%d/%m/%Y %H:%M") if m.fecha else ""
        }
        for m in ultimos_movs
    ]

    return {
        "usuarios_activos": usuarios_activos,
        "recaudacion": recaudacion,
        "facturas_pendientes": facturas_pendientes,
        "deuda_total": deuda_total,
        "saldo_caja": saldo_caja,
        "reclamos_pendientes": reclamos_pendientes,
        "periodo_actual": periodo_actual,
        "consumo_mes": consumo_mes,
        "promedio_consumo": promedio_consumo,
        "grafico": [
            {"name": "Pagadas", "value": facturas_pagadas},
            {"name": "Pendientes", "value": facturas_pendientes}
        ],
        "mensual": mensual,
        "ultimos_movimientos": movimientos_recientes
    }

@app.get("/api/usuarios-sistema")
def listar_empleados(db: Session = Depends(get_db)):
    return db.query(UsuarioSistemaDB).order_by(UsuarioSistemaDB.id.asc()).all()

@app.post("/api/usuarios-sistema")
def crear_empleado(data: EmpleadoCreate, db: Session = Depends(get_db)):
    existe = db.query(UsuarioSistemaDB).filter(UsuarioSistemaDB.username == data.username).first()
    if existe:
        raise HTTPException(400, "El usuario ya existe")
    emp = UsuarioSistemaDB(**data.dict())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp

@app.get("/api/reportes/morosos")
def reporte_morosos(db: Session = Depends(get_db)):
    hoy = date.today()
    vencidas = db.query(FacturaDB).join(UsuarioDB).filter(
        FacturaDB.estado == "PENDIENTE",
        FacturaDB.fecha_vencimiento < hoy
    ).order_by(FacturaDB.fecha_vencimiento.asc()).all()
    return [
        {
            "usuario": f.usuario.nombre,
            "medidor": f.usuario.numero_conexion,
            "factura": f.numero_factura,
            "monto": float(f.saldo),
            "dias_mora": (hoy - f.fecha_vencimiento).days
        }
        for f in vencidas
    ]

@app.get("/api/reclamos")
def listar_reclamos(db: Session = Depends(get_db)):
    reclamos = db.query(ReclamoDB).join(UsuarioDB).order_by(ReclamoDB.id.desc()).all()
    return [
        {
            "id": r.id,
            "fecha": r.fecha.isoformat() if r.fecha else "",
            "usuario": r.usuario.nombre,
            "tipo": r.tipo,
            "descripcion": r.descripcion,
            "estado": r.estado
        }
        for r in reclamos
    ]

@app.post("/api/reclamos")
def crear_reclamo(data: ReclamoCreate, db: Session = Depends(get_db)):
    r = ReclamoDB(**data.dict())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

# ================= ENDPOINTS LOGIN =================

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UsuarioSistemaDB).filter(UsuarioSistemaDB.username == data.username).first()
    
    if not user or user.password != data.password:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    return {
        "ok": True,
        "username": user.username,
        "rol": user.rol,
        "zona": user.zona_asignada
    }

# ================= ENDPOINTS EMPLEADOS =================

@app.delete("/api/usuarios-sistema/{empleado_id}")
def eliminar_empleado(empleado_id: int, db: Session = Depends(get_db)):
    emp = db.query(UsuarioSistemaDB).filter(UsuarioSistemaDB.id == empleado_id).first()
    if not emp:
        raise HTTPException(404, "Empleado no encontrado")
    
    if emp.username == "admin":
        raise HTTPException(400, "No se puede eliminar al usuario administrador principal")

    db.delete(emp)
    db.commit()
    return {"ok": True, "mensaje": f"Empleado {emp.username} eliminado correctamente"}

# ================= SERVIR FRONTEND REACT COMPILADO =================

DIST_DIR = os.path.join(BUNDLE_DIR, "dist")
if os.path.exists(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def servir_spa(full_path: str):
        archivo = os.path.join(DIST_DIR, full_path)
        if full_path and os.path.isfile(archivo):
            return FileResponse(archivo)
        return FileResponse(os.path.join(DIST_DIR, "index.html"))

def abrir_navegador():
    webbrowser.open("http://localhost:8000")

if __name__ == "__main__":
    print("====================================================")
    print("  AGUASYS - Junta de Saneamiento 25 de Diciembre")
    print("  Sistema iniciado en: http://localhost:8000")
    print("  NO CIERRE ESTA VENTANA MIENTRAS USA EL SISTEMA")
    print("====================================================")
    threading.Timer(1.5, abrir_navegador).start()
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")
