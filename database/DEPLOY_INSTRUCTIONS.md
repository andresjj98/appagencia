# Instrucciones de Despliegue - Base de Datos

## Orden de Ejecución de Scripts

Para aplicar los cambios en la base de datos, ejecuta los scripts SQL en el siguiente orden:

### 1. Actualizar función de actualización de reservas
**Archivo:** `update_full_reservation function.sql`

**Cambios realizados:**
- Modificada para preservar datos existentes cuando no se envían en el payload
- Solo borra y actualiza segmentos, vuelos, hoteles, tours, asistencias y transfers si vienen en el payload

**Cómo ejecutar:**
```sql
-- Esta función debe reemplazar la función existente
-- Ejecuta todo el contenido del archivo en tu cliente SQL (Supabase Dashboard, pgAdmin, etc.)
```

### 2. Crear funciones CRUD para pasajeros
**Archivo:** `passenger_crud_functions.sql`

**Funciones nuevas creadas:**
- `upsert_passengers`: Actualiza o inserta pasajeros para una reserva
- `get_passengers_by_reservation`: Obtiene todos los pasajeros de una reserva
- `delete_passenger`: Elimina un pasajero específico

**Cómo ejecutar:**
```sql
-- Ejecuta todo el contenido del archivo en tu cliente SQL
-- Estas son funciones nuevas, no reemplazan nada existente
```

### 3. Verificar permisos (IMPORTANTE)

Después de ejecutar los scripts, debes otorgar permisos a las funciones según tus roles de usuario:

```sql
-- Ejemplo: otorgar permisos al rol 'authenticated' (ajustar según tu configuración)
GRANT EXECUTE ON FUNCTION public.upsert_passengers TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_passengers_by_reservation TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_passenger TO authenticated;

-- Si usas otros roles específicos, reemplaza 'authenticated' con el nombre del rol
```

## Verificación de Despliegue

Para verificar que las funciones se crearon correctamente:

```sql
-- Listar todas las funciones relacionadas con pasajeros
SELECT
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('upsert_passengers', 'get_passengers_by_reservation', 'delete_passenger');

-- Verificar que update_full_reservation tenga los cambios
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'update_full_reservation';
```

## Rollback (En caso de problemas)

Si necesitas revertir los cambios:

### Revertir funciones de pasajeros
```sql
DROP FUNCTION IF EXISTS public.upsert_passengers(BIGINT, JSONB);
DROP FUNCTION IF EXISTS public.get_passengers_by_reservation(BIGINT);
DROP FUNCTION IF EXISTS public.delete_passenger(BIGINT);
```

### Revertir update_full_reservation
Tendrías que restaurar la versión anterior de la función desde un backup o historial de versiones.

## Notas Importantes

1. **Backup:** Antes de ejecutar cualquier cambio, haz un backup de tu base de datos
2. **Ambiente de prueba:** Si es posible, prueba primero en un ambiente de desarrollo
3. **Transacciones:** Puedes envolver los comandos en una transacción para poder hacer rollback:

```sql
BEGIN;

-- Ejecutar scripts aquí

-- Si todo está bien:
COMMIT;

-- Si algo salió mal:
ROLLBACK;
```

## Testing Post-Despliegue

Después de desplegar, prueba las siguientes operaciones:

1. **Agregar pasajeros a una reserva existente**
   - Verificar que los segmentos, vuelos, hoteles, etc. se mantienen

2. **Editar información de titular sin enviar pasajeros**
   - Verificar que los pasajeros existentes no se borran

3. **Actualizar lista de pasajeros**
   - Verificar que se guardan correctamente en la base de datos

## Problemas Comunes

### Error: "function does not exist"
- Verifica que el schema sea correcto (public)
- Asegúrate de que la función se creó correctamente

### Error: "permission denied"
- Ejecuta los comandos GRANT para dar permisos a los usuarios

### Error: "constraint violation"
- Verifica que la reserva existe antes de agregar pasajeros
- Verifica que los tipos de datos coincidan con el schema
