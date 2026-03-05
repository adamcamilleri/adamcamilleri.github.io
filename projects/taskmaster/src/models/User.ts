import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

UserSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = (ret._id as { toString(): string }).toString()
    delete ret._id
    delete ret.__v
    delete ret.password
    return ret
  },
})

export default mongoose.models.User || mongoose.model('User', UserSchema)
