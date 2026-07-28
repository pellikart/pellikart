// The shared lib is typechecked from this project so that a change to the web
// app's business logic breaks the mobile build too, rather than failing later
// on device. One shared file assumes the web's toolchain: `../src/lib/supabase.ts`
// reads `import.meta.env`, which the web tsconfig types via `vite/client`.
//
// Metro replaces that module with `src/lib/supabase.native.ts` before it ever
// reaches a bundle (see metro.config.js), so this declaration exists purely to
// let TypeScript read past it — it describes the web build, not this one.

interface ImportMeta {
  readonly env: Record<string, string | undefined>
}
