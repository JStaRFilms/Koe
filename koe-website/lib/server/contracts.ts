import { z } from "zod";

export const accountModes = ["byok", "managed"] as const;
export const platforms = ["desktop", "ios", "android", "web"] as const;
export const promptStyles = ["Clean", "Formal", "Professional", "Casual", "Concise", "Bullets"] as const;
export const transcribeModels = ["whisper-large-v3-turbo", "whisper-large-v3"] as const;
export const refineModels = ["openai/gpt-oss-120b"] as const;

export type AccountMode = (typeof accountModes)[number];
export type Platform = (typeof platforms)[number];

export const emailSchema = z.string().trim().email().max(320).transform((value) => value.toLowerCase());
export const passwordSchema = z.string().min(12).max(512);
export const platformSchema = z.enum(platforms);
export const accountModeSchema = z.enum(accountModes);
export const promptStyleSchema = z.enum(promptStyles);
export const transcribeModelSchema = z.enum(transcribeModels);
export const refineModelSchema = z.enum(refineModels);

export const authWithDeviceSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(1).max(120).optional(),
  platform: platformSchema.optional(),
  installationId: z.string().trim().min(1).max(200).optional(),
  deviceLabel: z.string().trim().min(1).max(120).optional(),
  appVersion: z.string().trim().max(80).optional(),
  osVersion: z.string().trim().max(120).optional(),
});

export const deviceRegisterSchema = z.object({
  platform: platformSchema,
  installationId: z.string().trim().min(1).max(200).optional(),
  label: z.string().trim().min(1).max(120).optional(),
  appVersion: z.string().trim().max(80).optional(),
  osVersion: z.string().trim().max(120).optional(),
});

export const settingsPatchSchema = z
  .object({
    language: z.string().trim().min(1).max(24).optional(),
    promptStyle: promptStyleSchema.optional(),
    customPrompt: z.string().max(4000).optional(),
    enhanceText: z.boolean().optional(),
    model: transcribeModelSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one setting is required.");

export const credentialPutSchema = z.object({
  apiKey: z.string().trim().min(12).max(400),
  validate: z.boolean().optional().default(false),
});

export const modePatchSchema = z.object({
  defaultMode: accountModeSchema,
});

export const refineRequestSchema = z.object({
  requestId: z.string().uuid(),
  clientSessionId: z.string().trim().max(200).optional(),
  mode: accountModeSchema.optional(),
  rawText: z.string().min(1).max(100_000),
  promptStyle: promptStyleSchema.optional().default("Clean"),
  customPrompt: z.string().max(4000).optional().default(""),
  model: refineModelSchema.optional().default("openai/gpt-oss-120b"),
});

export function parseBooleanFormValue(value: FormDataEntryValue | null, fallback: boolean) {
  if (value === null) {
    return fallback;
  }

  return String(value) !== "false";
}
