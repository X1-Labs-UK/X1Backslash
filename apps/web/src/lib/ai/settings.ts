import { db } from "@/lib/db";
import { userAiSettings } from "@/lib/db/schema";
import type {
  AiModelSettings,
  AiProvider,
  AiPurpose,
  PublicUserAiSettings,
  UserAiSettings,
} from "@/lib/ai/types";
import { eq } from "drizzle-orm";

const AI_PROVIDERS = ["openai", "openrouter", "anthropic", "custom"] as const;

function isAiProvider(value: string): value is AiProvider {
  return (AI_PROVIDERS as readonly string[]).includes(value);
}

function normalizeNullable(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function defaultModelFor(provider: AiProvider, purpose: AiPurpose): string {
  if (purpose === "buildFix") {
    if (provider === "openrouter") {
      return process.env.AI_BUILD_FIX_MODEL_OPENROUTER || "openai/gpt-4o-mini";
    }
    if (provider === "anthropic") {
      return process.env.AI_BUILD_FIX_MODEL_ANTHROPIC || "claude-3-5-sonnet-latest";
    }
    return process.env.AI_BUILD_FIX_MODEL || "gpt-4o-mini";
  }

  if (provider === "openrouter") {
    return process.env.AI_LATEX_WRITER_MODEL_OPENROUTER || "openai/gpt-4o-mini";
  }
  if (provider === "anthropic") {
    return process.env.AI_LATEX_WRITER_MODEL_ANTHROPIC || "claude-3-5-sonnet-latest";
  }
  return process.env.AI_LATEX_WRITER_MODEL || "gpt-4o-mini";
}

export function defaultAiSettings(): UserAiSettings {
  const defaultProvider: AiProvider = "openai";
  return {
    buildFix: {
      provider: defaultProvider,
      model: defaultModelFor(defaultProvider, "buildFix"),
      endpoint: null,
      apiKey: null,
    },
    latexWriter: {
      provider: defaultProvider,
      model: defaultModelFor(defaultProvider, "latexWriter"),
      endpoint: null,
      apiKey: null,
    },
  };
}

type UserAiSettingsRow = typeof userAiSettings.$inferSelect;

function rowToSettings(row: UserAiSettingsRow | null): UserAiSettings {
  const defaults = defaultAiSettings();
  if (!row) return defaults;

  const buildProvider = isAiProvider(row.buildProvider)
    ? row.buildProvider
    : defaults.buildFix.provider;
  const writerProvider = isAiProvider(row.writerProvider)
    ? row.writerProvider
    : defaults.latexWriter.provider;

  return {
    buildFix: {
      provider: buildProvider,
      model: row.buildModel?.trim() || defaultModelFor(buildProvider, "buildFix"),
      endpoint: normalizeNullable(row.buildEndpoint),
      apiKey: normalizeNullable(row.buildApiKey),
    },
    latexWriter: {
      provider: writerProvider,
      model: row.writerModel?.trim() || defaultModelFor(writerProvider, "latexWriter"),
      endpoint: normalizeNullable(row.writerEndpoint),
      apiKey: normalizeNullable(row.writerApiKey),
    },
  };
}

export async function getStoredUserAiSettingsRow(
  userId: string
): Promise<UserAiSettingsRow | null> {
  const [row] = await db
    .select()
    .from(userAiSettings)
    .where(eq(userAiSettings.userId, userId))
    .limit(1);

  return row ?? null;
}

export async function getUserAiSettings(userId: string): Promise<UserAiSettings> {
  const row = await getStoredUserAiSettingsRow(userId);
  return rowToSettings(row);
}

export async function upsertUserAiSettings(
  userId: string,
  settings: UserAiSettings
): Promise<UserAiSettings> {
  await db
    .insert(userAiSettings)
    .values({
      userId,
      buildProvider: settings.buildFix.provider,
      buildModel: settings.buildFix.model,
      buildEndpoint: normalizeNullable(settings.buildFix.endpoint),
      buildApiKey: normalizeNullable(settings.buildFix.apiKey),
      writerProvider: settings.latexWriter.provider,
      writerModel: settings.latexWriter.model,
      writerEndpoint: normalizeNullable(settings.latexWriter.endpoint),
      writerApiKey: normalizeNullable(settings.latexWriter.apiKey),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userAiSettings.userId,
      set: {
        buildProvider: settings.buildFix.provider,
        buildModel: settings.buildFix.model,
        buildEndpoint: normalizeNullable(settings.buildFix.endpoint),
        buildApiKey: normalizeNullable(settings.buildFix.apiKey),
        writerProvider: settings.latexWriter.provider,
        writerModel: settings.latexWriter.model,
        writerEndpoint: normalizeNullable(settings.latexWriter.endpoint),
        writerApiKey: normalizeNullable(settings.latexWriter.apiKey),
        updatedAt: new Date(),
      },
    });

  const latest = await getUserAiSettings(userId);
  return latest;
}

export function toPublicAiSettings(settings: UserAiSettings): PublicUserAiSettings {
  return {
    buildFix: {
      provider: settings.buildFix.provider,
      model: settings.buildFix.model,
      endpoint: settings.buildFix.endpoint,
      apiKeySet: Boolean(settings.buildFix.apiKey),
    },
    latexWriter: {
      provider: settings.latexWriter.provider,
      model: settings.latexWriter.model,
      endpoint: settings.latexWriter.endpoint,
      apiKeySet: Boolean(settings.latexWriter.apiKey),
    },
  };
}

export function resolveAiApiKey(modelSettings: AiModelSettings): string | null {
  if (modelSettings.apiKey?.trim()) {
    return modelSettings.apiKey.trim();
  }

  switch (modelSettings.provider) {
    case "openai":
      return process.env.OPENAI_API_KEY ?? null;
    case "openrouter":
      return process.env.OPENROUTER_API_KEY ?? null;
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY ?? null;
    case "custom":
      return process.env.CUSTOM_AI_API_KEY ?? null;
    default:
      return null;
  }
}

export function resolveAiBaseUrl(modelSettings: AiModelSettings): string {
  const custom = normalizeNullable(modelSettings.endpoint);
  if (custom) return custom;

  switch (modelSettings.provider) {
    case "openai":
      return process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    case "openrouter":
      return process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
    case "anthropic":
      return process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1";
    case "custom":
      return process.env.CUSTOM_AI_BASE_URL || "";
    default:
      return "";
  }
}
