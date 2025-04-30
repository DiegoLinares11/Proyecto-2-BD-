from faker import Faker
from datetime import datetime, timedelta
import random
import os
import pandas as pd
from bson import ObjectId

SEED = 42
random.seed(SEED)
fake = Faker('es_ES')
fake.seed_instance(SEED)

# Directorio donde guardar los JSON
directorio_salida = "json_exports"
os.makedirs(directorio_salida, exist_ok=True)

CATEGORIAS = ["italiana", "mexicana", "vegetariana", "rapida", "asiatica", "postres"]
TAGS = ["vegetariano", "picante", "gluten-free", "vegano", "bajo en calorías"]

LAT_MIN, LAT_MAX = 13.7, 17.8
LON_MIN, LON_MAX = -92.3, -88.2

# Función para generar ObjectId en formato MongoDB
def generar_object_id():
    return {"$oid": str(ObjectId())}  # Formato clave para MongoDB

# 1. Generar Usuarios
def generar_usuarios(n=8000):
    usuarios = []
    for _ in range(n):
        usuarios.append({
            "_id": generar_object_id(),
            "nombre": fake.name(),
            "email": fake.unique.email(),
            "ubicacion": {
                "type": "Point",
                "coordinates": [
                    round(random.uniform(LON_MIN, LON_MAX), 6),
                    round(random.uniform(LAT_MIN, LAT_MAX), 6)
                ]
            },
            "fechaRegistro": fake.date_time_this_decade().isoformat(),
            "edad": random.randint(18, 70),
            "genero": random.choice(["masculino", "femenino"])
        })
    pd.DataFrame(usuarios).to_json(f"{directorio_salida}/usuarios.json", orient="records", force_ascii=False, indent=2)

# 2. Generar Restaurantes
def generar_restaurantes(n=300):
    restaurantes = []
    for _ in range(n):
        restaurantes.append({
            "_id": generar_object_id(),
            "nombre": fake.company(),
            "direccion": fake.address(),
            "ubicacion": {
                "type": "Point",
                "coordinates": [
                    round(random.uniform(LON_MIN, LON_MAX), 6),
                    round(random.uniform(LAT_MIN, LAT_MAX), 6)
                ]
            },
            "categorias": random.sample(CATEGORIAS, 2),
            "createdAt": fake.date_time_this_year().isoformat()
        })
    pd.DataFrame(restaurantes).to_json(f"{directorio_salida}/restaurantes.json", orient="records", force_ascii=False, indent=2)

# 3. Generar Menú
def generar_menu(restaurantes, n_por_restaurante=(5, 10)):
    menu = []
    for rest in restaurantes:
        for _ in range(random.randint(*n_por_restaurante)):
            menu.append({
                "_id": generar_object_id(),
                "restaurante_id": rest["_id"],  # Usa el formato {"$oid": ...}
                "nombre": fake.word().capitalize() + " " + fake.word().capitalize(),
                "descripcion": fake.sentence(),
                "precio": round(random.uniform(50, 350), 2),
                "disponible": random.choice([True, False]),
                "tags": random.sample(TAGS, 2)
            })
    pd.DataFrame(menu).to_json(f"{directorio_salida}/menu.json", orient="records", force_ascii=False, indent=2)

# 4. Generar Promociones (ajustar referencias)
def generar_promociones(menu, n=3000):
    promociones = []
    for _ in range(n):
        items = random.sample(menu, min(3, len(menu)))
        tipo = random.choice(["descuento", "2x1", "combo"])
        promo = {
            "_id": generar_object_id(),
            "nombre": f"Promo {fake.word().capitalize()}",
            "fechaInicio": fake.date_time_this_month().isoformat(),
            "fechaFin": (fake.date_time_this_month() + timedelta(days=7)).isoformat(),
            "tipo": tipo,
            "items_aplicables": [item["_id"] for item in items],  # IDs en formato {"$oid": ...}
            "descuento": round(random.uniform(0.1, 0.3), 2) if tipo == "descuento" else None
        }
        promociones.append(promo)
    pd.DataFrame(promociones).to_json(f"{directorio_salida}/promociones.json", orient="records", force_ascii=False, indent=2)

# 5. Generar Órdenes (ajustar referencias)
def generar_ordenes(n=52000, usuarios=[], restaurantes=[], menu=[]):
    ordenes = []
    for _ in range(n):
        usuario = random.choice(usuarios)
        restaurante = random.choice(restaurantes)
        items_restaurante = random.sample(
            [item for item in menu if item["restaurante_id"]["$oid"] == restaurante["_id"]["$oid"]],
            k=random.randint(1, 5)
        ) if menu else []

        items_pedido = []
        total = 0

        for item in items_restaurante:
            cantidad = random.randint(1, 3)
            precio = item["precio"]
            subtotal = precio * cantidad
            items_pedido.append({
                "nombre": item["nombre"],
                "cantidad": cantidad,
                "precio_unitario": precio
            })
            total += subtotal

        total = round(total, 2)
        estado = random.choice(["pendiente", "en preparación", "entregado"])
        fecha_pedido = fake.date_time_this_month()

        ordenes.append({
            "_id": generar_object_id(),
            "usuario_id": usuario["_id"],  # Formato {"$oid": ...}
            "restaurante_id": restaurante["_id"],  # Formato {"$oid": ...}
            "estado": estado,
            "fechaPedido": fecha_pedido.isoformat(),
            "fechaInicioPreparacion": (fecha_pedido + timedelta(minutes=5)).isoformat(),
            "fechaEntrega": (fecha_pedido + timedelta(minutes=40)).isoformat() if estado == "entregado" else None,
            "items": items_pedido,
            "total": total
        })

    pd.DataFrame(ordenes).to_json(f"{directorio_salida}/ordenes.json", orient="records", force_ascii=False, indent=2)

# 6. Generar Reseñas (ajustar referencias)
def generar_reseñas(ordenes, n=10000):
    reseñas = []
    for _ in range(n):
        orden = random.choice(ordenes)
        reseñas.append({
            "_id": generar_object_id(),
            "usuario_id": orden["usuario_id"],  # Formato {"$oid": ...}
            "restaurante_id": orden["restaurante_id"],  # Formato {"$oid": ...}
            "calificación": round(random.uniform(1, 5), 1),
            "comentario": fake.paragraph(),
            "fecha": fake.date_time_this_month().isoformat()
        })
    pd.DataFrame(reseñas).to_json(f"{directorio_salida}/reseñas.json", orient="records", force_ascii=False, indent=2)

# 7. Generar Pagos (ajustar referencias)
def generar_pagos(ordenes):
    pagos = []
    for orden in ordenes:
        pagos.append({
            "_id": generar_object_id(),
            "usuario_id": orden["usuario_id"],  # Formato {"$oid": ...}
            "orden_id": orden["_id"],  # Formato {"$oid": ...}
            "monto": orden["total"],
            "metodoPago": random.choice(["tarjeta de crédito", "efectivo", "tarjeta de débito"]),
            "estado": "completado",
            "fecha": (datetime.fromisoformat(orden["fechaPedido"]) + timedelta(minutes=10)).isoformat()
        })
    pd.DataFrame(pagos).to_json(f"{directorio_salida}/pagos.json", orient="records", force_ascii=False, indent=2)

# Ejecutar generación de datos
print("Generando datos...")
generar_usuarios()
usuarios_df = pd.read_json(f"{directorio_salida}/usuarios.json")
generar_restaurantes()
restaurantes_df = pd.read_json(f"{directorio_salida}/restaurantes.json")
generar_menu(restaurantes_df.to_dict('records'))
menu_df = pd.read_json(f"{directorio_salida}/menu.json")
generar_promociones(menu_df.to_dict('records'))
promociones_df = pd.read_json(f"{directorio_salida}/promociones.json")
generar_ordenes(usuarios=usuarios_df.to_dict('records'), restaurantes=restaurantes_df.to_dict('records'), menu=menu_df.to_dict('records'))
ordenes_df = pd.read_json(f"{directorio_salida}/ordenes.json")
generar_reseñas(ordenes_df.to_dict('records'))
generar_pagos(ordenes_df.to_dict('records'))
print("Datos generados y guardados en formato JSON para mongoimport.")