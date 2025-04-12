from pymongo import MongoClient, GEOSPHERE, TEXT
from faker import Faker
from datetime import datetime, timedelta
import random
import os
from dotenv import load_dotenv

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

# 1. Generar Usuarios (50 usuarios)
def generar_usuarios(n=50):
    usuarios = []
    for _ in range(n):
        usuario = {
            "nombre": fake.name(),
            "email": fake.email(),
            "ubicacion": {
                "type": "Point",
                "coordinates": [fake.longitude(), fake.latitude()]
            },
            "fechaRegistro": fake.date_time_this_decade()
        }
        usuarios.append(usuario)
    usuarios_col.insert_many(usuarios)

# 2. Generar Restaurantes (25 restaurantes)
def generar_restaurantes(n=25):
    restaurantes = []
    for _ in range(n):
        restaurante = {
            "nombre": fake.company(),
            "direccion": fake.address(),
            "ubicacion": {
                "type": "Point",
                "coordinates": [fake.longitude(), fake.latitude()]
            },
            "categoria": random.sample(["italiana", "mexicana", "vegetariana", "rapida"], 2),
            "menu": [],
            "createdAt": fake.date_time_this_year()
        }
        restaurantes.append(restaurante)
    restaurantes_col.insert_many(restaurantes)


# 3. Generar Menú (5-10 ítems por restaurante)
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
                "tags": random.sample(["vegetariano", "picante", "gluten-free"], 2)
            }
            items.append(item)
        menu_ids = menu_col.insert_many(items).inserted_ids
        # Actualizar el campo "menu" del restaurante con los ObjectIds
        restaurantes_col.update_one(
            {"_id": restaurante["_id"]},
            {"$set": {"menu": menu_ids}}
        )

# 4. Generar Órdenes (200 órdenes)
def generar_ordenes(n=200):
    usuarios = list(usuarios_col.find())
    restaurantes = list(restaurantes_col.find())
    for _ in range(n):
        usuario = random.choice(usuarios)
        restaurante = random.choice(restaurantes)
        # Obtener ítems del menú del restaurante
        items_menu = list(menu_col.find({"restaurant_id": restaurante["_id"]}))
        items_pedido = []
        total = 0
        for _ in range(random.randint(1, 5)):
            item = random.choice(items_menu)
            cantidad = random.randint(1, 3)
            subtotal = item["precio"] * cantidad
            items_pedido.append({
                "item_id": item["_id"],
                "nombre": item["nombre"],
                "cantidad": cantidad,
                "precio_unitario": item["precio"]
            })
            total += subtotal
        orden = {
            "usuario_id": usuario["_id"],
            "restaurant_id": restaurante["_id"],
            "estado": random.choice(["pendiente", "en preparación", "entregado"]),
            "fechaPedido": fake.date_time_this_month(),
            "items": items_pedido,
            "total": total
        }
        ordenes_col.insert_one(orden)

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

# Ejecutar generación en orden
generar_usuarios()
generar_restaurantes()
generar_menu()
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