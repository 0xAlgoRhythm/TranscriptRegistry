"use client"

type Section = { id: string; label: string; icon: string }

interface DocsNavProps {
  sections: Section[]
  activeSection: string
  onSelect: (id: string) => void
}

export function DocsNav({ sections, activeSection, onSelect }: DocsNavProps) {
  return (
    <nav className="docs-nav">
      <p className="docs-nav-label">Contents</p>
      <ul>
        {sections.map((s) => (
          <li key={s.id}>
            <button
              id={`nav-${s.id}`}
              onClick={() => onSelect(s.id)}
              className={`docs-nav-item ${activeSection === s.id ? "active" : ""}`}
            >
              <span className="docs-nav-icon">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="docs-nav-footer">
        <p className="docs-nav-version">API v1.0 · Base Sepolia</p>
        <a href="mailto:support@credaxis.app" className="docs-nav-support">
          💬 Get Support
        </a>
      </div>
    </nav>
  )
}
