// app/lib/authHelpers.ts
// Helpers para verificación de autenticación en API routes (server-side)

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const ADMIN_EMAIL = "sara.fernandez@run4wish.com";

/**
 * Verifica si el usuario está autenticado y es administrador
 * Intenta dos métodos: cookies (sesión normal) y Bearer token (header Authorization)
 * @param request Request para leer headers y cookies
 * @returns { ok: boolean, error?: "not_authenticated", email?: string }
 */
export async function verifyAdminAuth(request: Request) {
  console.log("[IA ADMIN] intentando autenticar…");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

    const { data: { user }, error: cookieError } = await supabaseFromCookies.auth.getUser();
    if (!cookieError && user) {
      userFromCookies = user;
    }
  } catch (err) {
    console.log("[IA ADMIN] error con cookies:", err);
  }

  // ============================================
  // MÉTODO 2: Intentar con Bearer token (header Authorization)
  // ============================================
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const supabaseFromBearer = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      const { data: { user }, error: bearerError } = await supabaseFromBearer.auth.getUser(token);
      if (!bearerError && user) {
        userFromBearer = user;
      }
    }
  } catch (err) {
    console.log("[IA ADMIN] error con bearer:", err);
  }

  // ============================================
  // Decidir qué usuario usar
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
  // Verificar si es administrador
  // ============================================
  const isAdmin = userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (!isAdmin) {
    const result = { ok: false, error: "forbidden" as const };
    console.log("[IA ADMIN] resultado final ->", result);
    return result;
  }

  const result = { ok: true, email: userEmail };
  console.log("[IA ADMIN] resultado final ->", result);
  return result;
}
