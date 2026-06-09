const API_URL = 'http://localhost:3001'

async function testBackend() {
  console.log("=== Testing Backend Fixes ===")

  // Test 1: Verification with Mixed Case Record ID
  const recordId = "0x8E8254d0443F83FCD39560f27668c6A54e9B32446EC9F9Ed2145Cba66db442f1"
  console.log(`Testing public verify with mixed-case recordId: ${recordId}`)
  
  try {
    const res = await fetch(`${API_URL}/api/public/verify?recordId=${recordId}`)
    const data = await res.json()
    if (data.error) {
      console.log("❌ Test 1 Failed:", data.error)
    } else {
      console.log("✅ Test 1 Passed! Result:", data.transcript?.recordId)
    }
  } catch (err) {
    console.log("❌ Test 1 Failed:", err)
  }

  // Test 2: Access Code Generation for Institutional Verifier
  console.log(`\nTesting access code generation (issue token)...`)
  try {
    // Generate an institutional access token
    const tokenRes = await fetch(`${API_URL}/api/tokens/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer test' }, // assuming we mock auth or just rely on backend
      body: JSON.stringify({
        institutionName: "Global Verification Agency",
        expiresDays: 30,
        issuerAddress: "0xTestAdmin",
        role: "admin"
      })
    })

    if (tokenRes.status === 401 || tokenRes.status === 403) {
      console.log("⚠️ Could not test token issue due to auth requirement. We need to test the public token.")
    } else {
      const tokenData = await tokenRes.json()
      if (tokenData.success) {
        console.log("✅ Test 2 Passed! Token:", tokenData.token)
        
        // Test verify with this token
        console.log(`\nTesting verify with token: ${tokenData.token}`)
        const verifyRes = await fetch(`${API_URL}/api/public/verify?recordId=${recordId}&token=${tokenData.token}`)
        const verifyData = await verifyRes.json()
        if (verifyData.error) {
           console.log("❌ Token Verification Failed:", verifyData.error)
        } else {
           console.log("✅ Token Verification Passed! Authorized by:", verifyData.authorizedBy)
        }
      }
    }
  } catch (err) {
    console.log("❌ Test 2 Failed:", err)
  }
}

testBackend()
