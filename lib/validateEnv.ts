/**
 * Environment variable validation
 * Ensures all required configuration is present at startup
 * Fails fast with clear error messages instead of cryptic runtime errors
 */

/**
 * List of required environment variables
 */
const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "GEMINI_API_KEY",
  "TELEGRAM_BOT_TOKEN",
];

/**
 * Optional environment variables with fallback defaults
 */
const OPTIONAL_ENV_VARS = [
  { name: "NEXT_PUBLIC_USER_NAME", default: "Oryza" },
  { name: "NODE_ENV", default: "development" },
];

/**
 * Validates all required environment variables are set
 * @throws Error if any required var is missing
 */
export function validateEnvironment(): void {
  const missingVars = REQUIRED_ENV_VARS.filter((varName) => {
    const value = process.env[varName];
    return !value || value.trim() === "";
  });

  if (missingVars.length > 0) {
    const errorMessage = `
❌ Missing required environment variables:
${missingVars.map((v) => `   - ${v}`).join("\n")}

Please add these to your .env.local file:
${missingVars.map((v) => `   ${v}=your_value_here`).join("\n")}

See .env.example for more details.
    `.trim();

    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  logValidation("✅ All required environment variables are present");
}

/**
 * Log validation status
 */
function logValidation(message: string): void {
  console.log(`[ENV_VALIDATION] ${message}`);
}

/**
 * Get environment variable with validation
 * @param name - Variable name
 * @param required - Whether it's required
 * @returns Variable value or throws error if required and missing
 */
export function getEnvVar(name: string, required: boolean = false): string | undefined {
  const value = process.env[name];

  if (!value && required) {
    throw new Error(`Required environment variable not set: ${name}`);
  }

  return value;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Get all configuration from environment
 */
export function getConfig() {
  return {
    supabaseUrl: getEnvVar("NEXT_PUBLIC_SUPABASE_URL", true),
    supabaseKey: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", true),
    geminiKey: getEnvVar("GEMINI_API_KEY", true),
    telegramToken: getEnvVar("TELEGRAM_BOT_TOKEN", true),
    userName: getEnvVar("NEXT_PUBLIC_USER_NAME") || "Oryza",
    nodeEnv: getEnvVar("NODE_ENV") || "development",
  };
}
