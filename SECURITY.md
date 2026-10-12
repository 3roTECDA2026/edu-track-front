# Guía de Seguridad para Desarrolladores Frontend (edu-track-front)

Este documento describe el estado actual de la seguridad en el proyecto frontend de Notar.

## 1. Postura de Seguridad Actual: Implementación de Prototipo

La aplicación frontend de Notar opera actualmente con una implementación de seguridad a nivel de prototipo. No se ha implementado autenticación real en el frontend.

*   **Estado de Autenticación:** El acceso a la mayoría de las rutas y funcionalidades de la aplicación es directo y no requiere autenticación o permisos específicos a nivel de frontend.
*   **Archivos de Referencia:**
    *   `src/routes/AppRouter.tsx`: Este archivo define las rutas de la aplicación. Se observa que múltiples rutas son accesibles públicamente sin verificaciones de sesión o rol, incluyendo `/home`, `/courses`, `/attendance`, `/students`, `/calification-grid`, y `/users`.

## 2. Implicaciones para el Desarrollo

*   **Delegación de Seguridad al Backend:** La seguridad de la aplicación (autenticación y autorización) debe ser implementada y validada exclusivamente en el backend. El frontend no debe ser considerado una capa de seguridad confiable.
*   **Cobertura de Pruebas de Seguridad:** Actualmente, no existen pruebas de seguridad específicas para el frontend. El comando `npm test` no reporta archivos de prueba y termina con error.
*   **Hoja de Ruta Futura:** La implementación de un sistema robusto de autenticación y gestión de roles es una prioridad futura. Esto implicará la adaptación de la interfaz de usuario y la funcionalidad según el rol del usuario, así como la introducción de pruebas de seguridad adecuadas.

## 3. Recomendaciones

*   Al desarrollar funcionalidades, considerar la ausencia de autenticación a nivel de frontend.
*   Cualquier cambio relacionado con la seguridad o el acceso debe ser coordinado con las implementaciones de seguridad del backend.

## 4. Dependencias (actualizado 2026-09-30)

*   **Auditoría:** `npm audit` reportaba 2 vulnerabilidades high (`brace-expansion` 4.0.0-5.0.11, `undici` 8.0.0-8.10.1). Se aplicó `npm audit fix` (`brace-expansion` 5.0.9 => 5.0.12, `undici` 8.10.0 => 8.11.2). Resultado: **0 vulnerabilidades**. Verificación: `npm run build` (vite) OK.
*   **Política decidida (no freeze):** se mantienen rangos `^` en `package.json` para recibir parches de seguridad; la reproducibilidad la garantiza `package-lock.json` commiteado. Instalar siempre con `npm ci`, nunca `npm install` en CI/deploy.
*   **Mantenimiento:** correr `npm audit` ante cada cambio de dependencias y `npm audit fix` para parches compatibles; los cambios de major se evalúan aparte.
