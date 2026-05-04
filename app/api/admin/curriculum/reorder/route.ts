import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

async function checkAdmin() {
  const c = await cookies();
  return c.get("admin_auth")?.value === process.env.ADMIN_PASSWORD;
}

export async function PUT(request: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { type, id, direction } = body as {
    type: "module" | "lesson";
    id: string;
    direction: "up" | "down";
    module_id?: string;
  };

  const table = type === "module" ? "curriculum_modules" : "curriculum_lessons";

  // Get the current item
  const { data: current, error: curError } = await supabaseAdmin
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (curError || !current) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  // Build query for the adjacent item
  let adjacentQuery = supabaseAdmin
    .from(table)
    .select("*");

  if (type === "lesson") {
    adjacentQuery = adjacentQuery.eq("module_id", current.module_id);
  }

  if (direction === "up") {
    adjacentQuery = adjacentQuery
      .lt("order_index", current.order_index)
      .order("order_index", { ascending: false })
      .limit(1);
  } else {
    adjacentQuery = adjacentQuery
      .gt("order_index", current.order_index)
      .order("order_index", { ascending: true })
      .limit(1);
  }

  const { data: adjacent, error: adjError } = await adjacentQuery.maybeSingle();

  if (adjError) return NextResponse.json({ error: adjError.message }, { status: 500 });
  if (!adjacent) return NextResponse.json({ message: "Already at boundary" });

  // Swap order_index values
  const [err1, err2] = await Promise.all([
    supabaseAdmin.from(table).update({ order_index: adjacent.order_index }).eq("id", current.id),
    supabaseAdmin.from(table).update({ order_index: current.order_index }).eq("id", adjacent.id),
  ]).then(([r1, r2]) => [r1.error, r2.error]);

  if (err1) return NextResponse.json({ error: err1.message }, { status: 500 });
  if (err2) return NextResponse.json({ error: err2.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
