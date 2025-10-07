import React, { useState, useEffect } from 'react';
import { Clock, User, FileEdit, CheckCircle, XCircle, AlertCircle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import ChangeRequestManager from './ChangeRequestManager';

const HistoryTab = ({ reservation, onUpdate }) => {
  const { created_at, updated_at } = reservation._original;
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [reservation.id]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/reservations/${reservation.id}/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activityType) => {
    const icons = {
      reservation_created: Clock,
      status_changed: Activity,
      change_request_created: FileEdit,
      change_request_approved: CheckCircle,
      change_request_rejected: XCircle,
      change_request_applied: CheckCircle,
      payment_registered: CheckCircle,
      document_uploaded: FileEdit,
      service_confirmed: CheckCircle
    };
    return icons[activityType] || Activity;
  };

  const getActivityColor = (activityType) => {
    const colors = {
      reservation_created: 'text-blue-600',
      status_changed: 'text-purple-600',
      change_request_created: 'text-orange-600',
      change_request_approved: 'text-green-600',
      change_request_rejected: 'text-red-600',
      change_request_applied: 'text-green-600',
      payment_registered: 'text-green-600',
      document_uploaded: 'text-blue-600',
      service_confirmed: 'text-teal-600'
    };
    return colors[activityType] || 'text-gray-600';
  };

  return (
    <div className="space-y-8">
      {/* Solicitudes de Cambio */}
      <ChangeRequestManager reservation={reservation._original} onUpdate={() => { onUpdate(); fetchActivities(); }} />

      {/* Historial de Actividades */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Historial de Actividades
        </h3>

        {loading ? (
          <div className="p-4 bg-white rounded-lg border border-gray-200 text-center text-gray-500">
            Cargando historial...
          </div>
        ) : activities.length === 0 ? (
          <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Creada el: <span className="font-medium">{new Date(created_at).toLocaleString()}</span>
            </p>
            <p className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Última modificación: <span className="font-medium">{new Date(updated_at).toLocaleString()}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.activity_type);
              const iconColor = getActivityColor(activity.activity_type);

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{activity.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {activity.performed_by_name} ({activity.performed_by_role})
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>

                      {activity.changes && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer hover:underline">
                            Ver detalles de los cambios
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                            {JSON.stringify(activity.changes, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;
