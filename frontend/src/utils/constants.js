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
  admin: { label: 'Administrador', color: 'purple' },
  manager: { label: 'Gestor', color: 'blue' },
  advisor: { label: 'Asesor', color: 'green' }
};