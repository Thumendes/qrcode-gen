import { z } from "zod";

const EnvSchema = z.object({
  CLOUDFLARE_R2_ENDPOINT: z.string(),
  CLOUDFLARE_R2_ACCESS_KEY_ID: z.string(),
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: z.string(),
  CLOUDFLARE_R2_BUCKET_NAME: z.string(),
  APP_URL: z.string().url(),
});

export const env = EnvSchema.parse(process.env);
