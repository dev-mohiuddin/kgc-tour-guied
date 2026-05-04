import mongoose from 'mongoose';

const RouteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: String },
  places: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Place',
  }],
  optimizedOrder: [{ type: Number }],
  totalDistance: { type: Number },
  totalDuration: { type: Number },
  routeData: { type: Object },
}, {
  timestamps: true,
});

export default mongoose.models.Route || mongoose.model('Route', RouteSchema);
