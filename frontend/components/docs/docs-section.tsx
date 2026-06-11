export function DocsSection({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="docs-section">
      {children}
    </section>
  )
}
