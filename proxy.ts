import createMiddleware from "next-intl/middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { ADMIN_ROLES } from "./lib/constants/roles";
import type { UserRole } from "./types/database";

const handleI18nRouting = createMiddleware(routing);

// Rôles autorisés à accéder à /admin (défini dans lib/constants/roles.ts)

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((c) =>
    target.cookies.set(c.name, c.value, c),
  );
}

export async function proxy(req: NextRequest) {
  // ===== ÉTAPE 1 : Négociation de locale via next-intl =====
  // next-intl détecte la locale (préfixe URL -> cookie -> accept-language -> défaut),
  // redirige si le préfixe est absent et pose l'en-tête X-NEXT-INTL-LOCALE attendu
  // par getRequestLocale() pour résoudre les messages.
  const intlResponse = handleI18nRouting(req);

  // Si next-intl a redirigé (préfixe locale manquant), on renvoie directement
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  // La locale est toujours présente dans le chemin (localePrefix: "always")
  const { pathname } = req.nextUrl;
  const locale = routing.locales.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  ) ?? routing.defaultLocale;

  // Stripper le préfixe locale pour vérifier le chemin d'accès
  const pathWithoutLocale = pathname.replace(/^\/(fr|en|ar)(\/|$)/, "/");

  // ===== ÉTAPE 2 : Initialiser le client Supabase SSR =====
  const res = NextResponse.next();

  // Préserver les cookies posés par next-intl (ex: NEXT_LOCALE)
  copyCookies(intlResponse, res);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // ===== ÉTAPE 3 : Récupérer l'utilisateur actuel =====
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Si non connecté et tentative d'accès à une zone privée -> /login
  const isProtected =
    pathWithoutLocale.startsWith("/admin") ||
    pathWithoutLocale.startsWith("/espace");
  if (isProtected && !user) {
    const redirectUrl = new URL(`/${locale}/login`, req.url);
    redirectUrl.searchParams.set("redirectedFrom", pathWithoutLocale);
    const redirectRes = NextResponse.redirect(redirectUrl);
    copyCookies(intlResponse, redirectRes);
    return redirectRes;
  }

  // 5. Si connecté, récupérer le profil complet
  let role: string | null = null;
  let wilayaCode: string | null = null;
  let communeCode: string | null = null;
  let secteurNom: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profils")
      .select("role, wilaya_code, commune_code, secteur_nom")
      .eq("id", user.id)
      .single();

    role = profile?.role ?? null;
    wilayaCode = profile?.wilaya_code ?? null;
    communeCode = profile?.commune_code ?? null;
    secteurNom = profile?.secteur_nom ?? null;

    if (
      pathWithoutLocale.startsWith("/admin") &&
      !ADMIN_ROLES.includes(role as UserRole)
    ) {
      const redirectRes = NextResponse.redirect(new URL(`/${locale}/403`, req.url));
      copyCookies(intlResponse, redirectRes);
      return redirectRes;
    }

    // /espace est réservé aux citoyens : un rôle gestionnaire est redirigé
    // vers /admin, un rôle inconnu vers /403.
    if (pathWithoutLocale.startsWith("/espace") && role !== "citoyen") {
      const target = ADMIN_ROLES.includes(role as UserRole)
        ? `/${locale}/admin`
        : `/${locale}/403`;
      const redirectRes = NextResponse.redirect(new URL(target, req.url));
      copyCookies(intlResponse, redirectRes);
      return redirectRes;
    }
  }

  // 6. Injecter la locale résolue et les infos du profil dans les headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("X-NEXT-INTL-LOCALE", locale);
  requestHeaders.set("x-user-role", role ?? "");
  requestHeaders.set("x-user-wilaya", wilayaCode ?? "");
  requestHeaders.set("x-user-commune", communeCode ?? "");
  requestHeaders.set("x-user-secteur", secteurNom ?? "");

  const finalRes = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Préserver les cookies
  res.cookies.getAll().forEach((c) =>
    finalRes.cookies.set(c.name, c.value, c),
  );

  return finalRes;
}

export const config = {
  matcher: ["/((?!_next|favicon|data|.*\\..*).*)"],
};
