// @desc    Actualizar el estado de un pedido
// @route   PUT /api/orders/:id/status
// @access  Private
exports.updateOrderStatus = async (req, res) => {
    try {
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: 'Se requiere un estado' });
      }
      
      // Validar que el estado sea válido
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Estado no válido' });
      }
      
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: 'Pedido no encontrado' });
      }
      
      // Si el pedido ya está entregado o cancelado, no permitir cambios
      if (order.status === 'delivered' || order.status === 'cancelled') {
        return res.status(400).json({ message: 'No se puede modificar un pedido entregado o cancelado' });
      }
      
      // Actualizar tiempo de entrega si el estado es "delivered"
      let updateData = { status };
      if (status === 'delivered') {
        updateData.actualDeliveryTime = new Date();
      }
      
      const updatedOrder = await Order.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true }
      );
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar el estado del pedido', error: error.message });
    }
  };
  
  // @desc    Obtener pedidos del usuario actual
  // @route   GET /api/orders/my-orders
  // @access  Private
  exports.getMyOrders = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Filtrado por estado si se proporciona
      const filter = { userId: req.user._id };
      if (req.query.status) {
        filter.status = req.query.status;
      }
      
      // Ordenamiento
      let sort = {};
      if (req.query.sort === 'oldest') {
        sort.createdAt = 1;
      } else {
        sort.createdAt = -1; // Default: más recientes primero
      }
      
      const orders = await Order.find(filter)
        .populate('restaurantId', 'name address')
        .sort(sort)
        .skip(skip)
        .limit(limit);
        
      const total = await Order.countDocuments(filter);
      
      res.json({
        orders,
        page,
        pages: Math.ceil(total / limit),
        total
      });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener pedidos', error: error.message });
    }
  };
  
  // @desc    Obtener un pedido por ID
  // @route   GET /api/orders/:id
  // @access  Private
  exports.getOrderById = async (req, res) => {
    try {
      const order = await Order.findById(req.params.id)
        .populate('restaurantId', 'name address contactInfo')
        .populate('userId', 'name email');
      
      if (!order) {
        return res.status(404).json({ message: 'Pedido no encontrado' });
      }
      
      // Verificar que el usuario es el propietario del pedido o tiene permisos administrativos
      if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'No autorizado' });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener el pedido', error: error.message });
    }
  };
  
  // @desc    Cancelar un pedido
  // @route   PUT /api/orders/:id/cancel
  // @access  Private
  exports.cancelOrder = async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: 'Pedido no encontrado' });
      }
      
      // Verificar que el usuario es el propietario del pedido
      if (order.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'No autorizado' });
      }
      
      // Solo se pueden cancelar pedidos pendientes o confirmados
      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({ message: 'No se puede cancelar un pedido en preparación o entregado' });
      }
      
      order.status = 'cancelled';
      await order.save();
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: 'Error al cancelar el pedido', error: error.message });
    }
  };
  
  // @desc    Actualizar los ítems de un pedido (agregar, quitar, modificar)
  // @route   PUT /api/orders/:id/items
  // @access  Private
  exports.updateOrderItems = async (req, res) => {
    try {
      const { items } = req.body;
      
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: 'Se requieren ítems válidos' });
      }
      
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({ message: 'Pedido no encontrado' });
      }
      
      // Solo se pueden modificar pedidos pendientes
      if (order.status !== 'pending') {
        return res.status(400).json({ message: 'Solo se pueden modificar pedidos pendientes' });
      }
      
      // Obtener detalles actualizados de los ítems del menú
      const itemIds = items.map(item => item.menuItemId);
      const menuItems = await MenuItem.find({ 
        _id: { $in: itemIds },
        restaurantId: order.restaurantId,
        isAvailable: true
      });
      
      if (menuItems.length !== itemIds.length) {
        return res.status(400).json({ message: 'Algunos ítems no están disponibles o no existen' });
      }
      
      // Crear mapa de ítems para fácil acceso
      const menuItemMap = menuItems.reduce((map, item) => {
        map[item._id.toString()] = item;
        return map;
      }, {});
      
      // Calcular monto total y preparar ítems con detalles
      let totalAmount = 0;
      const orderItems = items.map(item => {
        const menuItem = menuItemMap[item.menuItemId];
        const itemTotal = menuItem.price * item.quantity;
        totalAmount += itemTotal;
        
        return {
          menuItemId: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || ''
        };
      });
      
      // Actualizar el pedido
      order.items = orderItems;
      order.totalAmount = totalAmount;
      await order.save();
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: 'Error al actualizar los ítems del pedido', error: error.message });
    }
  };
  
  // @desc    Obtener pedidos de un restaurante
  // @route   GET /api/orders/restaurant/:restaurantId
  // @access  Private
  exports.getRestaurantOrders = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Filtrado por estado si se proporciona
      const filter = { restaurantId: req.params.restaurantId };
      if (req.query.status) {
        filter.status = req.query.status;
      }
      
      // Filtrado por fecha
      if (req.query.startDate && req.query.endDate) {
        filter.createdAt = {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate)
        };
      }
      
      // Ordenamiento
      let sort = {};
      if (req.query.sort === 'oldest') {
        sort.createdAt = 1;
      } else {
        sort.createdAt = -1; // Default: más recientes primero
      }
      
      const orders = await Order.find(filter)
        .populate('userId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit);
        
      const total = await Order.countDocuments(filter);
      
      res.json({
        orders,
        page,
        pages: Math.ceil(total / limit),
        total
      });
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener pedidos del restaurante', error: error.message });
    }
  };
  