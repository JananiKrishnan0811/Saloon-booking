const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

export async function fetchSalons() {
  const res = await fetch(`${API_BASE}/salons`)
  return res.json()
}

export async function createAppointment(data) {
  const res = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}
