from pymongo import MongoClient, GEOSPHERE, TEXT
from faker import Faker
from datetime import datetime, timedelta
import random
import os
from dotenv import load_dotenv
import pandas as pd

load_dotenv()
fake = Faker('es_ES')

# Conexión a Atlas
client = MongoClient(os.getenv("MONGODB_URI"))
db = client["restaurante"]

# Colecciones
usuarios_col = db["usuarios"]
restaurantes_col = db["restaurantes"]
menu_col = db["menu"]
ordenes_col = db["ordenes"]
reseñas_col = db["reseñas"]
pagos_col = db["pagos"]
promociones_col = db["promociones"]  # NEW Colección de promociones

# 1. Generar Usuarios (MODIFIED con datos demográficos)
def generar_usuarios(n=55):
    usuarios = []
    for _ in range(n):
        usuario = {
            "nombre": fake.name(),
            "email": fake.email(),
            "ubicacion": {
                "type": "Point",
                "coordinates": [float(fake.longitude()), float(fake.latitude())]
            },
            "fechaRegistro": fake.date_time_this_decade(),
            "edad": random.randint(18, 70),  # NEW
            "genero": random.choice(["masculino", "femenino"])  # NEW
        }
        usuarios.append(usuario)
    usuarios_col.insert_many(usuarios)

# 2. Generar Restaurantes (MODIFIED con categorías estandarizadas)
CATEGORIAS = ["italiana", "mexicana", "vegetariana", "rapida", "asiatica", "postres"]  

def generar_restaurantes(n=20):
    restaurantes = []
    for _ in range(n):
        restaurante = {
            "nombre": fake.company(),
            "direccion": fake.address(),
            "ubicacion": {
                "type": "Point",
                "coordinates": [float(fake.longitude()), float(fake.latitude())]
            },
            "categoria": random.sample(CATEGORIAS, 2),  # MODIFIED Usa lista controlada
            "menu": [],
            "createdAt": fake.date_time_this_year()
        }
        restaurantes.append(restaurante)
    restaurantes_col.insert_many(restaurantes)

# 3. Generar Menú (MODIFIED con más tags)
def generar_menu():
    restaurantes = list(restaurantes_col.find())
    for restaurante in restaurantes:
        items = []
        for _ in range(random.randint(5, 10)):
            item = {
                "nombre": fake.word().capitalize() + " " + fake.word().capitalize(),
                "descripcion": fake.sentence(),
                "precio": round(random.uniform(50, 350), 2),
                "disponible": random.choice([True, False]),
                "restaurant_id": restaurante["_id"],
                "tags": random.sample(["vegetariano", "picante", "gluten-free", "vegano", "bajo en calorías"], 2)  # MODIFIED Más opciones
            }
            items.append(item)
        menu_ids = menu_col.insert_many(items).inserted_ids
        restaurantes_col.update_one(
            {"_id": restaurante["_id"]},
            {"$set": {"menu": menu_ids}}
        )

# 4. Generar Órdenes (MODIFIED con tiempos de preparación)
def generar_ordenes(n=200):
    usuarios = list(usuarios_col.find())
    restaurantes = list(restaurantes_col.find())
    for _ in range(n):
        usuario = random.choice(usuarios)
        restaurante = random.choice(restaurantes)
        
        # NEW: Obtener promociones activas para el restaurante
        promociones = list(promociones_col.find({
            "restaurant_id": restaurante["_id"],
            "fechaInicio": {"$lte": datetime.now()},
            "fechaFin": {"$gte": datetime.now()}
        }))
        
        items_menu = list(menu_col.find({"restaurant_id": restaurante["_id"]}))
        items_pedido = []
        total = 0
        promocion_aplicada = None  # NEW
        
        for _ in range(random.randint(1, 5)):
            item = random.choice(items_menu)
            cantidad = random.randint(1, 3)
            
            # NEW: Verificar si el item tiene promoción
            for promo in promociones:
                if item["_id"] in promo["items_aplicables"]:
                    if promo["tipo"] == "descuento":
                        descuento = 0.2  # 20% de descuento
                        subtotal = (item["precio"] * (1 - descuento)) * cantidad
                        promocion_aplicada = promo["_id"]
                    break
            else:
                subtotal = item["precio"] * cantidad
            
            items_pedido.append({
                "item_id": item["_id"],
                "nombre": item["nombre"],
                "cantidad": cantidad,
                "precio_unitario": item["precio"]
            })
            total += subtotal
        
        fecha_pedido = fake.date_time_this_month()
        orden = {
            "usuario_id": usuario["_id"],
            "restaurant_id": restaurante["_id"],
            "estado": random.choice(["pendiente", "en preparación", "entregado"]),
            "fechaPedido": fecha_pedido,
            "fechaInicioPreparacion": fecha_pedido + timedelta(minutes=random.randint(2, 10)),  # NEW
            "fechaEntrega": None,  # NEW Se actualizará después
            "items": items_pedido,
            "total": total,
            "promocion_id": promocion_aplicada  # NEW
        }
        
        # NEW: Calcular fecha de entrega si el estado es "entregado"
        if orden["estado"] == "entregado":
            orden["fechaEntrega"] = orden["fechaInicioPreparacion"] + timedelta(minutes=random.randint(15, 45))
        
        ordenes_col.insert_one(orden)

# NEW: 5. Generar Promociones
def generar_promociones(n=30):
    restaurantes = list(restaurantes_col.find())
    for _ in range(n):
        restaurante = random.choice(restaurantes)
        items = list(menu_col.find({"restaurant_id": restaurante["_id"]}))
        
        promocion = {
            "nombre": f"Promo {fake.word().capitalize()}",
            "restaurant_id": restaurante["_id"],
            "fechaInicio": fake.date_time_this_month(),
            "fechaFin": fake.date_time_this_month() + timedelta(days=7),
            "tipo": random.choice(["descuento", "2x1", "combo"]),
            "items_aplicables": [item["_id"] for item in random.sample(items, min(3, len(items)))],
            "descuento": None
        }
        
        if promocion["tipo"] == "descuento":
            promocion["descuento"] = round(random.uniform(0.1, 0.3)),  # 10-30% de descuento
        
        promociones_col.insert_one(promocion)


# 5. Generar Reseñas (150 reseñas)
def generar_reseñas(n=150):
    ordenes = list(ordenes_col.find())
    for _ in range(n):
        orden = random.choice(ordenes)
        reseña = {
            "usuario_id": orden["usuario_id"],
            "restaurant_id": orden["restaurant_id"],
            "order_id": orden["_id"],
            "calificación": round(random.uniform(1, 5), 1),
            "comentario": fake.paragraph(),
            "fecha": fake.date_time_this_month(),
            "respuestas": []  # Opcional: agregar respuestas
        }
        reseñas_col.insert_one(reseña)

# 6. Generar Pagos (1 pago por orden)
def generar_pagos():
    ordenes = list(ordenes_col.find())
    for orden in ordenes:
        pago = {
            "order_id": orden["_id"],
            "usuario_id": orden["usuario_id"],
            "monto": orden["total"],
            "metodoPago": random.choice(["tarjeta de crédito", "efectivo", "digital"]),
            "estado": "completado",
            "fecha": orden["fechaPedido"] + timedelta(minutes=10)
        }
        pagos_col.insert_one(pago)

# EJECUCIÓN PRINCIPAL (MODIFIED con nuevo orden)
generar_usuarios()
generar_restaurantes()
generar_menu()
generar_promociones()  
generar_ordenes()       
generar_reseñas()
generar_pagos()

# Índices para Usuarios
usuarios_col.create_index([("nombre", TEXT)])
usuarios_col.create_index([("ubicacion", GEOSPHERE)])
usuarios_col.create_index([("email", 1), ("fechaRegistro", -1)])

# Índices para Restaurantes
restaurantes_col.create_index([("nombre", TEXT), ("categoria", TEXT)])
restaurantes_col.create_index([("ubicacion", GEOSPHERE)])

# Índices para Menú
menu_col.create_index([("restaurant_id", 1), ("disponible", 1)])
menu_col.create_index([("tags", 1)])
menu_col.create_index([("nombre", TEXT), ("descripcion", TEXT)])

# Índices para Órdenes
ordenes_col.create_index([("usuario_id", 1), ("fechaPedido", -1)])
ordenes_col.create_index([("items.item_id", 1)])

# Índices para Reseñas
reseñas_col.create_index([("comentario", TEXT)])
reseñas_col.create_index([("calificación", 1)])

# Índices para Pagos
pagos_col.create_index([("order_id", 1), ("fecha", 1)])
pagos_col.create_index([("usuario_id", 1)])

# Nuevos índices para promociones
promociones_col.create_index([("restaurant_id", 1)])
promociones_col.create_index([("fechaInicio", 1), ("fechaFin", 1)])

# Nuevo índice para tiempo de preparación en órdenes
ordenes_col.create_index([("fechaInicioPreparacion", 1), ("fechaEntrega", 1)])


# Lista de colecciones a exportar
colecciones = {
    "usuarios": usuarios_col,
    "restaurantes": restaurantes_col,
    "menu": menu_col,
    "ordenes": ordenes_col,
    "reseñas": reseñas_col,
    "pagos": pagos_col,
    "promociones": promociones_col
}

# Directorio donde guardar los CSV
directorio_salida = "csv_exports"
os.makedirs(directorio_salida, exist_ok=True)

for nombre, coleccion in colecciones.items():
    documentos = list(coleccion.find())
    if documentos:
        # Convertir ObjectId a string
        for doc in documentos:
            doc["_id"] = str(doc["_id"])
            for k, v in doc.items():
                if isinstance(v, dict) and 'type' in v and 'coordinates' in v:
                    doc[k] = str(v)  # Convierte GeoJSON a string para el CSV
                elif isinstance(v, list):
                    doc[k] = str(v)
                elif isinstance(v, datetime):
                    doc[k] = v.isoformat()
        # Guardar en CSV
        df = pd.DataFrame(documentos)
        df.to_csv(f"{directorio_salida}/{nombre}.csv", index=False, encoding='utf-8-sig')
        print(f" Exportado {nombre} a {directorio_salida}/{nombre}.csv")
    else:
        print(f" La colección {nombre} está vacía.")