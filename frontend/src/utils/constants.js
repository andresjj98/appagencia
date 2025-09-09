export const RESERVATION_STATUS = {
  pending: { label: 'Pendiente', color: 'amber', bgColor: 'bg-amber-100', textColor: 'text-amber-800' },
  confirmed: { label: 'Confirmada', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  rejected: { label: 'Rechazada', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  cancelled: { label: 'Cancelada', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  completed: { label: 'Completada', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' }
};

export const PAYMENT_STATUS = {
  pending: { label: 'Pendiente', color: 'amber', bgColor: 'bg-amber-100', textColor: 'text-amber-800' },
  partial: { label: 'Parcial', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  paid: { label: 'Pagado', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  refunded: { label: 'Reembolsado', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
};

export const USER_ROLES = {
  admin: { label: 'Administrador', color: 'purple' },
  manager: { label: 'Gestor', color: 'blue' },
  advisor: { label: 'Asesor', color: 'green' }
};