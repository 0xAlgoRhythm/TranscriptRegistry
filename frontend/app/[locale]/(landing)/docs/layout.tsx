import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CredAxis Docs — API Reference & Developer Guide",
  description:
    "Complete developer documentation for the CredAxis on-chain academic credential platform. Learn how to integrate transcript verification, institution onboarding, and more.",
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
