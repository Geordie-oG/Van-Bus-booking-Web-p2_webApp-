export default function Home() {
  return (
    <main style={{ fontFamily: "monospace", padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Van &amp; Bus Booking System — API</h1>
      <p>CSX4107 Project 2 · Booking &amp; Seat Availability Module</p>
      <hr />
      <h2>Available Endpoints</h2>

      <h3>Bookings</h3>
      <ul>
        <li>GET /api/bookings</li>
        <li>POST /api/bookings</li>
        <li>GET /api/bookings/:id</li>
        <li>PATCH /api/bookings/:id</li>
        <li>DELETE /api/bookings/:id</li>
      </ul>

      <h3>Trips</h3>
      <ul>
        <li>GET /api/trips</li>
        <li>POST /api/trips</li>
        <li>GET /api/trips/:id</li>
        <li>PATCH /api/trips/:id</li>
        <li>DELETE /api/trips/:id</li>
        <li>GET /api/trips/:id/availability</li>
      </ul>

      <h3>Vehicles</h3>
      <ul>
        <li>GET /api/vehicles</li>
        <li>POST /api/vehicles</li>
        <li>GET /api/vehicles/:id</li>
        <li>PATCH /api/vehicles/:id</li>
        <li>DELETE /api/vehicles/:id</li>
      </ul>

      <h3>Users</h3>
      <ul>
        <li>GET /api/users</li>
        <li>POST /api/users</li>
      </ul>

      <h3>Auth</h3>
      <ul>
        <li>POST /api/auth/register</li>
        <li>POST /api/auth/login</li>
        <li>POST /api/auth/logout</li>
        <li>GET /api/auth/me</li>
      </ul>

      <hr />
      <p>All responses: <code>{"{ success, data, message }"}</code> or <code>{"{ success, error }"}</code></p>
    </main>
  );
}
