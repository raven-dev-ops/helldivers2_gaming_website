// src/models/AllianceConfig.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAllianceAwardDef {
  key: string; // unique id (machine key)
  label: string; // human label
  description?: string | null;
  icon?: string | null; // optional icon name/url
  group?: string | null; // optional grouping
  order?: number | null; // sort order
  active?: boolean; // enabled
}

export interface IAllianceConfig extends Document {
  slug: string; // e.g. 'default'
  awards: IAllianceAwardDef[];
  updatedAt: Date;
  createdAt: Date;
}

const AwardDefSchema = new Schema<IAllianceAwardDef>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, default: null },
    icon: { type: String, default: null },
    group: { type: String, default: null },
    order: { type: Number, default: null },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const AllianceConfigSchema = new Schema<IAllianceConfig>(
  {
    slug: { type: String, default: 'default', index: true, unique: true },
    awards: { type: [AwardDefSchema], default: [] },
  },
  { timestamps: true }
);

const AllianceConfigModel: Model<IAllianceConfig> =
  (mongoose.models.AllianceConfig as Model<IAllianceConfig>) ||
  mongoose.model<IAllianceConfig>('AllianceConfig', AllianceConfigSchema);

export default AllianceConfigModel;

