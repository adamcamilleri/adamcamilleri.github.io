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

export async function GET(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const tasks = await Task.find({ userId: user.userId }).sort({ createdAt: -1 })
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { title, description, priority, dueDate } = await req.json()

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const task = await Task.create({
    userId: user.userId,
    title,
    description,
    priority,
    dueDate: dueDate ? new Date(dueDate) : undefined,
  })

  return NextResponse.json(task, { status: 201 })
}
