import mongoose from 'mongoose'
import { env } from '@/lib/env.js'

let isConnected = false

export async function connectDB(): Promise<void> {
  if (isConnected) return

  mongoose.set('strictQuery', true)

  try {
    await mongoose.connect(env.MONGODB_URI)
    isConnected = true
    console.log(`✅ MongoDB connected (${env.NODE_ENV})`)
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error)
    process.exit(1)
  }
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return
  await mongoose.disconnect()
  isConnected = false
}

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error)
})

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected')
  isConnected = false
})
