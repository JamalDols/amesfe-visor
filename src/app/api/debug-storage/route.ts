import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verificar que el bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      return NextResponse.json(
        {
          error: "Error listing buckets",
          details: bucketsError.message,
        },
        { status: 500 }
      );
    }

    const photosBucket = buckets?.find((bucket) => bucket.name === "photos");

    // Verificar tablas
    const { data: photosTable, error: tableError } = await supabase.from("photos").select("id").limit(1);

    return NextResponse.json({
      success: true,
      buckets: buckets?.map((b) => ({ name: b.name, public: b.public })),
      photosBucketExists: !!photosBucket,
      photosBucketPublic: photosBucket?.public || false,
      photosTableAccessible: !tableError,
      tableError: tableError?.message || null,
      session: {
        user: session.user.email,
        expires: session.expires_at,
      },
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
