// app/api/admin/contracts/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    // Auth check
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("sb-access-token")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from("contracts")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply filters
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(`contract_title.ilike.%${search}%,initiator_email.ilike.%${search}%,signee_email.ilike.%${search}%,signee_name.ilike.%${search}%`);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data: contracts, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching contracts:", error);
      return NextResponse.json({ error: "Failed to fetch contracts" }, { status: 500 });
    }

    return NextResponse.json({
      contracts,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error("Contracts API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    if (!cookieHeader.includes("sb-access-token")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, fraud_flag, fraud_reason } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Contract ID required" }, { status: 400 });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (fraud_flag !== undefined) updates.fraud_flag = fraud_flag;
    if (fraud_reason) updates.fraud_reason = fraud_reason;

    const { data, error } = await supabaseAdmin
      .from("contracts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating contract:", error);
      return NextResponse.json({ error: "Failed to update contract" }, { status: 500 });
    }

    // Log the action
    await supabaseAdmin
      .from("contract_audit_logs")
      .insert({
        contract_id: id,
        action: `Contract ${status ? `status changed to ${status}` : fraud_flag ? `flagged as ${fraud_flag ? 'fraudulent' : 'clean'}` : 'updated'}`,
        details: updates,
        performed_by: "admin" // You might want to get admin user ID
      });

    return NextResponse.json({ contract: data });
  } catch (error) {
    console.error("Contract update error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}