import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Note: `next dev` prints a cosmetic "inferred workspace root" warning because
  // unrelated lockfiles exist higher up the tree. It's harmless — the app builds
  // and imports the shared contract (../shared) fine. Do NOT set `turbopack.root`
  // to the app dir (breaks the ../shared import) or to the repo root (breaks the
  // RSC client manifest under Turbopack).
}

export default nextConfig
