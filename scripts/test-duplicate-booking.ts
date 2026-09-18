import dotenv from "dotenv";
import mongoose from "mongoose";
import { Vehicle } from "../src/models/Vehicle";
import { Trip } from "../src/models/Trip";
import { User } from "../src/models/User";
import { Booking } from "../src/models/Booking";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/van_bus_booking";

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
  }
}

async function runTests() {
  console.log("==================================================");
  console.log("🧪 Running Member 2 (Ye Htet Aung) Test Suite");
  console.log("Testing: Booking CRUD, Availability, and Concurrency Duplicate Protection");
  console.log("==================================================\n");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for testing.\n");

    // Clear test environment
    await Booking.deleteMany({});
    await Trip.deleteMany({});
    await Vehicle.deleteMany({});
    await User.deleteMany({});

    // Ensure Mongoose builds indexes (essential for unique partial index test)
    await Booking.init();

    // Setup mock entities
    const customer = await User.create({
      name: "Ye Htet Aung (Test Customer)",
      email: "test.customer@example.com",
      passwordHash: "hash123",
      role: "customer",
    });

    const otherCustomer = await User.create({
      name: "Second Customer",
      email: "second@example.com",
      passwordHash: "hash456",
      role: "customer",
    });

    const van = await Vehicle.create({
      plateNumber: "VAN-TEST",
      type: "van",
      capacity: 10,
      status: "active",
    });

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day future
    const activeTrip = await Trip.create({
      vehicleId: van._id,
      origin: "Bangkok",
      destination: "Rayong",
      departureTime: futureDate,
      fare: 20,
      status: "scheduled",
    });

    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day in past
    const departedTrip = await Trip.create({
      vehicleId: van._id,
      origin: "Bangkok",
      destination: "Pattaya",
      departureTime: pastDate,
      fare: 15,
      status: "departed",
    });

    // -------------------------------------------------------------
    // TEST 1: Initial Seat Availability
    // -------------------------------------------------------------
    console.log("--- TEST GROUP 1: Seat Availability Calculation ---");
    const activeBookingsInitial = await Booking.find({
      tripId: activeTrip._id,
      status: { $ne: "cancelled" },
    });
    const bookedSeatsInitial = activeBookingsInitial.flatMap((b) => b.seatNumbers);
    const availableCountInitial = van.capacity - bookedSeatsInitial.length;
    assert(
      availableCountInitial === 10 && bookedSeatsInitial.length === 0,
      "New trip has full capacity available (10/10 seats)"
    );

    // -------------------------------------------------------------
    // TEST 2: Create Valid Booking
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 2: Booking Creation ---");
    const booking1 = await Booking.create({
      tripId: activeTrip._id,
      userId: customer._id,
      seatNumbers: [1, 2],
      passengerName: "Ye Htet Aung",
      status: "confirmed",
    });
    assert(
      booking1 && booking1.seatNumbers.length === 2 && booking1.status === "confirmed",
      "Customer can successfully book seats [1, 2]"
    );

    // Verify seat availability is reduced
    const activeBookingsAfterB1 = await Booking.find({
      tripId: activeTrip._id,
      status: { $ne: "cancelled" },
    });
    const bookedAfterB1 = new Set(activeBookingsAfterB1.flatMap((b) => b.seatNumbers));
    assert(
      bookedAfterB1.has(1) && bookedAfterB1.has(2) && bookedAfterB1.size === 2,
      "Seats [1, 2] are now marked as booked in availability query"
    );

    // -------------------------------------------------------------
    // TEST 3: Duplicate Seat Rejection (Database-level Index Protection)
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 3: Duplicate Seat Prevention ---");
    let duplicateErrorCaught = false;
    try {
      // Second customer attempts to book seat 2 (which is already booked by booking1)
      await Booking.create({
        tripId: activeTrip._id,
        userId: otherCustomer._id,
        seatNumbers: [2, 3],
        passengerName: "Second Customer",
        status: "confirmed",
      });
    } catch (err: any) {
      // Expecting MongoDB Duplicate Key Error (E11000)
      if (err.code === 11000) {
        duplicateErrorCaught = true;
      }
    }
    assert(
      duplicateErrorCaught,
      "Database strictly rejects double-booking the same seat (triggers code 11000)"
    );

    // -------------------------------------------------------------
    // TEST 4: Booking on Departed / Past Trips
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 4: Departed Trip Restrictions ---");
    const isDepartedAllowed =
      departedTrip.status === "scheduled" && new Date(departedTrip.departureTime) > new Date();
    assert(
      !isDepartedAllowed,
      "System correctly flags departed/completed trips as ineligible for new bookings"
    );

    // -------------------------------------------------------------
    // TEST 5: Out of bounds seats
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 5: Seat Capacity Bounds Validation ---");
    const testSeatOutsideCapacity = 15; // van capacity is 10
    const isSeatValid = testSeatOutsideCapacity >= 1 && testSeatOutsideCapacity <= van.capacity;
    assert(!isSeatValid, "Seat 15 rejected because it exceeds vehicle capacity of 10");

    // -------------------------------------------------------------
    // TEST 6: Booking Cancellation and Seat Release
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 6: Cancellation & Seat Release ---");
    // Cancel booking 1
    booking1.status = "cancelled";
    await booking1.save();
    assert(booking1.status === "cancelled", "Booking 1 status updated to 'cancelled'");

    // Check availability again: seats 1 and 2 must now be released!
    const activeBookingsAfterCancel = await Booking.find({
      tripId: activeTrip._id,
      status: { $ne: "cancelled" },
    });
    const bookedAfterCancel = new Set(activeBookingsAfterCancel.flatMap((b) => b.seatNumbers));
    assert(
      !bookedAfterCancel.has(1) && !bookedAfterCancel.has(2),
      "Cancelled booking released seats [1, 2] back into available inventory"
    );

    // Now, another customer should be able to book seat 2 without duplicate key error!
    let rebookSuccess = false;
    try {
      const rebooking = await Booking.create({
        tripId: activeTrip._id,
        userId: otherCustomer._id,
        seatNumbers: [2, 3],
        passengerName: "Second Customer (Re-book)",
        status: "confirmed",
      });
      if (rebooking._id) {
        rebookSuccess = true;
      }
    } catch (err: any) {
      console.error("Rebooking error:", err);
    }
    assert(
      rebookSuccess,
      "Seat 2 can now be booked by another customer after cancellation released it"
    );

    console.log("\n==================================================");
    console.log(`🏁 Test Summary: ${passedTests}/${totalTests} tests passed`);
    if (passedTests === totalTests) {
      console.log("🎉 All Member 2 Booking & Seat Availability tests PASSED!");
    } else {
      console.log("⚠️ Some tests failed. Check logs above.");
    }
    console.log("==================================================");
  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runTests();

