
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    return NextResponse.redirect(new URL("/admin/login?error=config", request.url));
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // ตรวจสอบ Session กับ Supabase
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ไม่ต้องตรวจสิทธิ์สำหรับหน้า Login
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return response;
  }

  // ป้องกันหน้า Admin หากยังไม่ได้เข้าสู่ระบบ
  if (pathname.startsWith("/admin")) {
    if (userError || !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "unauthorized");

      return NextResponse.redirect(url);
    }

    // ตรวจสอบสิทธิ์ Admin จากตาราง profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    // หากอ่านข้อมูลไม่ได้หรือไม่พบโปรไฟล์ ให้ปฏิเสธการเข้าถึง
    if (profileError || !profile || profile.is_admin !== true) {
      console.error("Admin profile check failed:", profileError?.message);

      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "not-admin");

      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
