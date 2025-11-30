// app/lib/authHelpers.ts
// Helpers para verificación de autenticación en API routes (server-side)

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Verifica si el usuario está autenticado
 * Intenta dos métodos: cookies (sesión normal) y Bearer token (header Authorization)
 * @param request Request para leer headers y cookies
 * @returns { ok: boolean, error?: "not_authenticated", email?: string }
 */
export async function verifyAdminAuth(request: Request) {
  console.log("[IA ADMIN] intentando autenticar…");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("[IA ADMIN] faltan variables de entorno de Supabase");
    return {
      ok: false,
      error: "not_authenticated",
    };
  }

  let userFromCookies = null;
  let userFromBearer = null;

      // ============================================
      // MÉTODO 1: Intentar con cookies (sesión normal)
      // ============================================
      try {
        const cookieStore = await cookies();
        
        // Crear cliente de Supabase con storage personalizado para leer cookies
        const supabaseFromCookies = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            storage: {
              getItem: (key: string) => {
                const allCookies = cookieStore.getAll();
            for (const cookie of allCookies) {
              if (cookie.name === key || cookie.name.includes(key)) {
                return cookie.value;
              }
            }
            return null;
          },
          setItem: () => {},
          removeItem: () => {},
        },
      },
    });

    // Intentar obtener sesión desde cookies
    const { data: { session }, error: sessionError } = await supabaseFromCookies.auth.getSession();
    
    if (!sessionError && session?.user) {
      userFromCookies = session.user;
    } else {
      // Si getSession no funciona, intentar leer manualmente las cookies
      const projectRef = supabaseUrl.split("//")[1].split(".")[0];
      const cookieName = `sb-${projectRef}-auth-token`;
      const authCookie = cookieStore.get(cookieName)?.value;

      if (authCookie) {
        try {
          const parsed = JSON.parse(authCookie);
          const token = parsed.access_token || parsed;
          if (token && typeof token === "string") {
            const { data: { user }, error: userError } = await supabaseFromCookies.auth.getUser(token);
            if (!userError && user) {
              userFromCookies = user;
            }
          }
        } catch {
          // Si no es JSON, intentar como token directo
          if (typeof authCookie === "string" && authCookie.length > 50) {
            const { data: { user }, error: userError } = await supabaseFromCookies.auth.getUser(authCookie);
            if (!userError && user) {
              userFromCookies = user;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("[IA ADMIN] error leyendo cookies:", error);
  }

  console.log("[IA ADMIN] vía cookies ->", userFromCookies?.email || "sin usuario");

  // ============================================
  // MÉTODO 2: Intentar con Bearer token (header Authorization)
  // ============================================
  if (!userFromCookies) {
    try {
      const authHeader = request.headers.get("authorization");
      
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const jwtToken = authHeader.replace("Bearer ", "").trim();
        
        if (jwtToken && supabaseServiceKey) {
          // Crear cliente de Supabase con SERVICE_ROLE_KEY para validar el token
          const supabaseFromBearer = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
          });

          const { data: { user }, error: userError } = await supabaseFromBearer.auth.getUser(jwtToken);
          
          if (!userError && user) {
            userFromBearer = user;
          }
        }
      }
    } catch (error) {
      console.error("[IA ADMIN] error leyendo bearer token:", error);
    }
  }

  console.log("[IA ADMIN] vía bearer ->", userFromBearer?.email || "sin usuario");

  // ============================================
  // Determinar usuario final
  // ============================================
  const user = userFromCookies || userFromBearer;

  if (!user) {
    const result = { ok: false, error: "not_authenticated" as const };
    console.log("[IA ADMIN] resultado final ->", result);
    return result;
  }

  const userEmail = user.email;

  if (!userEmail) {
    const result = { ok: false, error: "not_authenticated" as const };
    console.log("[IA ADMIN] resultado final ->", result);
    return result;
  }

  // ============================================
  // Usuario autenticado (sin verificación de administrador)
  // ============================================
  const result = { ok: true, email: userEmail };
  console.log("[IA ADMIN] resultado final ->", result);
  return result;
}

