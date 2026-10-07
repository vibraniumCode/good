import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  description: { type: String, default: '', maxlength: 3000 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0, default: null },
  stock: { type: Number, min: 0, default: 0 },
  sizes: { type: [String], default: [] },
  colors: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  frontImage: { type: String, required: true },
  backImage: { type: String, default: '' },
  frontImagePublicId: { type: String, default: '' },
  backImagePublicId: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  active: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ category: 1, active: 1 });
productSchema.index({ active: 1, featured: 1, createdAt: -1 });

export default mongoose.model('Product', productSchema);
