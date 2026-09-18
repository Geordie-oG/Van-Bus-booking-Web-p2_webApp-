import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVehicle extends Document {
  plateNumber: string;
  type: "van" | "bus";
  capacity: number;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    plateNumber: {
      type: String,
      required: [true, "Plate number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ["van", "bus"],
      default: "van",
      required: true,
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: [1, "Capacity must be greater than zero"],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

export const Vehicle: Model<IVehicle> =
  mongoose.models.Vehicle || mongoose.model<IVehicle>("Vehicle", VehicleSchema);

export default Vehicle;

