import dotenv from "dotenv";
import mongoose from "mongoose";
import { Vehicle } from "../src/models/Vehicle";
import { Trip } from "../src/models/Trip";
import { User } from "../src/models/User";
import { Booking } from "../src/models/Booking";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/van_bus_booking";

async function seed() {
  console.log("--------------------------------------------------");
  console.log("🌱 Starting Database Seeding...");
  console.log(`Connecting to: ${MONGODB_URI}`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB.");

    // Clear existing test collections
    console.log("Clearing existing collections...");
    await Booking.deleteMany({});
    await Trip.deleteMany({});
    await Vehicle.deleteMany({});
    await User.deleteMany({});
    console.log("✓ Collections cleared.");

    // 1. Seed Users
    console.log("Seeding Users...");
    const customer = await User.create({
      name: "Ye Htet Aung",
      email: "yehtetaung@example.com",
      passwordHash: "demo_hash_ye_htet_aung",
      role: "customer",
    });

    const admin = await User.create({
      name: "Transport Admin",
      email: "admin@transport.com",
      passwordHash: "demo_hash_admin",
      role: "administrator",
    });
    console.log(`✓ Seeded 2 users: Customer (${customer.name}) and Admin (${admin.name})`);

    // 2. Seed Vehicles
    console.log("Seeding Vehicles...");
    const van1 = await Vehicle.create({
      plateNumber: "VAN-101",
      type: "van",
      capacity: 14,
      status: "active",
    });

    const bus1 = await Vehicle.create({
      plateNumber: "BUS-202",
      type: "bus",
      capacity: 32,
      status: "active",
    });
    console.log(`✓ Seeded 2 vehicles: ${van1.plateNumber} (14 seats) & ${bus1.plateNumber} (32 seats)`);

    // 3. Seed Trips
    console.log("Seeding Trips...");
    const now = new Date();

    const trip1Future = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days ahead
    const trip1 = await Trip.create({
      vehicleId: van1._id,
      origin: "Bangkok",
      destination: "Pattaya",
      departureTime: trip1Future,
      fare: 15,
      status: "scheduled",
    });

    const trip2Future = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days ahead
    const trip2 = await Trip.create({
      vehicleId: bus1._id,
      origin: "Bangkok",
      destination: "Chiang Mai",
      departureTime: trip2Future,
      fare: 35,
      status: "scheduled",
    });

    const trip3Past = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const trip3Departed = await Trip.create({
      vehicleId: van1._id,
      origin: "Phuket",
      destination: "Krabi",
      departureTime: trip3Past,
      fare: 12,
      status: "departed",
    });
    console.log(`✓ Seeded 3 trips: 2 scheduled upcoming trips & 1 departed trip`);

    // 4. Seed Initial Bookings (Ye Htet Aung's module)
    console.log("Seeding Bookings...");
    const booking1 = await Booking.create({
      tripId: trip1._id,
      userId: customer._id,
      seatNumbers: [1, 2],
      passengerName: "Ye Htet Aung",
      status: "confirmed",
    });

    const booking2 = await Booking.create({
      tripId: trip2._id,
      userId: customer._id,
      seatNumbers: [5, 6, 7],
      passengerName: "Ye Htet Aung",
      status: "confirmed",
    });
    console.log(`✓ Seeded 2 bookings:`);
    console.log(`  - Trip 1 (${trip1.origin}→${trip1.destination}): Seats [1, 2]`);
    console.log(`  - Trip 2 (${trip2.origin}→${trip2.destination}): Seats [5, 6, 7]`);

    // 5. Ensure indexes are built (especially the compound partial unique index)
    await Booking.init();
    console.log("✓ Booking indexes initialized (Unique compound partial index verified).");

    console.log("--------------------------------------------------");
    console.log("🎉 Database Seeding Complete!");
    console.log(`Trip 1 ID: ${trip1._id}`);
    console.log(`Customer User ID: ${customer._id}`);
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("❌ Seeding failed with error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
}

seed();

