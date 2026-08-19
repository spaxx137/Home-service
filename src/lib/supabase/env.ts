function ensure(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Next.js can only inline NEXT_PUBLIC_* vars into the browser bundle when
// they're accessed via static `process.env.FOO` dot-notation — a dynamic
// `process.env[name]` lookup is invisible to its build-time replacement and
// stays undefined on the client. Each getter below must keep that literal
// form.

export function getSupabaseUrl(): string {
  return ensure("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  return ensure("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseServiceRoleKey(): string {
  return ensure("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}
