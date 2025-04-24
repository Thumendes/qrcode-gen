import { env } from "@/lib/env";
import { r2 } from "@/lib/r2";
import { slugify } from "@/lib/utils";
import { PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
  }

  const fileBuffer = await file.arrayBuffer();
  const fileName = slugify(`${Date.now()}-${file.name}`);

  const payload = {
    Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
    Key: fileName,
    Body: Buffer.from(fileBuffer),
    ContentType: file.type,
  } satisfies PutObjectCommandInput;

  console.log("Uploading file to R2:", payload);

  try {
    await r2.send(new PutObjectCommand(payload));

    const url = `${env.APP_URL}/api/download/${fileName}`;

    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error("Error uploading file to R2:", error);
    return NextResponse.json({ ok: false, error: "Failed to upload file" }, { status: 500 });
  }
}
