import { env } from "@/lib/env";
import { r2 } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const command = new GetObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: id,
    });

    const response = await r2.send(command);
    const stream = response.Body as ReadableStream;

    return new NextResponse(stream, {
      headers: {
        "Content-Type": response.ContentType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${id}"`,
      },
    });
  } catch (error) {
    console.error("Error downloading file from R2:", error);
    return NextResponse.json({ ok: false, error: "Failed to download file" }, { status: 500 });
  }
}
