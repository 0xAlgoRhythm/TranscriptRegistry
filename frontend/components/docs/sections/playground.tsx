"use client"

import { useState } from "react"
import { CodeBlock } from "../docs-ui"

export function DocsPlayground() {
  const [method, setMethod] = useState<"GET" | "POST">("GET")
  const [endpoint, setEndpoint] = useState("/api/public/verify")
  const [queryParams, setQueryParams] = useState({
    recordId: "0xaa877681f268a7a927036de034fd930a854f2aec555795b6b612edb479ae2987",
    studentId: "",
    token: ""
  })
  const [requestBody, setRequestBody] = useState(
    JSON.stringify({
      recordId: "0xaa877681f268a7a927036de034fd930a854f2aec555795b6b612edb479ae2987",
      requesterName: "Dr. Jane Smith",
      requesterOrg: "Harvard Admissions",
      requesterEmail: "admissions@harvard.edu"
    }, null, 2)
  )
  const [loading, setLoading] = useState(false)
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [responseBody, setResponseBody] = useState<string>("")

  const handleEndpointChange = (val: string) => {
    setEndpoint(val)
    if (val === "/api/public/verify") {
      setMethod("GET")
    } else if (val === "/api/public/request-access" || val === "/api/public/email-transcript") {
      setMethod("POST")
      if (val === "/api/public/request-access") {
        setRequestBody(JSON.stringify({
          recordId: "0xaa877681f268a7a927036de034fd930a854f2aec555795b6b612edb479ae2987",
          requesterName: "Dr. Jane Smith",
          requesterOrg: "Harvard Admissions",
          requesterEmail: "admissions@harvard.edu"
        }, null, 2))
      } else {
        setRequestBody(JSON.stringify({
          to: "employer@company.com",
          recordId: "0xaa877681f268a7a927036de034fd930a854f2aec555795b6b612edb479ae2987",
          registryAddress: "0x9632D1a3194947CD888b37020261952A6aC52613",
          studentName: "John Doe",
          studentId: "UG/CS/2021/001",
          gpa: "3.85",
          major: "BSc Computer Science",
          level: "Undergraduate",
          gradYear: "2025",
          universityName: "KNUST"
        }, null, 2))
      }
    } else if (val === "/api/stats/platform") {
      setMethod("GET")
    }
  }

  const triggerCall = async () => {
    setLoading(true)
    setResponseStatus(null)
    setResponseBody("")

    try {
      let targetUrl = endpoint
      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json"
        }
      }

      if (method === "GET") {
        const params = new URLSearchParams()
        if (endpoint === "/api/public/verify") {
          if (queryParams.recordId) params.append("recordId", queryParams.recordId)
          if (queryParams.studentId) params.append("studentId", queryParams.studentId)
          if (queryParams.token) params.append("token", queryParams.token)
        }
        const queryString = params.toString()
        if (queryString) {
          targetUrl += `?${queryString}`
        }
      } else {
        options.body = requestBody
      }

      const res = await fetch(targetUrl, options)
      setResponseStatus(res.status)
      const data = await res.json()
      setResponseBody(JSON.stringify(data, null, 2))
    } catch (err: any) {
      setResponseBody(JSON.stringify({ error: err.message || "Request failed" }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="playground-container">
      <div className="section-eyebrow">Interactive Testing</div>
      <h2 className="section-title">API Playground</h2>
      <p className="section-lead">
        Simulate real-time requests directly against the live proxy API. Ensure your parameters conform to the public API requirements.
      </p>

      <div className="playground-card">
        <div className="playground-row">
          <div className="playground-col">
            <label className="playground-label">Endpoint</label>
            <select
              value={endpoint}
              onChange={(e) => handleEndpointChange(e.target.value)}
              className="playground-select"
            >
              <option value="/api/public/verify">GET /api/public/verify</option>
              <option value="/api/public/request-access">POST /api/public/request-access</option>
              <option value="/api/public/email-transcript">POST /api/public/email-transcript</option>
              <option value="/api/stats/platform">GET /api/stats/platform</option>
            </select>
          </div>

          <div className="playground-col">
            <label className="playground-label">&nbsp;</label>
            <button
              onClick={triggerCall}
              disabled={loading}
              className="playground-button"
            >
              {loading ? "Sending..." : "Send Request ⚡"}
            </button>
          </div>
        </div>

        {endpoint === "/api/public/verify" && (
          <div className="playground-params-box">
            <h4 className="playground-sub">Query Parameters</h4>
            <div className="playground-inputs-grid">
              <div className="playground-input-group">
                <span className="playground-input-name">recordId</span>
                <input
                  type="text"
                  value={queryParams.recordId}
                  onChange={(e) => setQueryParams({ ...queryParams, recordId: e.target.value })}
                  placeholder="0x..."
                  className="playground-input"
                />
              </div>
              <div className="playground-input-group">
                <span className="playground-input-name">studentId</span>
                <input
                  type="text"
                  value={queryParams.studentId}
                  onChange={(e) => setQueryParams({ ...queryParams, studentId: e.target.value })}
                  placeholder="e.g. UG/CS/2021/001"
                  className="playground-input"
                />
              </div>
              <div className="playground-input-group">
                <span className="playground-input-name">token</span>
                <input
                  type="text"
                  value={queryParams.token}
                  onChange={(e) => setQueryParams({ ...queryParams, token: e.target.value })}
                  placeholder="ct_..."
                  className="playground-input"
                />
              </div>
            </div>
          </div>
        )}

        {method === "POST" && (
          <div className="playground-params-box">
            <h4 className="playground-sub">Request JSON Body</h4>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              rows={6}
              className="playground-textarea"
            />
          </div>
        )}

        <div className="playground-response-box">
          <div className="playground-response-header">
            <span>Response Panel</span>
            {responseStatus !== null && (
              <span className={`playground-status-badge status-${responseStatus >= 200 && responseStatus < 300 ? '2xx' : '4xx'}`}>
                Status: {responseStatus}
              </span>
            )}
          </div>
          <pre className="playground-response-pre">
            <code>{responseBody || "// Click 'Send Request' to trigger API call..."}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}
