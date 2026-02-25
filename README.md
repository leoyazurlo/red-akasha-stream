# 🎵 Red Akasha — Plataforma de Streaming para Artistas

Red Akasha es una plataforma colaborativa de streaming 24/7 diseñada para artistas, productores, DJs, músicos, venues y espacios culturales. Combina herramientas de producción audiovisual, un foro comunitario, un sistema de monetización y un asistente de IA integrado.

🌐 **Demo en vivo:** [https://red-akasha-stream.lovable.app](https://red-akasha-stream.lovable.app)

---

## 🛠 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Estilos** | Tailwind CSS, shadcn/ui, Radix UI |
| **Estado** | TanStack React Query, Context API |
| **Routing** | React Router v6 (SPA con lazy loading) |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| **IA** | Lovable AI Gateway (Gemini, GPT) |
| **PWA** | vite-plugin-pwa, Service Worker personalizado |
| **i18n** | i18next (9 idiomas) |
| **Gráficos** | Recharts |
| **Mapas** | Mapbox GL |

---

## 📦 Instalación Local

### Prerrequisitos

- [Node.js](https://nodejs.org/) ≥ 18
- [Bun](https://bun.sh/) o npm
- Un proyecto de Supabase (o Lovable Cloud conectado)

### Pasos

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd red-akasha-stream

# 2. Instalar dependencias
bun install
# o: npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales (ver sección siguiente)

# 4. Iniciar en modo desarrollo
bun run dev
# o: npm run dev

# La app estará disponible en http://localhost:8080
```

---

## 🔐 Variables de Entorno

Crear un archivo `.env` basado en `.env.example`:

| Variable | Descripción | Requerida |
|----------|------------|-----------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (ej: `https://xxx.supabase.co`) | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave pública (anon key) de Supabase | ✅ |
| `VITE_SUPABASE_PROJECT_ID` | ID del proyecto Supabase | ✅ |
| `VITE_STORAGE_PROVIDER` | Provider de storage: `supabase` (default), `cloudflare-r2`, `aws-s3` | ❌ |

### Secrets del Backend (Edge Functions)

Estos se configuran en el panel de Lovable Cloud o Supabase Dashboard:

| Secret | Descripción |
|--------|------------|
| `LOVABLE_API_KEY` | Clave para el gateway de IA de Lovable |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (solo backend, nunca en frontend) |

> ⚠️ **Nunca** incluyas la `SERVICE_ROLE_KEY` en el código frontend ni en el `.env` del cliente.

---

## 🚀 Deploy

### Netlify

1. Conectar el repositorio en [Netlify](https://app.netlify.com/)
2. Configurar:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Agregar las variables de entorno en **Site Settings → Environment Variables**
4. El archivo `public/_redirects` ya está configurado para SPA routing

### Vercel

1. Importar el proyecto en [Vercel](https://vercel.com/)
2. Configurar:
   - **Framework Preset:** Vite
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. Agregar las variables de entorno en **Settings → Environment Variables**
4. El archivo `vercel.json` ya incluye los rewrites necesarios

### Lovable

Hacer clic en **Publish** desde el editor de Lovable. El deploy es automático.

---

## 🗃 Migraciones de Base de Datos

Las migraciones SQL se encuentran en `supabase/migrations/`. Para aplicarlas:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Conectar al proyecto
supabase link --project-ref <PROJECT_ID>

# Aplicar migraciones pendientes
supabase db push
```

> En Lovable Cloud, las migraciones se aplican automáticamente al ser aprobadas en el editor.

---

## 📁 Estructura del Proyecto

```
red-akasha-stream/
├── public/                  # Assets estáticos, SW, favicons, _redirects
├── src/
│   ├── assets/              # Imágenes y logos (importados como módulos ES6)
│   ├── components/          # Componentes React organizados por dominio
│   │   ├── admin/           #   Panel de administración
│   │   ├── akasha-ia/       #   App Builder IDE y asistente IA
│   │   ├── artists/         #   Tarjetas y perfiles de artistas
│   │   ├── forum/           #   Foro comunitario
│   │   ├── notifications/   #   Sistema de notificaciones
│   │   ├── ondemand/        #   Reproductor bajo demanda
│   │   ├── profile/         #   Perfil de usuario
│   │   ├── profile-forms/   #   Formularios por tipo de perfil
│   │   ├── upload/          #   Subida de contenido
│   │   └── ui/              #   shadcn/ui + componentes base
│   ├── contexts/            # Providers globales (chat, player, streaming)
│   ├── hooks/               # Hooks personalizados (auth, storage, analytics)
│   ├── i18n/                # Internacionalización (9 idiomas)
│   ├── integrations/        # Cliente Supabase (auto-generado)
│   ├── lib/                 # Utilidades, constantes, validaciones, tipos
│   ├── pages/               # Páginas/rutas de la app
│   │   ├── admin/           #   Rutas del panel admin
│   │   └── artist/          #   Analytics de artista
│   ├── App.tsx              # Router principal con lazy loading
│   └── main.tsx             # Entry point + Web Vitals
├── supabase/
│   ├── functions/           # Edge Functions (IA, auth, webhooks)
│   ├── migrations/          # Migraciones SQL
│   └── config.toml          # Configuración del proyecto
├── .env.example             # Template de variables de entorno
├── vercel.json              # Config de deploy para Vercel
├── vite.config.ts           # Config de Vite con code splitting
└── tailwind.config.ts       # Tokens de diseño y temas
```

---

## 🔑 Funcionalidades Principales

- **Streaming en vivo** con chat en tiempo real y donaciones
- **Contenido on-demand** con reproductor y cola de reproducción
- **Foro comunitario** con menciones, badges, moderación y votaciones
- **Perfiles especializados** (músico, DJ, productor, venue, sello discográfico, etc.)
- **Monetización** de contenido premium (compra, alquiler, suscripción)
- **App Builder IA** para generar componentes y funciones desde la plataforma
- **Sistema de notificaciones** en tiempo real
- **PWA** con soporte offline y media session
- **Mapa de artistas en vivo** con geolocalización
- **Panel de administración** completo con auditoría y analytics
- **Multilenguaje** (ES, EN, PT, FR, DE, IT, RU, KO, ZH)

---

## 📄 Licencia

Proyecto privado — Red Akasha © 2025-2026. Todos los derechos reservados.
