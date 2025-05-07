    const readline = require("readline");
    const axios = require("axios");
    const fs = require("fs");
    const path = require("path");

    const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    });

    // Configuración base
    const BASE_URL = "http://localhost:5000/api";

    // ================================================
    // 1. Menú Principal
    // ================================================
    const mainMenu = () => {
    console.log("\n=== SISTEMA DE GESTIÓN DE RESTAURANTES ===");
    console.log("1. Usuarios");
    console.log("2. Restaurantes");
    console.log("3. Menú");
    console.log("4. Órdenes");
    console.log("5. Promociones");
    console.log("6. Reseñas");
    console.log("7. Pagos");
    console.log("8. Archivos");
    console.log("9. Agregaciones");
    console.log("10. Salir");

    rl.question("\nSeleccione una opción (1-10): ", (option) => {
        switch(option) {
        case "1": entityMenu("users"); break;
        case "2": entityMenu("restaurants"); break;
        case "3": entityMenu("menu"); break;
        case "4": entityMenu("orders"); break;
        case "5": entityMenu("promotions"); break;
        case "6": entityMenu("reviews"); break;
        case "7": entityMenu("payments"); break;
        case "8": fileMenu(); break;
        case "9": aggregationMenu(); break;
        case "10": 
            console.log("👋 ¡Hasta luego!");
            rl.close();
            process.exit(0);
        default: 
            console.log("❌ Opción inválida");
            mainMenu();
        }
    });
    };

    // ================================================
    // 2. Menú de Entidad (CRUD + Bulk)
    // ================================================
    const entityMenu = (entity) => {
    console.log(`\n=== ${entity.toUpperCase()} ===`);
    console.log("1. Crear");
    console.log("2. Listar (paginado)");
    console.log("3. Listar todos");
    console.log("4. Buscar por ID");
    console.log("5. Actualizar");
    console.log("6. Eliminar");
    console.log("7. Bulk Create");
    console.log("8. Bulk Update");
    console.log("9. Bulk Delete");
    console.log("10. Volver al menú principal");

    rl.question("\nSeleccione una opción (1-10): ", async (option) => {
        switch(option) {
        case "1": await createEntity(entity); break;
        case "2": await listEntities(entity, false); break;
        case "3": await listEntities(entity, true); break;
        case "4": await getEntityById(entity); break;
        case "5": await updateEntity(entity); break;
        case "6": await deleteEntity(entity); break;
        case "7": await bulkOperation(entity, "create"); break;
        case "8": await bulkOperation(entity, "update"); break;
        case "9": await bulkOperation(entity, "delete"); break;
        case "10": mainMenu(); break;
        default: 
            console.log("❌ Opción inválida");
            entityMenu(entity);
        }
    });
    };

    // ================================================
    // 3. Menú de Archivos
    // ================================================
    const fileMenu = () => {
    console.log("\n=== GESTIÓN DE ARCHIVOS ===");
    console.log("1. Subir archivo");
    console.log("2. Listar archivos");
    console.log("3. Descargar archivo");
    console.log("4. Eliminar archivo");
    console.log("5. Volver al menú principal");

    rl.question("\nSeleccione una opción (1-5): ", async (option) => {
        switch(option) {
        case "1": await uploadFile(); break;
        case "2": await listFiles(); break;
        case "3": await downloadFile(); break;
        case "4": await deleteFile(); break;
        case "5": mainMenu(); break;
        default: 
            console.log("❌ Opción inválida");
            fileMenu();
        }
    });
    };

    // ================================================
    // 4. Menú de Agregaciones
    // ================================================
    const aggregationMenu = () => {
    console.log("\n=== AGREGACIONES ===");
    console.log("1. Agregaciones Simples");
    console.log("2. Agregaciones Complejas");
    console.log("3. Manejo de Arrays");
    console.log("4. Documentos Embebidos");
    console.log("5. Volver al menú principal");

    rl.question("\nSeleccione una opción (1-5): ", (option) => {
        switch(option) {
        case "1": aggregationSubMenu("simples"); break;
        case "2": aggregationSubMenu("complejas"); break;
        case "3": aggregationSubMenu("arrays"); break;
        case "4": aggregationSubMenu("embedded"); break;
        case "5": mainMenu(); break;
        default: 
            console.log("❌ Opción inválida");
            aggregationMenu();
        }
    });
    };

    const aggregationSubMenu = (type) => {
    const endpoints = {
        simples: [
        { name: "Contar usuarios", endpoint: "countUsers" },
        { name: "Géneros distintos", endpoint: "distinctGenders" },
        { name: "Conteo por categoría", endpoint: "countByCategory" },
        { name: "Tags de menú distintos", endpoint: "distinctMenuTags" },
        { name: "Órdenes entregadas", endpoint: "countDeliveredOrders" }
        ],
        complejas: [
        { name: "Top restaurantes", endpoint: "topRestaurants" },
        { name: "Ventas por día", endpoint: "salesByWeekday" },
        { name: "Rating promedio", endpoint: "avgRatingPerRestaurant" },
        { name: "Valor promedio orden", endpoint: "avgOrderValue" },
        { name: "Tags populares", endpoint: "mostPopularTags" },
        { name: "Promociones activas", endpoint: "activePromotions" },
        { name: "Tiempo entrega promedio", endpoint: "avgDeliveryTime" },
        { name: "Órdenes por usuario", endpoint: "ordersPerUser" },
        { name: "Ventas por categoría", endpoint: "totalSalesByCategory" },
        { name: "Nuevos usuarios mensuales", endpoint: "monthlyNewUsers" }
        ],
        arrays: [
        { name: "Agregar tag a menú", endpoint: "pushTagToMenu" },
        { name: "Eliminar tag de menú", endpoint: "pullTagFromMenu" },
        { name: "Agregar ítem único a promoción", endpoint: "addUniqueItemToPromo" },
        { name: "Eliminar primer tag", endpoint: "popFirstItemFromMenu" },
        { name: "Eliminar múltiples tags", endpoint: "pullAllTags" }
        ],
        embedded: [
        { name: "Usuario con órdenes", endpoint: "userWithOrders" },
        { name: "Agregar dirección", endpoint: "addAddressToUser" },
        { name: "Fusionar perfil", endpoint: "mergeProfileData" },
        { name: "Obtener dirección", endpoint: "getUserAddressAsRoot" },
        { name: "Proyectar órdenes", endpoint: "projectEmbeddedOrders" }
        ]
    };

    console.log(`\n=== ${type.toUpperCase()} ===`);
    endpoints[type].forEach((ep, index) => {
        console.log(`${index + 1}. ${ep.name}`);
    });
    console.log(`${endpoints[type].length + 1}. Volver`);

    rl.question("\nSeleccione una opción: ", async (option) => {
        const selected = endpoints[type][parseInt(option) - 1];
        if(selected) {
        try {
            const response = await axios.get(`${BASE_URL}/aggregations/${type}/${selected.endpoint}`);
            console.log("\nResultado:");
            console.table(response.data);
        } catch(error) {
            console.log("❌ Error:", error.response?.data?.error || error.message);
        }
        }
        aggregationMenu();
    });
    };

    // ================================================
    // Funciones CRUD Genéricas
    // ================================================
    const createEntity = async (entity) => {
        const fields = await getEntityFields(entity);
        const data = {};
        
        for(const field of fields) {
          if (field === 'longitud' || field === 'latitud') {
            if (!data.ubicacion) {
              data.ubicacion = {
                type: 'Point',
                coordinates: []
              };
            }
            const value = parseFloat(await askQuestion(`${field}: `));
            if (isNaN(value)) throw new Error(`${field} debe ser un número`);
            data.ubicacion.coordinates.push(value);
          } else {
            data[field] = await askQuestion(`${field}: `);
          }
        }
      
        // Convertir edad a número
        if (entity === 'users') data.edad = Number(data.edad);
        
        try {
          const response = await axios.post(`${BASE_URL}/${entity}`, data);
          console.log("✅ Creado exitosamente:", response.data);
        } catch(error) {
          console.log("❌ Error:", error.response?.data?.error || error.message);
        }
        entityMenu(entity);
      };

    const listEntities = async (entity, all) => {
    try {
        const endpoint = all ? `${entity}/all` : entity;
        const response = await axios.get(`${BASE_URL}/${endpoint}`);
        console.log(`\n📄 Listado (${all ? 'todos' : 'paginado'}):`);
        console.table(response.data);
    } catch(error) {
        console.log("❌ Error:", error.response?.data?.error || error.message);
    }
    entityMenu(entity);
    };

    const getEntityById = async (entity) => {
    const id = await askQuestion("ID: ");
    
    try {
        const response = await axios.get(`${BASE_URL}/${entity}/${id}`);
        console.log("\n🔍 Resultado:");
        console.log(response.data);
    } catch(error) {
        console.log("❌ Error:", error.response?.data?.error || error.message);
    }
    entityMenu(entity);
    };

    const updateEntity = async (entity) => {
    const id = await askQuestion("ID a actualizar: ");
    const fields = await getEntityFields(entity);
    const updates = {};
    
    for(const field of fields) {
        const value = await askQuestion(`${field} (dejar vacío para omitir): `);
        if(value) updates[field] = value;
    }
    
    try {
        const response = await axios.put(`${BASE_URL}/${entity}/${id}`, updates);
        console.log("✅ Actualizado:", response.data);
    } catch(error) {
        console.log("❌ Error:", error.response?.data?.error || error.message);
    }
    entityMenu(entity);
    };

    const deleteEntity = async (entity) => {
    const id = await askQuestion("ID a eliminar: ");
    
    try {
        const response = await axios.delete(`${BASE_URL}/${entity}/${id}`);
        console.log("🗑️ Eliminado:", response.data);
    } catch(error) {
        console.log("❌ Error:", error.response?.data?.error || error.message);
    }
    entityMenu(entity);
    };

    // ================================================
    // Operaciones Bulk
    // ================================================
    const bulkOperation = async (entity, operation) => {
        const filePath = await askQuestion("Ruta del archivo JSON: ");
        
        try {
          const data = JSON.parse(fs.readFileSync(path.resolve(filePath)));
      
          // Si es una operación de actualización, pedimos qué campos actualizar
          if (operation === "update") {
            const campo = await askQuestion('¿Qué campo deseas actualizar? (nombre, edad, genero, ubicacion): ');
            const nuevoValor = await askQuestion(`Nuevo valor para ${campo}: `);
            
            // Actualizamos los datos con el campo y valor proporcionado
            data.forEach(usuario => {
              usuario[campo] = nuevoValor; // Se modifica el campo con el nuevo valor
            });
          }
      
          let response;
          
          switch(operation) {
            case "create":
              response = await axios.post(`${BASE_URL}/${entity}/bulk`, data);
              break;
            case "update":
              response = await axios.put(`${BASE_URL}/${entity}/bulk/update`, data);
              break;
            case "delete":
              response = await axios.delete(`${BASE_URL}/${entity}/bulk/delete`, { data });
              break;
          }
          
          console.log(`✅ Bulk ${operation} exitoso:`, response.data);
        } catch (error) {
          console.log("❌ Error:", error.response?.data?.error || error.message);
        }
        entityMenu(entity);
      };
      

    // ================================================
    // Funciones para Archivos
    // ================================================
    const uploadFile = async () => {
    const filePath = await askQuestion("Ruta del archivo a subir: ");
    
    try {
        const fileStream = fs.createReadStream(filePath);
        const formData = new FormData();
        formData.append("file", fileStream);
        
        const response = await axios.post(`${BASE_URL}/files/upload`, formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
        });
        
        console.log("✅ Archivo subido:", response.data);
    } catch(error) {
        console.log("❌ Error:", error.response?.data?.error || error.message);
    }
    fileMenu();
    };

    const listFiles = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/files`);
        console.log("\n📁 Archivos almacenados:");
        console.table(response.data);
    } catch(error) {
        console.log("❌ Error:", error.response?.data?.error || error.message);
    }
    fileMenu();
    };

    const downloadFile = async () => {
    const filename = await askQuestion("Nombre del archivo: ");
    
    try {
        const response = await axios.get(`${BASE_URL}/files/${filename}`, {
        responseType: "stream"
        });
        
        const savePath = path.join(__dirname, filename);
        const writer = fs.createWriteStream(savePath);
        
        response.data.pipe(writer);
        
        console.log(`✅ Archivo descargado en: ${savePath}`);
    } catch(error) {
        console.log("❌ Error:", error.response?.data?.error || error.message);
    }
    fileMenu();
    };

    const deleteFile = async () => {
    const filename = await askQuestion("Nombre del archivo a eliminar: ");
    
    try {
        const response = await axios.delete(`${BASE_URL}/files/${filename}`);
        console.log("🗑️ Archivo eliminado:", response.data);
    } catch(error) {
        console.log("❌ Error:", error.response?.data?.error || error.message);
    }
    fileMenu();
    };

    // ================================================
    // Funciones Auxiliares
    // ================================================
    const getEntityFields = async (entity) => {
    const fieldsMap = {
        users: ["nombre", "email", "genero", "edad", "longitud", "latitud"],
        restaurants: ["nombre", "categorias", "direccion", "telefono"],
        menu: ["nombre", "descripcion", "precio", "tags"],
        orders: ["usuario", "restaurante", "items", "total"],
        promotions: ["nombre", "descripcion", "descuento", "fechaInicio"],
        reviews: ["usuario", "restaurante", "calificacion", "comentario"],
        payments: ["orden", "metodo", "monto", "estado"]
    };
    
    return fieldsMap[entity] || [];
    };

    const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
    };

    // Iniciar la aplicación
    console.log("🍔 RESTAURANT MANAGEMENT SYSTEM CLI");
    mainMenu();