const { supabaseAdmin } = require('../supabase');

// Get all notifications for a user
const getUserNotifications = async (req, res) => {
  const { userId } = req.params;
  const { unreadOnly, limit, offset } = req.query;

  try {
    let query = supabaseAdmin
      .from('notifications')
      .select(`
        *,
        sender:sender_id(id, name, role),
        recipient:recipient_id(id, name)
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    // Filter by read status if requested
    if (unreadOnly === 'true') {
      query = query.eq('read', false);
    }

    // Apply pagination
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    if (offset) {
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ message: 'Error al obtener notificaciones' });
    }

    res.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Get unread count for a user
const getUnreadCount = async (req, res) => {
  const { userId } = req.params;

  try {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error counting unread notifications:', error);
      return res.status(500).json({ message: 'Error al contar notificaciones' });
    }

    res.json({ count: count || 0 });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({ message: 'Error al marcar como leída' });
    }

    res.json({ message: 'Notificación marcada como leída', notification: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Mark notification as unread
const markAsUnread = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({
        read: false,
        read_at: null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as unread:', error);
      return res.status(500).json({ message: 'Error al marcar como no leída' });
    }

    res.json({ message: 'Notificación marcada como no leída', notification: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Mark all notifications as read for a user
const markAllAsRead = async (req, res) => {
  const { userId } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('recipient_id', userId)
      .eq('read', false)
      .select();

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json({ message: 'Error al marcar todas como leídas' });
    }

    res.json({
      message: 'Todas las notificaciones marcadas como leídas',
      count: data.length
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ message: 'Error al eliminar notificación' });
    }

    res.json({ message: 'Notificación eliminada correctamente' });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Create a manual notification (for admin use)
const createNotification = async (req, res) => {
  const {
    recipient_id,
    sender_id,
    type,
    title,
    message,
    reference_id,
    reference_type,
    metadata
  } = req.body;

  try {
    // Validate required fields
    if (!recipient_id || !type || !title || !message) {
      return res.status(400).json({
        message: 'Faltan campos requeridos: recipient_id, type, title, message'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        recipient_id,
        sender_id,
        type,
        title,
        message,
        reference_id,
        reference_type,
        metadata
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return res.status(500).json({ message: 'Error al crear notificación' });
    }

    res.status(201).json({
      message: 'Notificación creada correctamente',
      notification: data
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  createNotification
};
