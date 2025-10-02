import {
  Clock, 
  CheckCircle, 
  XCircle, 
  Slash, 
  Award, 
  PieChart, 
  Undo2 
} from 'lucide-react';

export const RESERVATION_STATUS = {
  pending: { label: 'Pendiente', color: 'amber', bgColor: 'bg-amber-100', textColor: 'text-amber-800', icon: Clock },
  confirmed: { label: 'Confirmada', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: CheckCircle },
  rejected: { label: 'Rechazada', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800', icon: XCircle },
  cancelled: { label: 'Cancelada', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800', icon: Slash },
  completed: { label: 'Completada', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800', icon: Award }
};

export const PAYMENT_STATUS = {
  pending: { label: 'Pendiente', color: 'amber', bgColor: 'bg-amber-100', textColor: 'text-amber-800', icon: Clock },
  partial: { label: 'Parcial', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800', icon: PieChart },
  paid: { label: 'Pagado', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: CheckCircle },
  refunded: { label: 'Reembolsado', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: Undo2 }
};

export const USER_ROLES = {
  administrador: { label: 'Administrador', color: 'purple' },
  gestor: { label: 'Gestor', color: 'blue' },
  asesor: { label: 'Asesor', color: 'green' }
};

// Permisos de módulos por rol
export const MODULE_PERMISSIONS = {
  dashboard: ['administrador', 'gestor', 'asesor'],
  reservations: ['asesor'], // Solo asesores pueden crear reservas
  gestion: ['administrador', 'gestor'], // Solo admin y gestor pueden ver todas las reservas
  documentation: ['administrador', 'gestor', 'asesor'],
  finance: ['administrador'], // Solo administradores
  reports: ['administrador', 'gestor'],
  analytics: ['administrador', 'gestor'],
  notifications: ['administrador', 'gestor', 'asesor'],
  profile: ['administrador', 'gestor', 'asesor'],
  settings: [] // Solo super admin (se valida por separado)
};

// Helper para verificar permisos básicos
export const hasPermission = (user, allowedRoles) => {
  // Super admins tienen acceso a todo
  if (user?.isSuperAdmin) return true;
  // Verificar si el rol del usuario está en los roles permitidos
  return allowedRoles.includes(user?.role);
};

// Helper para verificar acceso a módulos
export const canAccessModule = (user, moduleName) => {
  if (!user) return false;

  // Super admin tiene acceso a todo
  if (user.isSuperAdmin) return true;

  // Configuración es solo para super admin
  if (moduleName === 'settings') return user.isSuperAdmin;

  // Verificar permisos del módulo
  const allowedRoles = MODULE_PERMISSIONS[moduleName] || [];
  return allowedRoles.includes(user.role);
};

// Helper para verificar si puede editar reservas
export const canEditReservation = (user, reservation) => {
  if (!user || !reservation) return false;

  // Super admin puede editar todo
  if (user.isSuperAdmin) return true;

  // Administrador puede editar todas las reservas de su oficina
  if (user.role === 'administrador') {
    return !user.officeId || reservation.office_id === user.officeId;
  }

  // Gestor solo puede editar reservas que ya están confirmadas
  // NO puede editar reservas pendientes (esas las aprueba el admin)
  if (user.role === 'gestor') {
    return reservation.status === 'confirmed';
  }

  // Asesor solo puede editar sus propias reservas pendientes o rechazadas
  // Una vez confirmada, ya no puede editarla
  if (user.role === 'asesor') {
    const isOwner = reservation.created_by === user.id || reservation.user_id === user.id;
    const canEditStatus = reservation.status === 'pending' || reservation.status === 'rejected';
    return isOwner && canEditStatus;
  }

  return false;
};

// Helper para verificar si puede aprobar/rechazar reservas
export const canApproveReservation = (user, reservation) => {
  if (!user || !reservation) return false;

  // Solo se pueden aprobar reservas pendientes
  if (reservation.status !== 'pending') return false;

  // Super admin puede aprobar todo
  if (user.isSuperAdmin) return true;

  // Solo administradores pueden aprobar/rechazar
  // Y solo las reservas de su oficina
  if (user.role === 'administrador') {
    return !user.officeId || reservation.office_id === user.officeId;
  }

  // Gestores NO pueden aprobar, solo ver
  return false;
};

// Helper para verificar si puede ver datos de una oficina
export const canAccessOffice = (user, officeId) => {
  if (!user) return false;

  // Super admin tiene acceso a todas las oficinas
  if (user.isSuperAdmin) return true;

  // Gestor tiene acceso a todas las oficinas
  if (user.role === 'gestor') return true;

  // Administrador solo tiene acceso a su oficina asignada
  if (user.role === 'administrador') {
    return !user.officeId || user.officeId === officeId;
  }

  // Asesor solo tiene acceso a su oficina
  if (user.role === 'asesor') {
    return !user.officeId || user.officeId === officeId;
  }

  return false;
};

// Helper para filtrar reservas según el rol del usuario
export const filterReservationsByRole = (reservations, user) => {
  if (!user || !Array.isArray(reservations)) return [];

  // Super admin ve todas las reservas
  if (user.isSuperAdmin) return reservations;

  // Gestor ve todas las reservas
  if (user.role === 'gestor') return reservations;

  // Administrador ve todas las reservas de su oficina
  if (user.role === 'administrador') {
    if (!user.officeId) return reservations;
    return reservations.filter(r => r.office_id === user.officeId);
  }

  // Asesor solo ve sus propias reservas
  if (user.role === 'asesor') {
    return reservations.filter(r =>
      r.created_by === user.id || r.user_id === user.id
    );
  }

  return [];
};