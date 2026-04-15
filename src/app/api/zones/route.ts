import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Zone {
  id: string
  user_id: string
  symbol: string
  interval: string
  zone_type: 'support' | 'resistance' | 'demand' | 'supply'
  price_top: number
  price_bottom: number
  color: string
  created_at: string
}

// GET - Load zones for a symbol
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const interval = searchParams.get('interval')
    const userId = searchParams.get('userId') || 'default_user'

    if (!symbol) {
      return NextResponse.json({ zones: [] })
    }

    const { data, error } = await supabase
      .from('chart_zones')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .eq('interval', interval || '15')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ zones: [] })
    }

    return NextResponse.json({ zones: data || [] })
  } catch (error) {
    console.error('Error loading zones:', error)
    return NextResponse.json({ zones: [] })
  }
}

// POST - Save a new zone
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      userId = 'default_user', 
      symbol, 
      interval, 
      zoneType, 
      priceTop, 
      priceBottom, 
      color 
    } = body

    if (!symbol || !zoneType || priceTop === undefined || priceBottom === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('chart_zones')
      .insert({
        user_id: userId,
        symbol,
        interval: interval || '15',
        zone_type: zoneType,
        price_top: priceTop,
        price_bottom: priceBottom,
        color: color || '#22c55e',
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save zone' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, zone: data })
  } catch (error) {
    console.error('Error saving zone:', error)
    return NextResponse.json(
      { error: 'Failed to save zone' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a zone
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing zone ID' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('chart_zones')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete zone' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting zone:', error)
    return NextResponse.json(
      { error: 'Failed to delete zone' },
      { status: 500 }
    )
  }
}
