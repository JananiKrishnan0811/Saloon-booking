import React, { useEffect, useState } from 'react'
import { fetchSalons, createAppointment } from '../api'

export default function AppointmentForm() {
  const [salons, setSalons] = useState([])
  const [form, setForm] = useState({ salon: '', service: '', staff: '', appointmentDate: '', startTime: '' })

  useEffect(() => {
    fetchSalons().then((d) => {
      if (Array.isArray(d)) setSalons(d)
      else if (d && d.salons) setSalons(d.salons)
    })
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await createAppointment(form)
    alert(res.message || JSON.stringify(res))
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Book Appointment</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Salon
            <select name="salon" value={form.salon} onChange={handleChange}>
              <option value="">Select salon</option>
              {salons.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Date
            <input type="date" name="appointmentDate" value={form.appointmentDate} onChange={handleChange} required />
          </label>
        </div>
        <div>
          <label>
            Start time
            <input type="time" name="startTime" value={form.startTime} onChange={handleChange} required />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <button type="submit">Book</button>
        </div>
      </form>
    </div>
  )
}
