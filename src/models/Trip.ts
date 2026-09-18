import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { IVehicle } from "./Vehicle";

export interface ITrip extends Document {
  vehicleId: Types.ObjectId | IVehicle;
  origin: string;
  destination: string;
  departureTime: Date;
  fare: number;
  status: "scheduled" | "departed" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITrip>(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle reference is required"],
    },
    origin: {
      type: String,
      required: [true, "Origin is required"],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
    },
    departureTime: {
      type: Date,
      required: [true, "Departure time is required"],
    },
    fare: {
      type: Number,
      required: [true, "Fare is required"],
      min: [0, "Fare must be greater than or equal to 0"],
    },
    status: {
      type: String,
      enum: ["scheduled", "departed", "completed", "cancelled"],
      default: "scheduled",
    },
  },
  {
    timestamps: true,
  }
);

export const Trip: Model<ITrip> =
  mongoose.models.Trip || mongoose.model<ITrip>("Trip", TripSchema);

export default Trip;

