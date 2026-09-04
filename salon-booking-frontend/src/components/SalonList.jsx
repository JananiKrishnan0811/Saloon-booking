import React, { useEffect, useState } from 'react'
import { fetchSalons } from '../api'

export default function SalonList() {
  const [salons, setSalons] = useState([])

  useEffect(() => {
    fetchSalons().then((data) => {
      if (Array.isArray(data)) setSalons(data)
      else if (data && data.salons) setSalons(data.salons)
    })
  }, [])

  return (
    <div>
      <h2>Salons</h2>
      {salons.length === 0 ? (
        <p>No salons available</p>
      ) : (
        <ul>
          {salons.map((s) => (
            <li key={s._id}>{s.name} {s.address ? `— ${s.address}` : ''}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
