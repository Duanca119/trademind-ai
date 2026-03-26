import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface DrawingPoint {
  time: number
  price: number
}

interface DrawingData {
  points: DrawingPoint[]
  color?: string
  lineWidth?: number
  lineStyle?: number
  fillColor?: string
  transparency?: number
  text?: string
  fontSize?: number
  levels?: { level: number; price: number }[]
}

// GET - Load drawings for a symbol
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const interval = searchParams.get('interval')
    const userId = searchParams.get('userId') || 'default_user'

    let query = supabase
      .from('chart_drawings')
      .select('*')
      .eq('user_id', userId)

    if (symbol) {
      query = query.eq('symbol', symbol)
    }
    if (interval) {
      query = query.eq('interval', interval)
    }

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ drawings: [] })
    }

    return NextResponse.json({ drawings: data || [] })
  } catch (error) {
    console.error('Error loading drawings:', error)
    return NextResponse.json({ drawings: [] })
  }
}

// POST - Save a new drawing
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId = 'default_user', symbol, interval, drawingType, drawingData } = body

    if (!symbol || !drawingType || !drawingData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('chart_drawings')
      .insert({
        user_id: userId,
        symbol,
        interval: interval || '15',
        drawing_type: drawingType,
        drawing_data: drawingData,
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save drawing' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, drawing: data })
  } catch (error) {
    console.error('Error saving drawing:', error)
    return NextResponse.json(
      { error: 'Failed to save drawing' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a drawing
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing drawing ID' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('chart_drawings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete drawing' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting drawing:', error)
    return NextResponse.json(
      { error: 'Failed to delete drawing' },
      { status: 500 }
    )
  }
}
