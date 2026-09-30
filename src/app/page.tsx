"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (origin.trim()) params.set("origin", origin.trim());
    if (destination.trim()) params.set("destination", destination.trim());
    if (date) params.set("date", date);

    router.push(`/trips?${params.toString()}`);
  }

  function swapLocations() {
    setOrigin(destination);
    setDestination(origin);
  }

  return (
    <main>
      <header className="navbar">
        <div className="nav-container">
          <a href="/" className="brand">
            <span className="brand-icon">
              <BusIcon />
            </span>

            <span>
              <strong>GoRoute</strong>
              <small>VAN & BUS BOOKING</small>
            </span>
          </a>

          <nav className="nav-links">
            <a className="active" href="/">
              Home
            </a>
            <a href="/trips">Find Trips</a>
            <a href="/bookings">My Bookings</a>
          </nav>

          <div className="nav-actions">
            <a href="/login" className="login-link">
              Log in
            </a>
            <a href="/register" className="primary-button small-button">
              Sign up
            </a>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-overlay" />

        <div className="hero-content">
          <span className="eyebrow">YOUR JOURNEY STARTS HERE</span>

          <h1>
            Travel comfortably.
            <br />
            <span>Book with confidence.</span>
          </h1>

          <p className="hero-description">
            Find and reserve reliable van and bus trips in just a few clicks.
            Simple booking, clear fares and comfortable journeys.
          </p>

          <form className="search-card" onSubmit={handleSearch}>
            <div className="search-field">
              <label htmlFor="origin">FROM</label>

              <div className="input-row">
                <LocationIcon />
                <input
                  id="origin"
                  type="text"
                  placeholder="Enter departure city"
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                />
              </div>
            </div>

            <button
              className="swap-button"
              type="button"
              onClick={swapLocations}
              aria-label="Swap departure and destination"
            >
              ⇄
            </button>

            <div className="search-field">
              <label htmlFor="destination">TO</label>

              <div className="input-row">
                <LocationIcon />
                <input
                  id="destination"
                  type="text"
                  placeholder="Enter destination"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                />
              </div>
            </div>

            <div className="search-divider" />

            <div className="search-field date-field">
              <label htmlFor="date">DEPARTURE DATE</label>

              <div className="input-row">
                <CalendarIcon />
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
            </div>

            <button className="search-button" type="submit">
              <SearchIcon />
              Search Trips
            </button>
          </form>

          <div className="hero-benefits">
            <span>
              <CheckIcon /> No hidden booking fees
            </span>

            <span>
              <CheckIcon /> Secure reservation
            </span>

            <span>
              <CheckIcon /> Easy seat selection
            </span>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="section-heading">
          <span>WHY CHOOSE US</span>
          <h2>A better way to travel</h2>
          <p>
            From searching for a trip to choosing your seat, we make every step
            simple.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <div className="feature-icon">
              <SearchIcon />
            </div>
            <h3>Easy Booking</h3>
            <p>
              Search available routes and reserve your journey in just a few
              simple steps.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-icon">
              <SeatIcon />
            </div>
            <h3>Choose Your Seat</h3>
            <p>
              See seat availability clearly and choose where you want to sit
              before booking.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-icon">
              <TicketIcon />
            </div>
            <h3>Clear Pricing</h3>
            <p>
              View your trip fare before confirming so you always know what
              you're booking.
            </p>
          </article>

          <article className="feature-card">
            <div className="feature-icon">
              <ShieldIcon />
            </div>
            <h3>Reliable Travel</h3>
            <p>
              Keep your bookings organized and check your trip information
              whenever you need it.
            </p>
          </article>
        </div>
      </section>

      <section className="cta-section">
        <div>
          <span>READY FOR YOUR NEXT TRIP?</span>
          <h2>Find your journey today.</h2>
        </div>

        <a href="#top" className="light-button">
          Search Trips
          <span>→</span>
        </a>
      </section>

      <footer>
        <div className="footer-brand">
          <span className="brand-icon footer-icon">
            <BusIcon />
          </span>
          <div>
            <strong>GoRoute</strong>
            <p>Van & Bus Booking System</p>
          </div>
        </div>

        <p>© 2026 GoRoute. Web Design & Development Project.</p>
      </footer>
    </main>
  );
}

function BusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h12a3 3 0 0 1 3 3v10a2 2 0 0 1-2 2h-1v2a1 1 0 0 1-2 0v-2H8v2a1 1 0 0 1-2 0v-2H5a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v5h14V6a1 1 0 0 0-1-1H6Zm-.5 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm13 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 22s7-6.1 7-13A7 7 0 1 0 5 9c0 6.9 7 13 7 13Zm0-9.5A3.5 3.5 0 1 1 12 5a3.5 3.5 0 0 1 0 7.5Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 9H5v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8ZM5 9h14V7a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v2Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m21 19.6-5.2-5.2a7.5 7.5 0 1 0-1.4 1.4l5.2 5.2a1 1 0 0 0 1.4-1.4ZM5 10a5 5 0 1 1 10 0 5 5 0 0 1-10 0Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.2 16.2 5 12l-1.4 1.4L9.2 19 21 7.2 19.6 5.8 9.2 16.2Z" />
    </svg>
  );
}

function SeatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3a3 3 0 0 1 3 3v5h4V6a3 3 0 1 1 6 0v9a4 4 0 0 1-4 4H8v2a1 1 0 1 1-2 0v-2H4a2 2 0 0 1-2-2v-5a2 2 0 1 1 4 0v3h10a1 1 0 0 0 1-1V6a1 1 0 1 0-2 0v7H8V6a1 1 0 0 0-2 0v3a1 1 0 0 1-2 0V6a3 3 0 0 1 3-3Z" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 10a2 2 0 0 1 0 4v5H3v-5a2 2 0 0 1 0-4V5h18v5ZM5 7v2a4 4 0 0 1 0 6v2h14v-2a4 4 0 0 1 0-6V7H5Zm6 1h2v2h-2V8Zm0 3h2v2h-2v-2Zm0 3h2v2h-2v-2Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 20 5v6c0 5.1-3.4 9.8-8 11-4.6-1.2-8-5.9-8-11V5l8-3Zm0 2.1L6 6.3V11c0 3.9 2.5 7.6 6 8.8 3.5-1.2 6-4.9 6-8.8V6.3l-6-2.2Zm-1 10.3-3-3 1.4-1.4 1.6 1.6 3.6-3.6 1.4 1.4-5 5Z" />
    </svg>
  );
}