import { NextResponse } from "next/server";
import { z } from "zod";
import { credentialPutSchema } from "@/lib/server/contracts";
import { getAuthContext } from "@/lib/server/auth";
import { encryptSecret, secretLast4 } from "@/lib/server/crypto";
import { one, sql, toIso } from "@/lib/server/db";
import { apiError, handleApiError, readJson } from "@/lib/server/errors";
import { validateGroqApiKey } from "@/lib/server/provider/groq";
import { assertRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const auth = await getAuthContext(request);
    await assertRateLimit(request, { scope: "credential:groq:user", key: auth.user.id, max: 10, windowMs: 10 * 60_000 });

    const body = credentialPutSchema.parse(await readJson<unknown>(request));

    if (body.validate) {
      await validateGroqApiKey(body.apiKey);
    }

    const encrypted = encryptSecret({ userId: auth.user.id, provider: "groq", plaintext: body.apiKey });
    const db = sql();
    await db`
      UPDATE user_credentials
      SET status = 'deleted', deleted_at = now(), updated_at = now()
      WHERE user_id = ${auth.user.id} AND provider = 'groq' AND deleted_at IS NULL
    `;

    const row = one<{ provider: "groq"; secret_last4: string; updated_at: string }>(
      await db`
        INSERT INTO user_credentials (
          user_id, provider, encrypted_secret, encryption_iv, encryption_tag,
          encryption_key_id, encryption_version, secret_last4
        )
        VALUES (
          ${auth.user.id}, 'groq', ${encrypted.encryptedSecret}, ${encrypted.encryptionIv}, ${encrypted.encryptionTag},
          ${encrypted.encryptionKeyId}, ${encrypted.encryptionVersion}, ${secretLast4(body.apiKey)}
        )
        RETURNING provider, secret_last4, updated_at
      `,
    );

    return NextResponse.json({
      credential: {
        provider: "groq",
        available: true,
        last4: row?.secret_last4 || secretLast4(body.apiKey),
        updatedAt: toIso(row?.updated_at),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("BAD_REQUEST", "Invalid credential request.", 400);
    }
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await getAuthContext(request);
    await sql()`
      UPDATE user_credentials
      SET status = 'deleted', deleted_at = now(), updated_at = now()
      WHERE user_id = ${auth.user.id} AND provider = 'groq' AND deleted_at IS NULL
    `;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
