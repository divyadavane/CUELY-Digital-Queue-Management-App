import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/config";

// Business-level patient-facing defaults.
// Only admins of the business may read or change these.

export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const isAdmin = await supabase.rpc("is_admin_of_business", {
    p_business_id: businessId,
  });
  if (isAdmin.error || !isAdmin.data) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("businesses")
    .select("id, default_language")
    .eq("id", businessId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json({ default_language: data.default_language });
}

// PATCH /api/dashboard/business-settings
// body: { defaultLanguage: "en" | "hi" | "mr" }
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { businessId?: string; defaultLanguage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const businessId = String(body?.businessId || "");
  const defaultLanguage = String(body?.defaultLanguage || "");

  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }
  if (!SUPPORTED_LANGUAGES.includes(defaultLanguage as any)) {
    return NextResponse.json({ error: "defaultLanguage must be one of: " + SUPPORTED_LANGUAGES.join(", ") }, { status: 400 });
  }

  const isAdmin = await supabase.rpc("is_admin_of_business", {
    p_business_id: businessId,
  });
  if (isAdmin.error || !isAdmin.data) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("businesses")
    .update({ default_language: defaultLanguage })
    .eq("id", businessId)
    .select("id, default_language")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ default_language: data.default_language });
}
