// src/models/AllianceProfile.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type IAllianceAwards = Record<string, boolean>;

export interface IAllianceProfile extends Document {
  userId: Types.ObjectId;
  discordId?: string | null;
  awards: IAllianceAwards;
  createdAt: Date;
  updatedAt: Date;
}

// Use a Map of key -> boolean so the awards list is dynamic and data-driven
const AllianceAwardsSchema = new Schema(
  {
    // No fixed fields: dynamic keys stored in a Map
  },
  { _id: false, strict: false, minimize: false }
);

const AllianceProfileSchema = new Schema<IAllianceProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true, unique: true },
    discordId: { type: String, default: null, index: true },
    // Using Map for dynamic awards keys
    awards: { type: Map, of: Boolean, default: {} },
  },
  { timestamps: true }
);

const AllianceProfileModel: Model<IAllianceProfile> =
  (mongoose.models.AllianceProfile as Model<IAllianceProfile>) ||
  mongoose.model<IAllianceProfile>('AllianceProfile', AllianceProfileSchema);

export default AllianceProfileModel;
