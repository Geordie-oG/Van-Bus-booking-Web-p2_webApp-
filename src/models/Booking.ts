import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { ITrip } from "./Trip";
import { IUser } from "./User";

export type BookingStatus = "confirmed" | "cancelled" | "pending";

export interface IBooking extends Document {
  tripId: Types.ObjectId | ITrip;
  userId: Types.ObjectId | IUser;
  seatNumbers: number[];
  passengerName: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: [true, "Trip ID is required"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    seatNumbers: {
      type: [Number],
      required: [true, "At least one seat number is required"],
      validate: [
        {
          validator: function (seats: number[]) {
            return Array.isArray(seats) && seats.length > 0;
          },
          message: "A booking must contain at least one seat number",
        },
        {
          validator: function (seats: number[]) {
            // Check for duplicate seats within the same booking request
            const uniqueSeats = new Set(seats);
            return uniqueSeats.size === seats.length;
          },
          message: "Duplicate seat numbers cannot be selected within the same booking",
        },
        {
          validator: function (seats: number[]) {
            // Ensure all seat numbers are positive integers
            return seats.every((seat) => Number.isInteger(seat) && seat > 0);
          },
          message: "All seat numbers must be positive integers",
        },
      ],
    },
    passengerName: {
      type: String,
      required: [true, "Passenger name is required"],
      trim: true,
      minlength: [2, "Passenger name must be at least 2 characters"],
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "pending"],
      default: "confirmed",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound partial unique index for zero-duplicate race condition protection.
// Ensures that for a given tripId, any seat cannot be double-booked across confirmed or pending bookings.
// Note: Atlas M0 free tier only supports equality ($eq/$in) in partialFilterExpression.
// Using $in: ["confirmed", "pending"] covers all active statuses; cancelled bookings are excluded.
BookingSchema.index(
  { tripId: 1, seatNumbers: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["confirmed", "pending"] } },
  }
);

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;

