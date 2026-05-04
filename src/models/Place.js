import mongoose from 'mongoose';

const PlaceSchema = new mongoose.Schema({
  name: {
    bn: { type: String, required: true },
    en: { type: String, required: true },
  },
  district: {
    bn: { type: String, required: true },
    en: { type: String, required: true },
  },
  upazila: {
    bn: { type: String, required: true },
    en: { type: String, required: true },
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  category: {
    type: String,
    enum: ['historical', 'religious', 'natural', 'park', 'museum', 'other'],
    required: true,
  },
  description: {
    bn: { type: String },
    en: { type: String },
  },
  images: [{ type: String }],
  entryFee: {
    local: { type: Number, default: 0 },
    foreign: { type: Number, default: 0 },
  },
  bestTime: { type: String },
  rating: { type: Number, default: 0 },
  openingHours: { type: String },
}, {
  timestamps: true,
});

PlaceSchema.index({ 'district.en': 1, 'upazila.en': 1 });
PlaceSchema.index({ coordinates: '2dsphere' });

export default mongoose.models.Place || mongoose.model('Place', PlaceSchema);
