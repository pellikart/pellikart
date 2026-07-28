#!/usr/bin/env node
// Creates `mobile/shared` → `../src/lib`, the link that lets this app compile
// the web app's business logic without a second copy of it.
//
// Why a link at all: Metro refuses to bundle files above its project root, and
// raising the root breaks Expo's entry resolution (metro.config.js explains the
// dead ends in full). Linking the directory in keeps the files inside the
// project while leaving exactly one copy on disk.
//
// Runs automatically after `npm install`. Idempotent — safe to re-run.

const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const linkPath = path.join(projectRoot, 'shared')
const targetPath = path.resolve(projectRoot, '..', 'src', 'lib')

function main() {
  if (!fs.existsSync(targetPath)) {
    console.error(
      `[link-shared] Cannot find the shared lib at ${targetPath}.\n` +
        '             The mobile app must live inside the pellikart web repo.'
    )
    process.exit(1)
  }

  // Already linked and pointing at the right place? Nothing to do.
  if (fs.existsSync(linkPath)) {
    let current = null
    try {
      current = fs.realpathSync(linkPath)
    } catch {
      /* broken link — fall through and recreate */
    }
    if (current && path.resolve(current) === path.resolve(fs.realpathSync(targetPath))) {
      return
    }
    // A stale link, or a real directory someone created by hand. Only remove
    // the former; deleting a real directory of somebody's files is not ours to
    // do silently.
    const stat = fs.lstatSync(linkPath)
    if (!stat.isSymbolicLink() && !stat.isDirectory()) {
      console.error(`[link-shared] ${linkPath} exists and is not a link. Remove it and re-run.`)
      process.exit(1)
    }
    if (stat.isDirectory() && !stat.isSymbolicLink() && !current) {
      console.error(`[link-shared] ${linkPath} is a real directory. Remove it and re-run.`)
      process.exit(1)
    }
    fs.rmSync(linkPath, { recursive: false, force: true })
  }

  // 'junction' on Windows: unlike a directory symlink it needs no admin rights
  // or Developer Mode. Ignored on other platforms, where 'dir' is used.
  const type = process.platform === 'win32' ? 'junction' : 'dir'
  fs.symlinkSync(targetPath, linkPath, type)
  console.log(`[link-shared] Linked mobile/shared → ../src/lib (${type})`)
}

main()
