from faker import Faker
from datetime import datetime, timedelta
import random
import os
import pandas as pd

SEED = 42
random.seed(SEED)
fake = Faker('es_ES')
fake.seed_instance(SEED)

# Directorio donde guardar los CSV
directorio_salida = "csv_exports"
os.makedirs(directorio_salida, exist_ok=True)

CATEGORIAS = ["italiana", "mexicana", "vegetariana", "rapida", "asiatica", "postres"]
TAGS = ["vegetariano", "picante", "gluten-free", "vegano", "bajo en calorías"]

# Rango aproximado de coordenadas para Guatemala (país entero)
LAT_MIN, LAT_MAX = 13.7, 17.8
LON_MIN, LON_MAX = -92.3, -88.2

# 1. Generar Usuarios
def generar_usuarios(n=8000):
    usuarios = []
    for _ in range(n):
        usuarios.append({
            "nombre": fake.name(),
            "email": fake.email(),
            "lat": round(random.uniform(LAT_MIN, LAT_MAX), 6),
            "lon": round(random.uniform(LON_MIN, LON_MAX), 6),
            "fechaRegistro": fake.date_time_this_decade().isoformat(),
            "edad": random.randint(18, 70),
            "genero": random.choice(["masculino", "femenino"])
        })
    pd.DataFrame(usuarios).to_csv(f"{directorio_salida}/usuarios.csv", index=False, encoding='utf-8-sig')

# 2. Generar Restaurantes
def generar_restaurantes(n=300):
    restaurantes = []
    for _ in range(n):
        restaurantes.append({
            "nombre": fake.company(),
            "direccion": fake.address(),
            "lat": round(random.uniform(LAT_MIN, LAT_MAX), 6),
            "lon": round(random.uniform(LON_MIN, LON_MAX), 6),
            "categoria": ", ".join(random.sample(CATEGORIAS, 2)),
            "createdAt": fake.date_time_this_year().isoformat()
        })
    pd.DataFrame(restaurantes).to_csv(f"{directorio_salida}/restaurantes.csv", index=False, encoding='utf-8-sig')

# 3. Generar Menú
def generar_menu(restaurantes, n_por_restaurante=(5, 10)):
    menu = []
    for i, rest in enumerate(restaurantes):
        for _ in range(random.randint(*n_por_restaurante)):
            menu.append({
                "restaurant_index": i,
                "nombre": fake.word().capitalize() + " " + fake.word().capitalize(),
                "descripcion": fake.sentence(),
                "precio": round(random.uniform(50, 350), 2),
                "disponible": random.choice([True, False]),
                "tags": ", ".join(random.sample(TAGS, 2))
            })
    pd.DataFrame(menu).to_csv(f"{directorio_salida}/menu.csv", index=False, encoding='utf-8-sig')

# 4. Generar Promociones
def generar_promociones(menu, n=3000):
    promociones = []
    for _ in range(n):
        items = random.sample(menu, min(3, len(menu)))
        tipo = random.choice(["descuento", "2x1", "combo"])
        promo = {
            "nombre": f"Promo {fake.word().capitalize()}",
            "fechaInicio": fake.date_time_this_month().isoformat(),
            "fechaFin": (fake.date_time_this_month() + timedelta(days=7)).isoformat(),
            "tipo": tipo,
            "items_aplicables": ", ".join([str(i) for i in items]),
            "descuento": round(random.uniform(0.1, 0.3), 2) if tipo == "descuento" else ""
        }
        promociones.append(promo)
    pd.DataFrame(promociones).to_csv(f"{directorio_salida}/promociones.csv", index=False, encoding='utf-8-sig')

# 5. Generar Órdenes
def generar_ordenes(n=52000, usuarios=[], restaurantes=[], menu=[], promociones=[]):
    ordenes = []
    for _ in range(n):
        usuario = random.choice(usuarios)
        restaurante = random.choice(restaurantes)
        items_restaurante = random.sample(menu, k=random.randint(1, 5))
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
            "usuario": usuario["email"],
            "restaurante": restaurante["nombre"],
            "estado": estado,
            "fechaPedido": fecha_pedido.isoformat(),
            "fechaInicioPreparacion": (fecha_pedido + timedelta(minutes=5)).isoformat(),
            "fechaEntrega": (fecha_pedido + timedelta(minutes=40)).isoformat() if estado == "entregado" else "",
            "items": str(items_pedido),
            "total": total
        })

    pd.DataFrame(ordenes).to_csv(f"{directorio_salida}/ordenes.csv", index=False, encoding='utf-8-sig')

# 6. Generar Reseñas
def generar_reseñas(ordenes, n=10000):
    reseñas = []
    for _ in range(n):
        orden = random.choice(ordenes)
        reseñas.append({
            "usuario": orden["usuario"],
            "restaurante": orden["restaurante"],
            "calificación": round(random.uniform(1, 5), 1),
            "comentario": fake.paragraph(),
            "fecha": fake.date_time_this_month().isoformat()
        })
    pd.DataFrame(reseñas).to_csv(f"{directorio_salida}/reseñas.csv", index=False, encoding='utf-8-sig')

# 7. Generar Pagos
def generar_pagos(ordenes):
    pagos = []
    for orden in ordenes:
        pagos.append({
            "usuario": orden["usuario"],
            "monto": orden["total"],
            "metodoPago": random.choice(["tarjeta de crédito", "efectivo", "tarjeta de débito"]),
            "estado": "completado",
            "fecha": (datetime.fromisoformat(orden["fechaPedido"]) + timedelta(minutes=10)).isoformat()
        })
    pd.DataFrame(pagos).to_csv(f"{directorio_salida}/pagos.csv", index=False, encoding='utf-8-sig')

# Ejecutar generación de datos
print("Generando datos...")
generar_usuarios()
generar_restaurantes()
usuarios_df = pd.read_csv(f"{directorio_salida}/usuarios.csv")
restaurantes_df = pd.read_csv(f"{directorio_salida}/restaurantes.csv")
generar_menu(restaurantes_df.to_dict('records'))
menu_df = pd.read_csv(f"{directorio_salida}/menu.csv")
generar_promociones(menu_df.to_dict('records'))
promociones_df = pd.read_csv(f"{directorio_salida}/promociones.csv")
generar_ordenes(usuarios=usuarios_df.to_dict('records'), restaurantes=restaurantes_df.to_dict('records'), menu=menu_df.to_dict('records'), promociones=promociones_df.to_dict('records'))
ordenes_df = pd.read_csv(f"{directorio_salida}/ordenes.csv")
generar_reseñas(ordenes_df.to_dict('records'))
generar_pagos(ordenes_df.to_dict('records'))
print("Datos generados y guardados en csv_exports/")
