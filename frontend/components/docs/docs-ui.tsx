"use client"
import { useState } from "react"

interface CodeBlockProps {
  code: string
  lang?: string
  label?: string
}

export function CodeBlock({ code, lang = "bash", label }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="code-block">
      {label && <div className="code-block-label">{label}</div>}
      <div className="code-block-header">
        <span className="code-lang">{lang}</span>
        <button id={`copy-${label?.replace(/\s/g, '-').toLowerCase() || Math.random()}`} className="code-copy" onClick={copy}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  )
}

export function EndpointBadge({
  method,
  path,
  auth,
}: {
  method: "GET" | "POST" | "PUT" | "DELETE"
  path: string
  auth?: boolean
}) {
  const colors: Record<string, string> = {
    GET: "method-get",
    POST: "method-post",
    PUT: "method-put",
    DELETE: "method-delete",
  }
  return (
    <div className="endpoint-badge">
      <span className={`method-pill ${colors[method]}`}>{method}</span>
      <code className="endpoint-path">{path}</code>
      {auth && <span className="auth-badge">🔐 Auth Required</span>}
    </div>
  )
}

export function ParamTable({
  params,
}: {
  params: { name: string; type: string; required: boolean; desc: string }[]
}) {
  return (
    <table className="param-table">
      <thead>
        <tr>
          <th>Parameter</th>
          <th>Type</th>
          <th>Required</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {params.map((p) => (
          <tr key={p.name}>
            <td><code>{p.name}</code></td>
            <td><span className="type-badge">{p.type}</span></td>
            <td>{p.required ? <span className="req-yes">Yes</span> : <span className="req-no">No</span>}</td>
            <td>{p.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "success" | "danger"
  children: React.ReactNode
}) {
  const icons = { info: "ℹ️", warning: "⚠️", success: "✅", danger: "🚨" }
  return (
    <div className={`callout callout-${type}`}>
      <span className="callout-icon">{icons[type]}</span>
      <div className="callout-content">{children}</div>
    </div>
  )
}
