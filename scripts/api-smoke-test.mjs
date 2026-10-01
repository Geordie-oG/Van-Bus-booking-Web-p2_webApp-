// Van & Bus Booking System — backend API smoke test (auth-aware)
//
// Usage:
//   npm run seed                                   # reset + seed the target database
//   npm run dev                                    # or: npm run build && npm run start
//   BASE=http://localhost:3000 node scripts/api-smoke-test.mjs
//
// Exits 0 when every check passes. Covers public endpoints, JWT cookie/Bearer
// auth, booking rules (capacity, duplicates, departed trips, cancellation),
// admin CRUD, ownership isolation and the authorization guards.
const BASE = process.env.BASE || "http://localhost:3000";
const ADMIN_CREDS = { email: "admin@transport.com", password: "demo123" };
const CUSTOMER_CREDS = { email: "customer@example.com", password: "demo123" };

let pass = 0;
let fail = 0;
const failures = [];

function check(name, cond, extra = "") {
  if (cond) {
    pass++;
    console.log("  \u2705 " + name);
  } else {
    fail++;
    failures.push(name + (extra ? " [" + extra + "]" : ""));
    console.log("  \u274c " + name + (extra ? "  <-- " + extra : ""));
  }
}
function section(title) {
  console.log("\n=== " + title + " ===");
}

async function req(method, path, { body, headers = {}, cookie } = {}) {
  const h = { ...headers };
  if (body) h["content-type"] = "application/json";
  if (cookie) h.cookie = cookie;
  const res = await fetch(BASE + path, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON response */ }
  let cookieHeader = "";
  try {
    const list =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : [res.headers.get("set-cookie") || ""];
    cookieHeader = list.filter(Boolean).map((c) => c.split(";")[0]).join("; ");
  } catch { cookieHeader = ""; }
  return {
    status: res.status,
    json,
    cookie: cookieHeader,
    rawSetCookie: res.headers.get("set-cookie") || "",
    text,
  };
}

async function login(creds) {
  const res = await req("POST", "/api/auth/login", { body: creds });
  return { status: res.status, cookie: res.cookie, data: res.json?.data };
}


async function main() {
  console.log("Backend API smoke test against " + BASE);
  const stamp = Date.now();

  // ------------------------------------------------------- SESSION SETUP
  section("0. Session setup (seeded demo accounts)");
  const admin = await login(ADMIN_CREDS);
  const customer = await login(CUSTOMER_CREDS);
  check("admin login -> 200 (+ auth cookie)", admin.status === 200 && /auth_token=/.test(admin.cookie), "status=" + admin.status);
  check("customer login -> 200 (+ auth cookie)", customer.status === 200 && /auth_token=/.test(customer.cookie), "status=" + customer.status);
  check("admin role is administrator", admin.data?.user?.role === "administrator", "role=" + admin.data?.user?.role);
  check("customer role is customer", customer.data?.user?.role === "customer", "role=" + customer.data?.user?.role);

  const adminId = admin.data?.user?.userId;
  const customerId = customer.data?.user?.userId;

  // --------------------------------------------------- 1. PUBLIC ENDPOINTS
  section("1. Public read endpoints");
  const vehList = await req("GET", "/api/vehicles");
  check("GET /api/vehicles -> 200 (public fleet list)", vehList.status === 200 && vehList.json?.success === true, "status=" + vehList.status);
  check("fleet has seeded vehicles (>=2)", (vehList.json?.data || []).length >= 2, "count=" + vehList.json?.data?.length);

  const tripList = await req("GET", "/api/trips");
  const trips = tripList.json?.data || [];
  check("GET /api/trips -> 200", tripList.status === 200 && tripList.json?.success === true, "status=" + tripList.status);
  check("trips populate vehicleId (plateNumber present)", !!trips[0]?.vehicleId?.plateNumber);
  check("default filter returns scheduled trips only", trips.every((t) => t.status === "scheduled"), "statuses=" + [...new Set(trips.map((t) => t.status))].join(","));
  const times = trips.map((t) => new Date(t.departureTime).getTime());
  check("trips sorted by departureTime ascending", times.every((v, i) => i === 0 || times[i - 1] <= v));

  const searched = await req("GET", "/api/trips?origin=bangkok&destination=PATTAYA");
  check("trip search is case-insensitive", searched.status === 200 && (searched.json?.data || []).length === 1, "count=" + (searched.json?.data || []).length);
  const allTrips = await req("GET", "/api/trips?status=all");
  const departedTrip = (allTrips.json?.data || []).find((t) => t.status === "departed");
  check("GET /api/trips?status=all includes the departed trip", !!departedTrip);

  const vanTrip = trips.find((t) => t.vehicleId?.capacity === 14);
  check("seeded van trip found (capacity 14)", !!vanTrip, "plates=" + trips.map((t) => t.vehicleId?.plateNumber).join(","));
  const tripDetail = await req("GET", "/api/trips/" + vanTrip?._id);
  check("GET /api/trips/:id -> 200", tripDetail.status === 200 && tripDetail.json?.success === true, "status=" + tripDetail.status);
  const vehDetail = await req("GET", "/api/vehicles/" + vanTrip?.vehicleId?._id);
  check("GET /api/vehicles/:id -> 200", vehDetail.status === 200 && !!vehDetail.json?.data?.plateNumber, "status=" + vehDetail.status);
  check("GET /api/vehicles/:id malformed -> 400", (await req("GET", "/api/vehicles/not-an-id")).status === 400);
  check("GET /api/vehicles/:id unknown -> 404", (await req("GET", "/api/vehicles/64b7f0f0f0f0f0f0f0f0f0f0")).status === 404);

  // ------------------------------------------------- 2. SEAT AVAILABILITY
  section("2. Seat availability (booking-module core)");
  const av1 = await req("GET", "/api/trips/" + vanTrip?._id + "/availability");
  const a1 = av1.json?.data || {};
  check("GET /api/trips/:id/availability -> 200", av1.status === 200 && av1.json?.success === true, "status=" + av1.status);
  check("availability totalCapacity = 14", a1.totalCapacity === 14, "totalCapacity=" + a1.totalCapacity);
  check("availability bookedSeats = [1,2] (from seed)", JSON.stringify(a1.bookedSeats) === "[1,2]", "bookedSeats=" + JSON.stringify(a1.bookedSeats));
  check("availability remainingCapacity = 12", a1.remainingCapacity === 12, "remaining=" + a1.remainingCapacity);
  check("availableSeats excludes booked seats", !a1.availableSeats?.includes(1) && !a1.availableSeats?.includes(2) && a1.availableSeats?.length === 12, "len=" + a1.availableSeats?.length);
  check("isBookingAllowed = true for future scheduled trip", a1.isBookingAllowed === true);
  check("availability includes vehicle summary", a1.vehicle?.plateNumber === "VAN-101" && a1.vehicle?.type === "van");
  const avDep = await req("GET", "/api/trips/" + departedTrip?._id + "/availability");
  check("departed trip: isBookingAllowed = false", avDep.json?.data?.isBookingAllowed === false);
  check("availability malformed id -> 400", (await req("GET", "/api/trips/xyz/availability")).status === 400);
  check("availability unknown trip -> 404", (await req("GET", "/api/trips/64b7f0f0f0f0f0f0f0f0f0f0/availability")).status === 404);

  // ------------------------------------------ 3. AUTH & ROLE ESCALATION
  section("3. Auth, session handling & privilege-escalation guards");
  const meAnon = await req("GET", "/api/auth/me");
  check("GET /api/auth/me anonymous -> 401", meAnon.status === 401, "status=" + meAnon.status);
  const meCookie = await req("GET", "/api/auth/me", { cookie: customer.cookie });
  check("GET /api/auth/me with cookie -> 200", meCookie.status === 200 && meCookie.json?.data?.email === CUSTOMER_CREDS.email, "status=" + meCookie.status);
  const meHeader = await req("GET", "/api/auth/me", { headers: { "x-user-id": adminId, "x-user-role": "administrator" } });
  check("forged x-user-id/x-user-role headers -> 401 (impersonation blocked)", meHeader.status === 401, "status=" + meHeader.status);

  const newEmail = "smoke." + stamp + "@example.com";
  const reg = await req("POST", "/api/auth/register", { body: { name: "Smoke User", email: newEmail, password: "secret123" } });
  check("POST /api/auth/register -> 201 + cookie", reg.status === 201 && /auth_token=/.test(reg.cookie), "status=" + reg.status);
  check("register returns JWT + no passwordHash", !!reg.json?.data?.token && reg.json?.data?.user?.passwordHash === undefined);
  const regAsAdmin = await req("POST", "/api/auth/register", { body: { name: "Sneaky Admin", email: "sneaky." + stamp + "@example.com", password: "secret123", role: "administrator" } });
  check("register with role=administrator -> downgraded to customer", regAsAdmin.json?.data?.user?.role === "customer", "role=" + regAsAdmin.json?.data?.user?.role);
  check("register duplicate email -> 409", (await req("POST", "/api/auth/register", { body: { name: "Dup", email: newEmail, password: "secret123" } })).status === 409);
  check("register short password -> 400", (await req("POST", "/api/auth/register", { body: { name: "X", email: "x." + stamp + "@example.com", password: "123" } })).status === 400);
  check("login wrong password -> 401", (await req("POST", "/api/auth/login", { body: { email: CUSTOMER_CREDS.email, password: "nope" } })).status === 401);
  const logout = await req("POST", "/api/auth/logout", { cookie: customer.cookie });
  check("POST /api/auth/logout -> 200 + clears cookie", logout.status === 200 && /Max-Age=0/i.test(logout.rawSetCookie), "status=" + logout.status);
  const meBearer = await req("GET", "/api/auth/me", { headers: { authorization: "Bearer " + customer.data.token } });
  check("GET /api/auth/me via Bearer token -> 200", meBearer.status === 200 && meBearer.json?.data?.userId === customerId, "status=" + meBearer.status);

  // customer B for cross-account isolation checks
  const bEmail = "smoke.b." + stamp + "@example.com";
  await req("POST", "/api/auth/register", { body: { name: "Smoke B", email: bEmail, password: "secret123" } });
  const customerB = await login({ email: bEmail, password: "secret123" });
  const customerBId = customerB.data?.user?.userId;
  check("second customer session established", customerB.status === 200 && !!customerBId, "status=" + customerB.status);


  // --------------------------------------------------- 4. BOOKING MODULE
  section("4. Booking module (auth, validation, duplicate guard, cancel & release)");
  const anonBook = await req("POST", "/api/bookings", { body: { tripId: vanTrip?._id, seatNumbers: [3], passengerName: "Anonymous" } });
  check("POST /api/bookings anonymous -> 401", anonBook.status === 401, "status=" + anonBook.status);

  const b1 = await req("POST", "/api/bookings", { cookie: customer.cookie, body: { tripId: vanTrip?._id, seatNumbers: [3, 4], passengerName: "Sample Customer" } });
  check("POST /api/bookings as customer -> 201 confirmed", b1.status === 201 && b1.json?.data?.status === "confirmed", "status=" + b1.status + " body=" + JSON.stringify(b1.json).slice(0, 160));
  check("booking seats echoed [3,4]", JSON.stringify(b1.json?.data?.seatNumbers) === "[3,4]");
  const booking1Id = b1.json?.data?._id;
  const spoof = await req("POST", "/api/bookings", { cookie: customerB.cookie, body: { tripId: vanTrip?._id, seatNumbers: [8], passengerName: "Smoke B", userId: adminId } });
  check("client-supplied userId ignored (booked under session user)", String(spoof.json?.data?.userId?._id) === customerBId, "owner=" + spoof.json?.data?.userId?._id);

  const av2 = await req("GET", "/api/trips/" + vanTrip?._id + "/availability");
  check("availability now bookedSeats [1,2,3,4,8]", JSON.stringify(av2.json?.data?.bookedSeats) === "[1,2,3,4,8]", JSON.stringify(av2.json?.data?.bookedSeats));
  check("availability remainingCapacity = 9", av2.json?.data?.remainingCapacity === 9, "remaining=" + av2.json?.data?.remainingCapacity);

  const dupSeat = await req("POST", "/api/bookings", { cookie: customerB.cookie, body: { tripId: vanTrip?._id, seatNumbers: [4, 5], passengerName: "Smoke B" } });
  check("overlapping seat -> 409 with clear message", dupSeat.status === 409 && /already reserved/i.test(dupSeat.json?.error || ""), "status=" + dupSeat.status + " error=" + dupSeat.json?.error);
  check("seat beyond capacity -> 400", (await req("POST", "/api/bookings", { cookie: customerB.cookie, body: { tripId: vanTrip?._id, seatNumbers: [99], passengerName: "Smoke B" } })).status === 400);
  check("seat 0 -> 400", (await req("POST", "/api/bookings", { cookie: customerB.cookie, body: { tripId: vanTrip?._id, seatNumbers: [0], passengerName: "Smoke B" } })).status === 400);
  check("duplicate seats in one request -> 400", (await req("POST", "/api/bookings", { cookie: customerB.cookie, body: { tripId: vanTrip?._id, seatNumbers: [7, 7], passengerName: "Smoke B" } })).status === 400);
  check("1-character passengerName -> 400", (await req("POST", "/api/bookings", { cookie: customerB.cookie, body: { tripId: vanTrip?._id, seatNumbers: [7], passengerName: "A" } })).status === 400);
  check("malformed tripId -> 400", (await req("POST", "/api/bookings", { cookie: customerB.cookie, body: { tripId: "123", seatNumbers: [7], passengerName: "Smoke B" } })).status === 400);
  check("unknown trip -> 404", (await req("POST", "/api/bookings", { cookie: customerB.cookie, body: { tripId: "64b7f0f0f0f0f0f0f0f0f0f0", seatNumbers: [7], passengerName: "Smoke B" } })).status === 404);
  const depBook = await req("POST", "/api/bookings", { cookie: customer.cookie, body: { tripId: departedTrip?._id, seatNumbers: [1], passengerName: "Sample Customer" } });

  const listAnon = await req("GET", "/api/bookings");
  check("GET /api/bookings anonymous -> 401", listAnon.status === 401, "status=" + listAnon.status);
  const listMine = await req("GET", "/api/bookings", { cookie: customer.cookie });
  check("customer booking list returns only own bookings", listMine.status === 200 && (listMine.json?.data || []).length > 0 && (listMine.json?.data || []).every((b) => String(b.userId?._id) === customerId), "count=" + (listMine.json?.data || []).length);
  const listSpoofed = await req("GET", "/api/bookings?userId=" + customerBId, { cookie: customer.cookie });
  check("customer cannot widen the list with ?userId= (still scoped to self)", (listSpoofed.json?.data || []).every((b) => String(b.userId?._id) === customerId), "count=" + (listSpoofed.json?.data || []).length);
  const listAdmin = await req("GET", "/api/bookings", { cookie: admin.cookie });
  check("admin booking list returns all bookings", listAdmin.status === 200 && (listAdmin.json?.data || []).length >= (listMine.json?.data || []).length, "adminCount=" + (listAdmin.json?.data || []).length + " mine=" + (listMine.json?.data || []).length);

  const getOwn = await req("GET", "/api/bookings/" + booking1Id, { cookie: customer.cookie });
  check("GET /api/bookings/:id as owner -> 200", getOwn.status === 200 && getOwn.json?.data?._id === booking1Id, "status=" + getOwn.status);
  check("GET /api/bookings/:id anonymous -> 401", (await req("GET", "/api/bookings/" + booking1Id)).status === 401);
  check("GET /api/bookings/:id as other customer -> 403", (await req("GET", "/api/bookings/" + booking1Id, { cookie: customerB.cookie })).status === 403);
  check("GET /api/bookings/:id as admin -> 200", (await req("GET", "/api/bookings/" + booking1Id, { cookie: admin.cookie })).status === 200);
  check("GET /api/bookings/:id malformed -> 400", (await req("GET", "/api/bookings/zzz", { cookie: customer.cookie })).status === 400);
  check("GET /api/bookings/:id unknown -> 404", (await req("GET", "/api/bookings/64b7f0f0f0f0f0f0f0f0f0f0", { cookie: customer.cookie })).status === 404);

  check("PATCH invalid status -> 400", (await req("PATCH", "/api/bookings/" + booking1Id, { cookie: customer.cookie, body: { status: "nonsense" } })).status === 400);
  check("PATCH another customer's booking -> 403", (await req("PATCH", "/api/bookings/" + booking1Id, { cookie: customerB.cookie, body: { status: "cancelled" } })).status === 403);
  const patchCancel = await req("PATCH", "/api/bookings/" + booking1Id, { cookie: customer.cookie, body: { status: "cancelled" } });
  check("PATCH own booking to cancelled -> 200", patchCancel.status === 200 && patchCancel.json?.data?.status === "cancelled", "status=" + patchCancel.status);
  const av3 = await req("GET", "/api/trips/" + vanTrip?._id + "/availability");
  check("cancelling released seats 3,4 back to inventory", JSON.stringify(av3.json?.data?.bookedSeats) === "[1,2,8]", JSON.stringify(av3.json?.data?.bookedSeats));

  const rebook = await req("POST", "/api/bookings", { cookie: customerB.cookie, body: { tripId: vanTrip?._id, seatNumbers: [3, 4], passengerName: "Smoke B" } });
  check("another customer can re-book released seats -> 201", rebook.status === 201, "status=" + rebook.status + " error=" + rebook.json?.error);
  const rebookId = rebook.json?.data?._id;
  check("DELETE another customer's booking -> 403", (await req("DELETE", "/api/bookings/" + rebookId, { cookie: customer.cookie })).status === 403);
  const delOwn = await req("DELETE", "/api/bookings/" + rebookId, { cookie: customerB.cookie });
  check("DELETE own booking releases seats", delOwn.status === 200 && JSON.stringify(delOwn.json?.data?.releasedSeats) === "[3,4]", "status=" + delOwn.status + " data=" + JSON.stringify(delOwn.json?.data));
  check("DELETE unknown booking -> 404", (await req("DELETE", "/api/bookings/64b7f0f0f0f0f0f0f0f0f0f0", { cookie: customerB.cookie })).status === 404);


  // ------------------------------------------------------- 5. ADMIN CRUD
  section("5. Admin CRUD (vehicles + trips + users) and its guards");
  const plate = "SMOKE-" + stamp;
  const anonVeh = await req("POST", "/api/vehicles", { body: { plateNumber: "ANON-" + stamp, capacity: 10 } });
  check("POST /api/vehicles anonymous -> 403", anonVeh.status === 403, "status=" + anonVeh.status);
  const custVeh = await req("POST", "/api/vehicles", { cookie: customer.cookie, body: { plateNumber: "CUST-" + stamp, capacity: 10 } });
  check("POST /api/vehicles as customer -> 403", custVeh.status === 403, "status=" + custVeh.status);
  const newVeh = await req("POST", "/api/vehicles", { cookie: admin.cookie, body: { plateNumber: plate.toLowerCase(), type: "van", capacity: 16 } });
  check("POST /api/vehicles as admin -> 201 (plate upper-cased)", newVeh.status === 201 && newVeh.json?.data?.plateNumber === plate, "status=" + newVeh.status);
  const newVehId = newVeh.json?.data?._id;
  check("duplicate plate -> 409", (await req("POST", "/api/vehicles", { cookie: admin.cookie, body: { plateNumber: plate, capacity: 16 } })).status === 409);
  check("missing capacity -> 400", (await req("POST", "/api/vehicles", { cookie: admin.cookie, body: { plateNumber: "NO-CAP-" + stamp } })).status === 400);
  check("capacity 0 -> 400", (await req("POST", "/api/vehicles", { cookie: admin.cookie, body: { plateNumber: "ZERO-" + stamp, capacity: 0 } })).status === 400);
  const patchVeh = await req("PATCH", "/api/vehicles/" + newVehId, { cookie: admin.cookie, body: { capacity: 20 } });
  check("PATCH /api/vehicles/:id as admin -> 200 capacity=20", patchVeh.status === 200 && patchVeh.json?.data?.capacity === 20, "status=" + patchVeh.status);
  check("PATCH vehicle as customer -> 403", (await req("PATCH", "/api/vehicles/" + newVehId, { cookie: customer.cookie, body: { capacity: 99 } })).status === 403);
  check("PATCH negative capacity -> 400", (await req("PATCH", "/api/vehicles/" + newVehId, { cookie: admin.cookie, body: { capacity: -5 } })).status === 400);
  check("PATCH unknown vehicle -> 404", (await req("PATCH", "/api/vehicles/64b7f0f0f0f0f0f0f0f0f0f0", { cookie: admin.cookie, body: { capacity: 10 } })).status === 404);

  check("booking a departed trip -> 400 (departed-trip guard)", depBook.status === 400, "status=" + depBook.status + " error=" + depBook.json?.error);


  const newTrip = await req("POST", "/api/trips", { cookie: admin.cookie, body: { vehicleId: newVehId, origin: "Yangon", destination: "Mandalay", departureTime: new Date(Date.now() + 86400000).toISOString(), fare: 25 } });
  check("POST /api/trips as admin -> 201 (vehicle populated)", newTrip.status === 201 && !!newTrip.json?.data?.vehicleId?.plateNumber, "status=" + newTrip.status);
  const newTripId = newTrip.json?.data?._id;
  check("POST /api/trips anonymous -> 403", (await req("POST", "/api/trips", { body: { vehicleId: newVehId, origin: "A", destination: "B", departureTime: new Date().toISOString(), fare: 1 } })).status === 403);
  check("POST /api/trips missing fields -> 400", (await req("POST", "/api/trips", { cookie: admin.cookie, body: { origin: "Yangon" } })).status === 400);
  check("POST /api/trips malformed vehicleId -> 400", (await req("POST", "/api/trips", { cookie: admin.cookie, body: { vehicleId: "abc", origin: "A", destination: "B", departureTime: new Date().toISOString(), fare: 5 } })).status === 400);
  check("POST /api/trips unknown vehicle -> 400", (await req("POST", "/api/trips", { cookie: admin.cookie, body: { vehicleId: "64b7f0f0f0f0f0f0f0f0f0f0", origin: "A", destination: "B", departureTime: new Date().toISOString(), fare: 5 } })).status === 400);
  check("POST /api/trips invalid date -> 400", (await req("POST", "/api/trips", { cookie: admin.cookie, body: { vehicleId: newVehId, origin: "A", destination: "B", departureTime: "not-a-date", fare: 5 } })).status === 400);
  const patchTrip = await req("PATCH", "/api/trips/" + newTripId, { cookie: admin.cookie, body: { fare: 30, destination: "Naypyidaw" } });
  check("PATCH /api/trips/:id -> 200 updates fare + destination", patchTrip.status === 200 && patchTrip.json?.data?.fare === 30 && patchTrip.json?.data?.destination === "Naypyidaw", "status=" + patchTrip.status);
  check("PATCH negative fare -> 400", (await req("PATCH", "/api/trips/" + newTripId, { cookie: admin.cookie, body: { fare: -1 } })).status === 400);
  check("PATCH trip as customer -> 403", (await req("PATCH", "/api/trips/" + newTripId, { cookie: customer.cookie, body: { fare: 1 } })).status === 403);
  const busyVeh = await req("DELETE", "/api/vehicles/" + newVehId, { cookie: admin.cookie });
  check("DELETE vehicle with upcoming trip -> 400 (referential guard)", busyVeh.status === 400, "status=" + busyVeh.status + " error=" + busyVeh.json?.error);

  check("GET /api/users anonymous -> 403", (await req("GET", "/api/users")).status === 403);
  check("GET /api/users as customer -> 403", (await req("GET", "/api/users", { cookie: customer.cookie })).status === 403);
  const usersAdmin = await req("GET", "/api/users", { cookie: admin.cookie });
  check("GET /api/users as admin -> 200, no passwordHash leaked", usersAdmin.status === 200 && (usersAdmin.json?.data || []).length >= 2 && (usersAdmin.json?.data || []).every((u) => u.passwordHash === undefined), "status=" + usersAdmin.status);
  check("POST /api/users anonymous -> 403", (await req("POST", "/api/users", { body: { name: "Nope", email: "nope." + stamp + "@example.com", password: "secret123" } })).status === 403);

  const bookOnNewTrip = await req("POST", "/api/bookings", { cookie: customer.cookie, body: { tripId: newTripId, seatNumbers: [1, 2], passengerName: "Sample Customer" } });
  check("customer books seats on the new trip -> 201", bookOnNewTrip.status === 201, "status=" + bookOnNewTrip.status);
  const cancelTrip = await req("DELETE", "/api/trips/" + newTripId, { cookie: admin.cookie });
  check("DELETE /api/trips/:id as admin -> 200 (cancelled)", cancelTrip.status === 200 && cancelTrip.json?.data?.status === "cancelled", "status=" + cancelTrip.status);
  const tripBookings = await req("GET", "/api/bookings?tripId=" + newTripId, { cookie: admin.cookie });
  check("cancelling a trip auto-cancels its bookings (seats freed)", tripBookings.status === 200 && (tripBookings.json?.data || []).length >= 1 && (tripBookings.json?.data || []).every((b) => b.status === "cancelled"), JSON.stringify((tripBookings.json?.data || []).map((b) => b.status)));
  const freeVeh = await req("DELETE", "/api/vehicles/" + newVehId, { cookie: admin.cookie });
  check("DELETE vehicle without upcoming trips -> 200 (soft-delete inactive)", freeVeh.status === 200 && freeVeh.json?.data?.status === "inactive", "status=" + freeVeh.status);



  // ------------------------------------------- 6. SECURITY REGRESSION SET
  section("6. Security regression checks (previously open endpoints)");
  const forgeAdmin = { "x-user-id": adminId, "x-user-role": "administrator" };
  check("header-only admin impersonation on POST /api/vehicles -> 403", (await req("POST", "/api/vehicles", { headers: forgeAdmin, body: { plateNumber: "HACK-" + stamp, capacity: 5 } })).status === 403);
  check("header-only impersonation on POST /api/trips -> 403", (await req("POST", "/api/trips", { headers: forgeAdmin, body: { vehicleId: vanTrip?.vehicleId?._id, origin: "H", destination: "X", departureTime: new Date(Date.now() + 172800000).toISOString(), fare: 1 } })).status === 403);
  check("anonymous DELETE /api/vehicles/:id -> 403", (await req("DELETE", "/api/vehicles/" + vanTrip?.vehicleId?._id)).status === 403);
  check("anonymous DELETE /api/trips/:id -> 403", (await req("DELETE", "/api/trips/" + vanTrip?._id)).status === 403);
  check("anonymous GET /api/bookings -> 401", (await req("GET", "/api/bookings")).status === 401);
  check("anonymous GET /api/users -> 403", (await req("GET", "/api/users")).status === 403);
  check("seeded fleet untouched by blocked calls", (await req("GET", "/api/vehicles")).json?.data?.some((v) => v.plateNumber === "VAN-101"));
  check("seeded trip still scheduled after blocked DELETE", (await req("GET", "/api/trips/" + vanTrip?._id)).json?.data?.status === "scheduled");

  console.log("\n==================================================");
  console.log("RESULT: " + pass + "/" + (pass + fail) + " checks passed");
  if (failures.length) {
    console.log("FAILED CHECKS:");
    failures.forEach((f) => console.log("  - " + f));
  }
  console.log("==================================================");
  process.exitCode = fail === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error("SMOKE TEST CRASHED:", error);
  process.exitCode = 2;
});
