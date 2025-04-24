import { env } from "@/lib/env";
import { r2 } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const command = new GetObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: id,
    });

    const signedUrl = await getSignedUrl(
      r2,
      command,
      { expiresIn: 60 * 5 } // 5 minutes
    );

    //  Redirect to the signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Error downloading file from R2:", error);
    return NextResponse.json({ ok: false, error: "Failed to download file" }, { status: 500 });
  }
}
