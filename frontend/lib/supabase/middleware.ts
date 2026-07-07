import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl } from "./config";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

const protectedRoutes = [
  "/dashboard",
  "/jobs",
  "/ai-match",
  "/resume",
  "/profile",
  "/settings",
];

const authRoutes = ["/login", "/signup"];

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function applyCookieUpdates(
  response: NextResponse,
  cookiesToSet: CookieToSet[],
  headersToSet: Record<string, string>
) {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  Object.entries(headersToSet).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

function redirectTo(
  request: NextRequest,
  pathname: string,
  cookiesToSet: CookieToSet[],
  headersToSet: Record<string, string>
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";

  return applyCookieUpdates(
    NextResponse.redirect(redirectUrl),
    cookiesToSet,
    headersToSet
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  let refreshedCookies: CookieToSet[] = [];
  let refreshedHeaders: Record<string, string> = {};

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headersToSet) {
          refreshedCookies = cookiesToSet;
          refreshedHeaders = headersToSet;

          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });
          applyCookieUpdates(response, cookiesToSet, headersToSet);
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = matchesRoute(pathname, protectedRoutes);
  const isAuthRoute = matchesRoute(pathname, authRoutes);

  if (!user && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set(
      "redirectTo",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );

    return applyCookieUpdates(
      NextResponse.redirect(loginUrl),
      refreshedCookies,
      refreshedHeaders
    );
  }

  if (user && (isAuthRoute || pathname === "/")) {
    return redirectTo(request, "/dashboard", refreshedCookies, refreshedHeaders);
  }

  if (!user && pathname === "/") {
    return redirectTo(request, "/login", refreshedCookies, refreshedHeaders);
  }

  return response;
}
