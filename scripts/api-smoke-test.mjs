// Van & Bus Booking System - backend API smoke test
// Run against a live dev server:  BASE=http://localhost:3123 node /tmp/p2_api_smoke.mjs
const BASE = process.env.BASE || "http://localhost:3123";

let pass = 0, fail = 0;
const failures = [];
const observations = [];

function check(name, cond, extra = "") {
  if (cond) { pass++; console.log("  \u2705 " + name); }
  else { fail++; failures.push(name + (extra ? " [" + extra + "]" : "")); console.log("  \u274c " + name + (extra ? "  <-- " + extra : "")); }
}
function observe(name, value) { observations.push({ name, value }); console.log("  \u2139\ufe0f  " + name + " => " + value); }
function section(t) { console.log("\n=== " + t + " ==="); }

async function req(method, path, { body, headers = {} } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { "content-type": "application/json", ...headers } : headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-json */ }
  let cookie = "";
  try {
    const list = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [res.headers.get("set-cookie") || ""];
    cookie = list.filter(Boolean).map((c) => c.split(";")[0]).join("; ");
  } catch { cookie = ""; }
  return { status: res.status, json, cookie, rawSetCookie: res.headers.get("set-cookie") || "", text };
}
const J = Date.now();
const api = (p) => p;


async function main() {
  console.log("Backend API smoke test against " + BASE);

  // ---------------------------------------------------------------- A. READS
  section("A. Read endpoints (vehicles / trips / users)");
  const vehList = await req("GET", api("/api/vehicles"));
  check("GET /api/vehicles -> 200 + success:true", vehList.status === 200 && vehList.json?.success === true, "status=" + vehList.status);
  check("GET /api/vehicles returns seeded fleet (>=2)", Array.isArray(vehList.json?.data) && vehList.json.data.length >= 2, "count=" + vehList.json?.data?.length);

  const tripList = await req("GET", api("/api/trips"));
  const trips = tripList.json?.data || [];
  check("GET /api/trips -> 200 + success:true", tripList.status === 200 && tripList.json?.success === true, "status=" + tripList.status);
  check("GET /api/trips populates vehicleId (plateNumber present)", !!trips[0]?.vehicleId?.plateNumber, "vehicleId=" + JSON.stringify(trips[0]?.vehicleId));
  check("GET /api/trips default filters status=scheduled", trips.every((t) => t.status === "scheduled"), "statuses=" + [...new Set(trips.map((t) => t.status))].join(","));
  const sorted = trips.map((t) => new Date(t.departureTime).getTime());
  check("GET /api/trips sorted by departureTime ascending", sorted.every((v, i) => i === 0 || sorted[i - 1] <= v));

  const filtered = await req("GET", api("/api/trips?origin=bangkok&destination=PATTAYA"));
  check("GET /api/trips?origin&destination is case-insensitive", filtered.status === 200 && (filtered.json?.data || []).length === 1, "count=" + (filtered.json?.data || []).length);

  const allTrips = await req("GET", api("/api/trips?status=all"));
  check("GET /api/trips?status=all includes departed trip", (allTrips.json?.data || []).some((t) => t.status === "departed"), "statuses=" + [...new Set((allTrips.json?.data || []).map((t) => t.status))].join(","));

  const vanTrip = trips.find((t) => t.vehicleId?.capacity === 14);
  const droppedTrip = (allTrips.json?.data || []).find((t) => t.status === "departed");
  check("Seeded van trip found (capacity 14)", !!vanTrip, JSON.stringify(trips.map((t) => t.vehicleId?.plateNumber)));

  const oneTrip = await req("GET", api("/api/trips/" + vanTrip?._id));
  check("GET /api/trips/:id -> 200", oneTrip.status === 200 && oneTrip.json?.success === true, "status=" + oneTrip.status);
  const oneVeh = await req("GET", api("/api/vehicles/" + vanTrip?.vehicleId?._id));
  check("GET /api/vehicles/:id -> 200", oneVeh.status === 200 && oneVeh.json?.data?.plateNumber === "VAN-101", "status=" + oneVeh.status);
  const missingVeh = await req("GET", api("/api/vehicles/64b7f0f0f0f0f0f0f0f0f0f0"));
  check("GET /api/vehicles/:id unknown -> 404", missingVeh.status === 404, "status=" + missingVeh.status);
  const badVeh = await req("GET", api("/api/vehicles/not-an-objectid"));
  check("GET /api/vehicles/:id malformed -> 400", badVeh.status === 400, "status=" + badVeh.status);

  const users = await req("GET", api("/api/users"));
  check("GET /api/users -> 200", users.status === 200 && (users.json?.data || []).length >= 2, "status=" + users.status);
  check("GET /api/users never leaks passwordHash", (users.json?.data || []).every((u) => u.passwordHash === undefined));

  // --------------------------------------------------------- B. AVAILABILITY
  section("B. Seat availability (booking-module core)");
  const av1 = await req("GET", api("/api/trips/" + vanTrip?._id + "/availability"));
  const a1 = av1.json?.data || {};
  check("GET /api/trips/:id/availability -> 200", av1.status === 200 && av1.json?.success === true, "status=" + av1.status);
  check("availability: totalCapacity = 14", a1.totalCapacity === 14, "totalCapacity=" + a1.totalCapacity);
  check("availability: bookedSeats = [1,2] from seed", JSON.stringify(a1.bookedSeats) === "[1,2]", "bookedSeats=" + JSON.stringify(a1.bookedSeats));
  check("availability: remainingCapacity = 12", a1.remainingCapacity === 12, "remainingCapacity=" + a1.remainingCapacity);
  check("availability: availableSeats excludes booked seats", Array.isArray(a1.availableSeats) && !a1.availableSeats.includes(1) && !a1.availableSeats.includes(2) && a1.availableSeats.length === 12, "len=" + a1.availableSeats?.length);
  check("availability: isBookingAllowed true for future scheduled trip", a1.isBookingAllowed === true);
  check("availability: vehicle summary present", a1.vehicle?.plateNumber === "VAN-101" && a1.vehicle?.type === "van", JSON.stringify(a1.vehicle));

  const avDep = await req("GET", api("/api/trips/" + droppedTrip?._id + "/availability"));
  check("availability: departed trip has isBookingAllowed=false", avDep.json?.data?.isBookingAllowed === false, "value=" + avDep.json?.data?.isBookingAllowed);
  const avBad = await req("GET", api("/api/trips/xyz/availability"));
  check("availability: malformed id -> 400", avBad.status === 400, "status=" + avBad.status);
  const avMissing = await req("GET", api("/api/trips/64b7f0f0f0f0f0f0f0f0f0f0/availability"));
  check("availability: unknown trip -> 404", avMissing.status === 404, "status=" + avMissing.status);

  // ------------------------------------------------------------------ C. AUTH
  section("C. Authentication (JWT cookie + bcrypt)");
  const emailA = "smoke.a." + J + "@example.com";
  const emailB = "smoke.b." + J + "@example.com";
  const regA = await req("POST", api("/api/auth/register"), { body: { name: "Smoke A", email: emailA, password: "secret123", role: "customer" } });
  check("POST /api/auth/register -> 201", regA.status === 201 && regA.json?.success === true, "status=" + regA.status);
  check("register returns JWT token", typeof regA.json?.data?.token === "string" && regA.json.data.token.split(".").length === 3);
  check("register sets auth_token cookie (httpOnly)", /auth_token=/.test(regA.rawSetCookie) && /HttpOnly/i.test(regA.rawSetCookie), regA.rawSetCookie.replace(/auth_token=[^;]+/, "auth_token=***"));
  check("register does not return passwordHash", regA.json?.data?.user?.passwordHash === undefined);
  const userAId = regA.json?.data?.user?.userId;
  const tokenA = regA.json?.data?.token;
  const regDup = await req("POST", api("/api/auth/register"), { body: { name: "Smoke A", email: emailA, password: "secret123" } });
  check("register duplicate email -> 409", regDup.status === 409, "status=" + regDup.status);
  const regShort = await req("POST", api("/api/auth/register"), { body: { name: "Short", email: "short." + J + "@example.com", password: "123" } });
  check("register short password -> 400", regShort.status === 400, "status=" + regShort.status);
  const regMissing = await req("POST", api("/api/auth/register"), { body: { name: "NoEmail" } });
  check("register missing fields -> 400", regMissing.status === 400, "status=" + regMissing.status);

  const meAnon = await req("GET", api("/api/auth/me"));
  check("GET /api/auth/me without credentials -> 401", meAnon.status === 401, "status=" + meAnon.status);
  const meCookie = await req("GET", api("/api/auth/me"), { headers: { cookie: regA.cookie } });
  check("GET /api/auth/me with cookie -> 200 + correct email", meCookie.status === 200 && meCookie.json?.data?.email === emailA, "status=" + meCookie.status);
  const meBearer = await req("GET", api("/api/auth/me"), { headers: { authorization: "Bearer " + tokenA } });
  check("GET /api/auth/me with Bearer token -> 200", meBearer.status === 200 && meBearer.json?.data?.userId === userAId, "status=" + meBearer.status);
  const meHeader = await req("GET", api("/api/auth/me"), { headers: { "x-user-id": userAId } });
  check("GET /api/auth/me with x-user-id dev header -> 200", meHeader.status === 200 && meHeader.json?.data?.role === "customer", "status=" + meHeader.status);

  const loginBad = await req("POST", api("/api/auth/login"), { body: { email: emailA, password: "wrong-password" } });
  check("POST /api/auth/login wrong password -> 401", loginBad.status === 401, "status=" + loginBad.status);
  const loginOk = await req("POST", api("/api/auth/login"), { body: { email: emailA.toUpperCase(), password: "secret123" } });
  check("POST /api/auth/login correct password (email case-insensitive) -> 200", loginOk.status === 200 && loginOk.json?.success === true, "status=" + loginOk.status);
  check("login issues fresh JWT + cookie", !!loginOk.json?.data?.token && /auth_token=/.test(loginOk.rawSetCookie));
  const logout = await req("POST", api("/api/auth/logout"), { headers: { cookie: loginOk.cookie } });
  check("POST /api/auth/logout -> 200 and clears cookie", logout.status === 200 && /Max-Age=0/i.test(logout.rawSetCookie), logout.rawSetCookie.replace(/auth_token=[^;]+/, "auth_token=***"));

  const regB = await req("POST", api("/api/auth/register"), { body: { name: "Smoke B", email: emailB, password: "secret123" } });
  const userBId = regB.json?.data?.user?.userId;
  check("second customer registered", regB.status === 201 && !!userBId, "status=" + regB.status);


  // -------------------------------------------------------------- D. BOOKINGS
  section("D. Booking module (validate / reserve / duplicate-guard / cancel / release)");
  const b1 = await req("POST", api("/api/bookings"), { body: { tripId: vanTrip?._id, userId: userAId, seatNumbers: [3, 4], passengerName: "Smoke A" } });
  check("POST /api/bookings -> 201 confirmed", b1.status === 201 && b1.json?.data?.status === "confirmed", "status=" + b1.status + " body=" + JSON.stringify(b1.json).slice(0, 200));
  check("created booking echoes seatNumbers [3,4]", JSON.stringify(b1.json?.data?.seatNumbers) === "[3,4]");
  check("created booking populates trip + user", !!b1.json?.data?.tripId?.vehicleId?.plateNumber && b1.json?.data?.userId?.email === emailA);
  const booking1Id = b1.json?.data?._id;

  const av2 = await req("GET", api("/api/trips/" + vanTrip?._id + "/availability"));
  check("availability reflects new booking: bookedSeats [1,2,3,4]", JSON.stringify(av2.json?.data?.bookedSeats) === "[1,2,3,4]", JSON.stringify(av2.json?.data?.bookedSeats));
  check("availability remainingCapacity = 10", av2.json?.data?.remainingCapacity === 10, "remaining=" + av2.json?.data?.remainingCapacity);

  const dup = await req("POST", api("/api/bookings"), { body: { tripId: vanTrip?._id, userId: userBId, seatNumbers: [4, 5], passengerName: "Smoke B" } });
  check("POST /api/bookings overlapping seat -> 409 + clear message", dup.status === 409 && /already reserved/i.test(dup.json?.error || ""), "status=" + dup.status + " error=" + dup.json?.error);

  const over = await req("POST", api("/api/bookings"), { body: { tripId: vanTrip?._id, userId: userBId, seatNumbers: [99], passengerName: "Smoke B" } });
  check("POST /api/bookings seat > capacity -> 400", over.status === 400 && /capacity/.test(over.json?.error || ""), "status=" + over.status + " error=" + over.json?.error);
  const zero = await req("POST", api("/api/bookings"), { body: { tripId: vanTrip?._id, userId: userBId, seatNumbers: [0], passengerName: "Smoke B" } });
  check("POST /api/bookings seat 0 -> 400", zero.status === 400, "status=" + zero.status);
  const intraDup = await req("POST", api("/api/bookings"), { body: { tripId: vanTrip?._id, userId: userBId, seatNumbers: [7, 7], passengerName: "Smoke B" } });
  check("POST /api/bookings duplicate seats in one request -> 400", intraDup.status === 400 && /Duplicate seat/i.test(intraDup.json?.error || ""), "status=" + intraDup.status + " error=" + intraDup.json?.error);
  const shortName = await req("POST", api("/api/bookings"), { body: { tripId: vanTrip?._id, userId: userBId, seatNumbers: [8], passengerName: "A" } });
  check("POST /api/bookings passengerName too short -> 400", shortName.status === 400, "status=" + shortName.status);
  const badTripId = await req("POST", api("/api/bookings"), { body: { tripId: "123", userId: userBId, seatNumbers: [8], passengerName: "Smoke B" } });
  check("POST /api/bookings malformed tripId -> 400", badTripId.status === 400, "status=" + badTripId.status);
  const badUserId = await req("POST", api("/api/bookings"), { body: { tripId: vanTrip?._id, userId: "nope", seatNumbers: [8], passengerName: "Smoke B" } });
  check("POST /api/bookings malformed userId -> 400", badUserId.status === 400, "status=" + badUserId.status);
  const depBook = await req("POST", api("/api/bookings"), { body: { tripId: droppedTrip?._id, userId: userAId, seatNumbers: [1], passengerName: "Smoke A" } });
  check("POST /api/bookings on departed trip -> 400 (departed-trip guard)", depBook.status === 400 && /status|departed/i.test(depBook.json?.error || ""), "status=" + depBook.status + " error=" + depBook.json?.error);
  const ghostTrip = await req("POST", api("/api/bookings"), { body: { tripId: "64b7f0f0f0f0f0f0f0f0f0f0", userId: userAId, seatNumbers: [1], passengerName: "Smoke A" } });
  check("POST /api/bookings unknown trip -> 404", ghostTrip.status === 404, "status=" + ghostTrip.status);


  const listByTrip = await req("GET", api("/api/bookings?tripId=" + vanTrip?._id));
  check("GET /api/bookings?tripId -> 200 contains new booking", listByTrip.status === 200 && (listByTrip.json?.data || []).some((b) => b._id === booking1Id), "status=" + listByTrip.status);
  const listByUser = await req("GET", api("/api/bookings?userId=" + userBId));
  check("GET /api/bookings?userId filters", listByUser.status === 200 && (listByUser.json?.data || []).every((b) => String(b.userId?._id) === userBId), "count=" + (listByUser.json?.data || []).length);
  const listCustomerScope = await req("GET", api("/api/bookings"), { headers: { "x-user-id": userAId, "x-user-role": "customer" } });
  check("customer scope: only own bookings returned", listCustomerScope.status === 200 && (listCustomerScope.json?.data || []).length > 0 && (listCustomerScope.json?.data || []).every((b) => String(b.userId?._id) === userAId), "count=" + (listCustomerScope.json?.data || []).length);

  const getB1 = await req("GET", api("/api/bookings/" + booking1Id));
  check("GET /api/bookings/:id -> 200", getB1.status === 200 && getB1.json?.data?._id === booking1Id, "status=" + getB1.status);
  const getB1WrongUser = await req("GET", api("/api/bookings/" + booking1Id), { headers: { "x-user-id": userBId, "x-user-role": "customer" } });
  check("GET /api/bookings/:id other customer -> 403", getB1WrongUser.status === 403, "status=" + getB1WrongUser.status);
  const getB1Bad = await req("GET", api("/api/bookings/zzz"));
  check("GET /api/bookings/:id malformed -> 400", getB1Bad.status === 400, "status=" + getB1Bad.status);
  const getB1Missing = await req("GET", api("/api/bookings/64b7f0f0f0f0f0f0f0f0f0f0"));
  check("GET /api/bookings/:id unknown -> 404", getB1Missing.status === 404, "status=" + getB1Missing.status);

  const b2 = await req("POST", api("/api/bookings"), { body: { tripId: vanTrip?._id, userId: userAId, seatNumbers: [6], passengerName: "Smoke A" } });
  const booking2Id = b2.json?.data?._id;
  check("second booking (seat 6) created", b2.status === 201, "status=" + b2.status);

  const patchBadStatus = await req("PATCH", api("/api/bookings/" + booking1Id), { body: { status: "nonsense" } });
  check("PATCH /api/bookings/:id invalid status -> 400", patchBadStatus.status === 400, "status=" + patchBadStatus.status);
  const patchCancel = await req("PATCH", api("/api/bookings/" + booking1Id), { body: { status: "cancelled" } });
  check("PATCH /api/bookings/:id cancel -> 200", patchCancel.status === 200 && patchCancel.json?.data?.status === "cancelled", "status=" + patchCancel.status);
  const av3 = await req("GET", api("/api/trips/" + vanTrip?._id + "/availability"));
  check("cancelling released seats 3,4 back to inventory", JSON.stringify(av3.json?.data?.bookedSeats) === "[1,2,6]", JSON.stringify(av3.json?.data?.bookedSeats));

  const rebook = await req("POST", api("/api/bookings"), { body: { tripId: vanTrip?._id, userId: userBId, seatNumbers: [3, 4], passengerName: "Smoke B" } });
  check("re-book released seats [3,4] by another customer -> 201", rebook.status === 201, "status=" + rebook.status + " err=" + rebook.json?.error);
  const delB2 = await req("DELETE", api("/api/bookings/" + booking2Id));
  check("DELETE /api/bookings/:id -> 200 with releasedSeats", delB2.status === 200 && JSON.stringify(delB2.json?.data?.releasedSeats) === "[6]", "status=" + delB2.status + " data=" + JSON.stringify(delB2.json?.data));
  const delMissing = await req("DELETE", api("/api/bookings/64b7f0f0f0f0f0f0f0f0f0f0"));
  check("DELETE /api/bookings/:id unknown -> 404", delMissing.status === 404, "status=" + delMissing.status);
  const av4 = await req("GET", api("/api/trips/" + vanTrip?._id + "/availability"));
  check("final inventory = [1,2,3,4]", JSON.stringify(av4.json?.data?.bookedSeats) === "[1,2,3,4]", JSON.stringify(av4.json?.data?.bookedSeats));


  // ----------------------------------------------------------- E. ADMIN CRUD
  section("E. Admin CRUD (vehicles + trips)");
  const plate = "SMOKE-" + J;
  const newVeh = await req("POST", api("/api/vehicles"), { body: { plateNumber: plate.toLowerCase(), type: "van", capacity: 16 } });
  check("POST /api/vehicles -> 201 (plate upper-cased)", newVeh.status === 201 && newVeh.json?.data?.plateNumber === plate, "status=" + newVeh.status + " body=" + JSON.stringify(newVeh.json).slice(0, 160));
  const newVehId = newVeh.json?.data?._id;
  const dupPlate = await req("POST", api("/api/vehicles"), { body: { plateNumber: plate, type: "van", capacity: 16 } });
  check("POST /api/vehicles duplicate plate -> 409", dupPlate.status === 409, "status=" + dupPlate.status);
  const noCap = await req("POST", api("/api/vehicles"), { body: { plateNumber: "NO-CAP-" + J } });
  check("POST /api/vehicles missing capacity -> 400", noCap.status === 400, "status=" + noCap.status);
  const zeroCap = await req("POST", api("/api/vehicles"), { body: { plateNumber: "ZERO-" + J, capacity: 0 } });
  check("POST /api/vehicles capacity 0 -> 400", zeroCap.status === 400, "status=" + zeroCap.status);

  const patchVeh = await req("PATCH", api("/api/vehicles/" + newVehId), { body: { capacity: 20, status: "active" } });
  check("PATCH /api/vehicles/:id -> 200 capacity=20", patchVeh.status === 200 && patchVeh.json?.data?.capacity === 20, "status=" + patchVeh.status);
  const patchBadCap = await req("PATCH", api("/api/vehicles/" + newVehId), { body: { capacity: -5 } });
  check("PATCH /api/vehicles/:id negative capacity -> 400", patchBadCap.status === 400, "status=" + patchBadCap.status);
  const patchMissingVeh = await req("PATCH", api("/api/vehicles/64b7f0f0f0f0f0f0f0f0f0f0"), { body: { capacity: 10 } });
  check("PATCH /api/vehicles/:id unknown -> 404", patchMissingVeh.status === 404, "status=" + patchMissingVeh.status);

  const newTrip = await req("POST", api("/api/trips"), { body: { vehicleId: newVehId, origin: "Yangon", destination: "Mandalay", departureTime: new Date(Date.now() + 86400000).toISOString(), fare: 25 } });
  check("POST /api/trips -> 201 with populated vehicle", newTrip.status === 201 && !!newTrip.json?.data?.vehicleId?.plateNumber, "status=" + newTrip.status + " body=" + JSON.stringify(newTrip.json).slice(0, 160));
  const newTripId = newTrip.json?.data?._id;
  const tripNoFields = await req("POST", api("/api/trips"), { body: { origin: "Yangon" } });
  check("POST /api/trips missing fields -> 400", tripNoFields.status === 400, "status=" + tripNoFields.status);
  const tripBadVeh = await req("POST", api("/api/trips"), { body: { vehicleId: "abc", origin: "A", destination: "B", departureTime: new Date().toISOString(), fare: 5 } });
  check("POST /api/trips malformed vehicleId -> 400", tripBadVeh.status === 400, "status=" + tripBadVeh.status);
  const tripGhostVeh = await req("POST", api("/api/trips"), { body: { vehicleId: "64b7f0f0f0f0f0f0f0f0f0f0", origin: "A", destination: "B", departureTime: new Date().toISOString(), fare: 5 } });
  check("POST /api/trips unknown/inactive vehicle -> 400", tripGhostVeh.status === 400, "status=" + tripGhostVeh.status);
  const tripBadDate = await req("POST", api("/api/trips"), { body: { vehicleId: newVehId, origin: "A", destination: "B", departureTime: "not-a-date", fare: 5 } });
  check("POST /api/trips invalid departureTime -> 400", tripBadDate.status === 400, "status=" + tripBadDate.status);

  const patchTrip = await req("PATCH", api("/api/trips/" + newTripId), { body: { fare: 30, destination: "Naypyidaw" } });
  check("PATCH /api/trips/:id -> 200 updates fare+destination", patchTrip.status === 200 && patchTrip.json?.data?.fare === 30 && patchTrip.json?.data?.destination === "Naypyidaw", "status=" + patchTrip.status);
  const patchNegFare = await req("PATCH", api("/api/trips/" + newTripId), { body: { fare: -1 } });
  check("PATCH /api/trips/:id negative fare -> 400", patchNegFare.status === 400, "status=" + patchNegFare.status);
  const delVehBusy = await req("DELETE", api("/api/vehicles/" + newVehId));
  check("DELETE /api/vehicles/:id with upcoming trip -> 400 (referential guard)", delVehBusy.status === 400 && /upcoming scheduled trip/i.test(delVehBusy.json?.error || ""), "status=" + delVehBusy.status + " error=" + delVehBusy.json?.error);

  const bookOnNewTrip = await req("POST", api("/api/bookings"), { body: { tripId: newTripId, userId: userAId, seatNumbers: [1, 2], passengerName: "Smoke A" } });
  check("booking on new trip created (seat [1,2])", bookOnNewTrip.status === 201, "status=" + bookOnNewTrip.status);
  const cancelTrip = await req("DELETE", api("/api/trips/" + newTripId));
  check("DELETE /api/trips/:id -> 200 cancels trip", cancelTrip.status === 200 && cancelTrip.json?.data?.status === "cancelled", "status=" + cancelTrip.status);
  const bookingsAfterTripCancel = await req("GET", api("/api/bookings?tripId=" + newTripId));
  check("cancelling trip auto-cancels its bookings (seats freed)", (bookingsAfterTripCancel.json?.data || []).every((b) => b.status === "cancelled"), JSON.stringify((bookingsAfterTripCancel.json?.data || []).map((b) => b.status)));
  const delVehFree = await req("DELETE", api("/api/vehicles/" + newVehId));
  check("DELETE /api/vehicles/:id (no upcoming trips) -> 200 soft-delete to inactive", delVehFree.status === 200 && delVehFree.json?.data?.status === "inactive", "status=" + delVehFree.status);


  // ------------------------------------------- F. AUTHORIZATION OBSERVATIONS
  section("F. Authorization observations (informational, not pass/fail)");
  const anonBooking = await req("POST", api("/api/bookings"), { body: { tripId: vanTrip?._id, userId: userBId, seatNumbers: [9], passengerName: "Anonymous" } });
  observe("POST /api/bookings with NO auth token", "status " + anonBooking.status + (anonBooking.status === 201 ? " (unauthenticated booking accepted)" : ""));
  const anonCreateVeh = await req("POST", api("/api/vehicles"), { body: { plateNumber: "ANON-" + J, capacity: 9 } });
  observe("POST /api/vehicles with NO auth token", "status " + anonCreateVeh.status + (anonCreateVeh.status === 201 ? " (anyone can add fleet vehicles)" : ""));
  const anonDeleteVeh = await req("DELETE", api("/api/vehicles/" + anonCreateVeh.json?.data?._id));
  observe("DELETE /api/vehicles/:id with NO auth token", "status " + anonDeleteVeh.status);
  const anonUsers = await req("GET", api("/api/users"));
  observe("GET /api/users with NO auth token", "status " + anonUsers.status + " (exposes " + (anonUsers.json?.data || []).length + " user records)");
  const anonBookings = await req("GET", api("/api/bookings"));
  observe("GET /api/bookings with NO auth token", "status " + anonBookings.status + " (exposes " + (anonBookings.json?.data || []).length + " booking records)");
  const anonTrips = await req("POST", api("/api/trips"), { body: { vehicleId: vanTrip?.vehicleId?._id, origin: "Anon", destination: "Anon", departureTime: new Date(Date.now() + 172800000).toISOString(), fare: 1 } });
  observe("POST /api/trips with NO auth token", "status " + anonTrips.status + (anonTrips.status === 201 ? " (anyone can schedule trips)" : ""));
  if (anonTrips.json?.data?._id) await req("DELETE", api("/api/trips/" + anonTrips.json.data._id));

  // ----------------------------------------------------------------- RESULT
  console.log("\n==================================================");
  console.log("RESULT: " + pass + "/" + (pass + fail) + " checks passed");
  if (failures.length) { console.log("FAILED CHECKS:"); failures.forEach((f) => console.log("  - " + f)); }
  console.log("==================================================");
  process.exitCode = fail === 0 ? 0 : 1;
}

main().catch((e) => { console.error("SMOKE TEST CRASHED:", e); process.exitCode = 2; });

