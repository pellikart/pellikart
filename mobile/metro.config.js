// Metro config for the Pellikart mobile app.
//
// The mobile app lives inside the web repo so both apps compile the same
// business logic — one matching algorithm, one set of pricing rules, one
// Supabase data layer. That shared logic is the web app's `src/lib`, which
// sits *above* this project.
//
// Metro cannot bundle files above its project root. `watchFolders` looks like
// the answer and is not: Metro additionally refuses to serve anything outside
// its server root, so shared imports fail with "none of these files exist"
// while naming a path that plainly does. Raising the server root to the repo
// root then breaks Expo's own entry resolution, which assumes hoisted
// node_modules that a non-workspace repo does not have.
//
// So instead of reaching up, we bring the code down: `mobile/shared` is a
// directory junction (Windows) / symlink (macOS, Linux) pointing at
// `../src/lib`. The files are then genuinely inside the project root, Metro is
// satisfied, and there is still exactly one copy on disk. `npm run link:shared`
// creates it; see README.

const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const sharedRoot = path.resolve(projectRoot, 'shared')

const config = getDefaultConfig(projectRoot)

// NOTE: symlink following is on by default in this Metro version, so there is
// nothing to enable for `shared/` to resolve. (Setting
// `resolver.unstable_enableSymlinks` explicitly makes expo-doctor flag a config
// mismatch for no benefit.)
//
// `app.json` sets experiments.tsconfigPaths = false so Metro ignores
// tsconfig.json's `paths`. Those exist for TypeScript only: they pin `react`
// and `zustand` at @types/* so the shared web lib typechecks, and Metro would
// try to execute a types-only package. The runtime aliases are declared below
// instead.

// Packages that must resolve to exactly one copy for the whole bundle. Two
// Reacts means "Invalid hook call" at the first hook; two Zustands means the
// stores a screen subscribes to are not the stores the data layer writes to.
// Shared files resolve their imports from wherever Metro thinks they live, so
// pin these explicitly instead of trusting the directory walk.
const SINGLETONS = new Set(['react', 'react-dom', 'zustand', '@supabase/supabase-js'])

/** `@supabase/supabase-js/dist/x` → `@supabase/supabase-js`; `react/jsx-runtime` → `react`. */
function packageNameOf(moduleName) {
  const parts = moduleName.split('/')
  return moduleName.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

// Swap the shared Supabase client for the React Native one.
// `src/lib/supabase.ts` builds its client from `import.meta.env` (a Vite feature
// Hermes cannot parse) and keeps the session in localStorage. Every shared
// module imports it as `./supabase`, so rather than fork ~90 data functions we
// redirect that one module to the native client, which is API-compatible and
// persists sessions in AsyncStorage.
//
// Both spellings are checked because Metro may report the file through the
// junction or through its real path, depending on how it resolved.
const SHARED_SUPABASE = new Set([
  path.resolve(sharedRoot, 'supabase.ts'),
  path.resolve(projectRoot, '..', 'src', 'lib', 'supabase.ts'),
])
const NATIVE_SUPABASE = path.resolve(projectRoot, 'src/lib/supabase.native.ts')

// The `@/` and `@shared/` aliases.
//
// These are declared in tsconfig.json too, but Metro's tsconfig-paths support
// is switched OFF in app.json (experiments.tsconfigPaths). That file also pins
// `react` and `zustand` at @types/* so the shared lib typechecks — correct for
// TypeScript, catastrophic at runtime, since Metro would try to execute a
// types-only package. Keeping the two resolvers separate means each sees only
// what it should.
const ALIASES = [
  ['@shared/', sharedRoot],
  ['@/', path.resolve(projectRoot, 'src')],
]

// A file inside the mobile project, used as the pretend importer when resolving
// singletons — it makes Metro search from mobile/node_modules while still
// applying its own platform and export-condition rules.
const RESOLUTION_ANCHOR = path.resolve(projectRoot, 'package.json')

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (SINGLETONS.has(packageNameOf(moduleName))) {
    return context.resolveRequest(
      { ...context, originModulePath: RESOLUTION_ANCHOR },
      moduleName,
      platform
    )
  }

  for (const [prefix, target] of ALIASES) {
    if (moduleName.startsWith(prefix)) {
      const filePath = path.join(target, moduleName.slice(prefix.length))
      // Hand Metro a relative specifier rather than the absolute path: on
      // Windows it does not treat `C:\…` as absolute and silently resolves it
      // against the wrong directory.
      const from = path.dirname(context.originModulePath || RESOLUTION_ANCHOR)
      const rel = path.relative(from, filePath).split(path.sep).join('/')
      return context.resolveRequest(context, rel.startsWith('.') ? rel : `./${rel}`, platform)
    }
  }

  const resolved = context.resolveRequest(context, moduleName, platform)
  if (resolved && resolved.type === 'sourceFile' && SHARED_SUPABASE.has(path.resolve(resolved.filePath))) {
    return { type: 'sourceFile', filePath: NATIVE_SUPABASE }
  }
  return resolved
}

module.exports = config
