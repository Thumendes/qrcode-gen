import { env } from "@/lib/env";
import { r2 } from "@/lib/r2";
import { slugify } from "@/lib/utils";
import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { fileName, fileType } = await request.json();

  const fileKey = slugify(fileName);

  const payload = {
    Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
  } satisfies PutObjectCommandInput;

  try {
    const signedUrl = await getSignedUrl(r2, new PutObjectCommand(payload), {
      expiresIn: 60 * 5, // 5 minutes
    });

    const url = `${env.APP_URL}/api/download/${fileKey}`;

    return NextResponse.json({ ok: true, signedUrl, url });
  } catch (error) {
    console.error("Error uploading file to R2:", error);
    return NextResponse.json({ ok: false, error: "Failed to upload file" }, { status: 500 });
  }
}
