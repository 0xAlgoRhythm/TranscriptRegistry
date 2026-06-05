import fs from "fs"
import path from "path"

const PAGES = [
  "frontend/app/(app)/dashboard/page.tsx",
  "frontend/app/(app)/issued/page.tsx",
  "frontend/app/(app)/issued/[recordId]/page.tsx",
  "frontend/app/(app)/access/page.tsx",
  "frontend/app/(app)/admin/analytics/page.tsx",
]

const HOOKS = [
  "frontend/hooks/use-transcript-registry.ts",
]

let passed = 0
let failed = 0

console.log("=== FRONTEND VALIDATION SUITE ===")

for (const pagePath of PAGES) {
  try {
    const code = fs.readFileSync(pagePath, "utf8")
    if (code.includes("export default function")) {
      console.log(`✓ [PAGE] ${pagePath} exports a default function`)
      passed++
    } else {
      console.error(`✗ [PAGE] ${pagePath} is missing default function export`)
      failed++
    }
  } catch (e) {
    console.error(`✗ [PAGE] Failed to read ${pagePath}: ${e.message}`)
    failed++
  }
}

for (const hookPath of HOOKS) {
  try {
    const code = fs.readFileSync(hookPath, "utf8")
    const exports = ["useCheckAccess", "useAccessControl", "useGrantAccess", "useRevokeAccess", "useUpdateTranscriptStatus"]
    let hookOk = true
    for (const exp of exports) {
      if (!code.includes(`export function ${exp}`)) {
        console.error(`✗ [HOOK] ${hookPath} is missing export: ${exp}`)
        hookOk = false
      }
    }
    if (hookOk) {
      console.log(`✓ [HOOK] ${hookPath} exports all expected custom hooks`)
      passed++
    } else {
      failed++
    }
  } catch (e) {
    console.error(`✗ [HOOK] Failed to read ${hookPath}: ${e.message}`)
    failed++
  }
}

console.log(`\nValidation complete. Passed: ${passed}, Failed: ${failed}`)
if (failed > 0) {
  process.exit(1)
} else {
  process.exit(0)
}
