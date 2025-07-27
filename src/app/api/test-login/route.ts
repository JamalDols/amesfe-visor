import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("🧪 Test login API - Email:", email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("🧪 Test login API - Response:", { data, error });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
      });
    }

    return NextResponse.json({
      success: true,
      user: data.user?.email,
      session: !!data.session,
    });
  } catch (error) {
    console.error("🧪 Test login API - Error:", error);
    return NextResponse.json({
      success: false,
      error: "Error interno",
      details: error,
    });
  }
}
