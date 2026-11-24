# ITAPU · Fechas de exámenes — Frontend

React + Vite + TypeScript. Consume el backend (`sso-itapu-testApp-back`), que a su vez se integra con ITAPU SSO.

## Arranque

```bash
cp .env.example .env     # VITE_API_URL=http://localhost:3001/api
npm install
npm run dev              # http://localhost:5173  (puerto fijo: es parte de la Redirect URI del SSO)
```

Necesitás tener corriendo el SSO (`:3000`) y el backend (`:3001`).

## Qué ve cada usuario

- **Alumno** → entra directo a la vista de carpetas (solo lectura). Solo ve las carpetas habilitadas para su especialidad.
- **Personal** (cargo ∈ `STAFF_CARGOS` del backend) → panel de administración (CRUD de carpetas y PDFs) y un botón
  **Vista de alumno** para ver exactamente lo que ve un alumno, eligiendo la especialidad a previsualizar.

## Estructura

```
src/
├─ sso/          ← acoplamiento con el SSO: popup, postMessage, cierre automático (leer sso/README.md)
├─ api/          ← un archivo por recurso; los tipos espejan los DTOs del backend
│   ├─ http.ts           fetch con cookie HttpOnly, errores y manejo de 401
│   ├─ auth.api.ts       LoginUrlResponseDto · SsoCallbackDto · SessionUserDto
│   ├─ folders.api.ts    FolderDto · CreateFolderDto · UpdateFolderDto
│   ├─ files.api.ts      PdfFileDto · UploadPdfDto · UpdatePdfFileDto
│   ├─ library.api.ts    BrowseQueryDto · LibraryBrowseDto
│   └─ directory.api.ts  DirectoryDto (cargos y especialidades del SSO)
├─ auth/         ← AuthContext (sesión, signIn / signOut)
├─ components/   ← LibraryBrowser (compartido admin/alumno), modales, breadcrumbs…
├─ pages/        ← LoginPage · StaffHome · StudentHome
├─ lib/          ← utilidades (formato, árbol de carpetas)
└─ config/env.ts ← única variable de entorno: VITE_API_URL
```

Sin cargos ni especialidades hardcodeados: el front los pide al backend (`GET /api/directory`), que los consulta al SSO.
Sin tokens en el navegador: la sesión es una cookie `HttpOnly` que maneja el backend.
