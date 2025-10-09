// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export async function middleware(req: NextRequest) {
//   const accessToken = req.cookies.get("sb-access-token")?.value;
//   const verified = req.cookies.get("verified")?.value;

//   // ✅ 1. Require a valid session for any dashboard page
//   if (req.nextUrl.pathname.startsWith("/dashboard")) {
//     // If no session cookie → redirect to login
//     if (!accessToken) {
//       const res = NextResponse.redirect(new URL("/auth/login", req.url));
//       res.cookies.delete("sb-access-token");
//       res.cookies.delete("sb-refresh-token");
//       res.cookies.delete("verified");
//       return res;
//     }

   
//     if (verified === "false") {
//       const res = NextResponse.redirect(new URL("/onboarding", req.url));
//       return res;
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/dashboard/:path*"],
// };






// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { createClient } from "@supabase/supabase-js";

// export async function middleware(req: NextRequest) {
//   const accessToken = req.cookies.get("sb-access-token")?.value;
//   const verified = req.cookies.get("verified")?.value;

//   // ✅ 1. Require a valid session for any dashboard page
//   if (req.nextUrl.pathname.startsWith("/dashboard")) {
//     if (!accessToken) {
//       const res = NextResponse.redirect(new URL("/auth/login", req.url));
//       res.cookies.delete("sb-access-token");
//       res.cookies.delete("sb-refresh-token");
//       res.cookies.delete("verified");
//       return res;
//     }

//     // ✅ 2. Require verification step before accessing dashboard
//     if (verified === "false") {
//       return NextResponse.redirect(new URL("/onboarding", req.url));
//     }

//     // ✅ 3. Optional: Restrict `/dashboard/admin` to admins only
//     if (req.nextUrl.pathname.startsWith("/admin")) {
//       // Create a Supabase client with service role to verify role
//       const supabaseAdmin = createClient(
//         process.env.SUPABASE_URL!,
//         process.env.SUPABASE_SERVICE_ROLE_KEY!
//       );

//       // Get the current user based on the session token
//       const {
//         data: { user },
//       } = await supabaseAdmin.auth.getUser(accessToken);

//       if (!user) {
//         return NextResponse.redirect(new URL("/auth/login", req.url));
//       }

//       // Fetch role from users table
//       const { data: profile, error } = await supabaseAdmin
//         .from("users")
//         .select("role")
//         .eq("id", user.id)
//         .single();

//       if (error || !profile || profile.role !== "admin") {
//         // Redirect non-admin users away from admin pages
//         return NextResponse.redirect(new URL("/dashboard", req.url));
//       }
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/dashboard/:path*", "/admin/:path*"],
// };
 

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function middleware(req: NextRequest) {
  let accessToken = req.cookies.get("sb-access-token")?.value;
  const refreshToken = req.cookies.get("sb-refresh-token")?.value;
  const verified = req.cookies.get("verified")?.value;

  // 🔐 Protect dashboard and admin routes
  if (req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/admin")) {
    // ⛔ Redirect if not logged in
    if (!accessToken && !refreshToken) {
      return redirectToLogin(req);
    }

    // ✅ Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // ♻️ Refresh expired access token automatically
    if (!accessToken && refreshToken) {
      const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

      if (error || !data.session) {
        return redirectToLogin(req);
      }

      // ✅ Store new tokens in cookies
      accessToken = data.session.access_token;
      const res = NextResponse.next();

      res.cookies.set("sb-access-token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60,
        path: "/",
      });

      res.cookies.set("sb-refresh-token", data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return res;
    }

    // ✅ Check verification before dashboard access
    if (verified === "false") {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // 🔐 Admin protection
    if (req.nextUrl.pathname.startsWith("/admin")) {
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken);
      if (!user) return redirectToLogin(req);

      const { data: profile } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
}

function redirectToLogin(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/auth/login", req.url));
  res.cookies.delete("sb-access-token");
  res.cookies.delete("sb-refresh-token");
  res.cookies.delete("verified");
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
