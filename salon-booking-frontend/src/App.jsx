import React from 'react'

export default function App() {
  return (
    <div className="page">
      <header className="header">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>Salon Glow</span>
        </div>

        <nav className="nav">
          <a href="#">Home</a>
          <a href="#">Services</a>
          <a href="#">Popular</a>
          <a href="#">Reviews</a>
        </nav>

        <button className="btn btn-primary">Book Now</button>
      </header>

      <main className="hero">
        <section className="hero-text">
          <p className="tag">Premium salon experience</p>
          <h1>Style Your Day with Confidence</h1>
          <p>
            Book hair, beauty, and spa treatments at your favorite salon.
            Easy booking, trusted professionals, and a relaxing experience.
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary">Make Appointment</button>
            <button className="btn btn-secondary">View Services</button>
          </div>

          <div className="stats">
            <div>
              <strong>2.5k+</strong>
              <span>Happy clients</span>
            </div>
            <div>
              <strong>4.9/5</strong>
              <span>Rating</span>
            </div>
            <div>
              <strong>20+</strong>
              <span>Specialists</span>
            </div>
          </div>
        </section>

        <section className="booking-card">
          <h2>Book Your Slot</h2>

          <form className="booking-form">
            <div className="field">
              <label>Salon</label>
              <select>
                <option>Rose Beauty Studio</option>
                <option>Velvet Hair Lounge</option>
                <option>Glow & Glow Spa</option>
              </select>
            </div>

            <div className="field">
              <label>Service</label>
              <select>
                <option>Hair Cut</option>
                <option>Facial</option>
                <option>Nail Care</option>
                <option>Massage</option>
              </select>
            </div>

            <div className="field">
              <label>Date</label>
              <input type="date" />
            </div>

            <div className="field">
              <label>Time</label>
              <input type="time" />
            </div>

            <button type="submit" className="btn btn-primary full">
              Confirm Booking
            </button>
          </form>
        </section>
      </main>

      <section className="services">
        <h2>Popular Services</h2>
        <div className="service-grid">
          <div className="service-item">
            <div className="icon">✂️</div>
            <h3>Hair Cut</h3>
            <p>Modern cuts and styling by professional stylists.</p>
          </div>

          <div className="service-item">
            <div className="icon">💆</div>
            <h3>Massage</h3>
            <p>Relaxing body treatment for comfort and recovery.</p>
          </div>

          <div className="service-item">
            <div className="icon">💅</div>
            <h3>Nail Care</h3>
            <p>Polish, design, and grooming for a fresh finish.</p>
          </div>
        </div>
      </section>
    </div>
  )
}