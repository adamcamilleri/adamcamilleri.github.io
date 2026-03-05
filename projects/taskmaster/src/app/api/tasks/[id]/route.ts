import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Task from '@/models/Task'
import { verifyToken } from '@/lib/jwt'

async function authenticate(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    return await verifyToken(auth.slice(7))
  } catch {
    return null
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const updates = await req.json()

  const task = await Task.findOneAndUpdate(
    { _id: params.id, userId: user.userId },
    { ...updates, updatedAt: new Date() },
    { new: true }
  )

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  return NextResponse.json(task)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const task = await Task.findOneAndDelete({ _id: params.id, userId: user.userId })

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
