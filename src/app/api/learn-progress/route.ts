import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic'

// Lazy Supabase client - only created when needed
function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return null
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

// Types
interface LearnProgress {
  id?: string
  user_id: string
  module_id: string
  completed: boolean
  completed_at?: string
  quiz_score?: number
}

interface ProgressData {
  completedLessons: string[]
  completedModules: string[]
  quizScores: Record<string, number>
}

// GET - Fetch user progress
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'default_user'

    // Check if Supabase is configured
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({
        completedLessons: [],
        completedModules: [],
        quizScores: {},
        source: 'no_supabase'
      })
    }

    const { data, error } = await supabase
      .from('learn_progress')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching progress:', error)
      // Return empty progress instead of error for new users
      return NextResponse.json({
        completedLessons: [],
        completedModules: [],
        quizScores: {},
        source: 'empty'
      })
    }

    // Transform data into expected format
    const progressData: ProgressData = {
      completedLessons: [],
      completedModules: [],
      quizScores: {}
    }

    if (data && data.length > 0) {
      data.forEach((item: any) => {
        if (item.completed && item.module_id) {
          progressData.completedModules.push(item.module_id)
        }
        if (item.quiz_score !== null && item.quiz_score !== undefined) {
          progressData.quizScores[item.module_id] = item.quiz_score
        }
        // For lessons, we need to parse from the data
        if (item.lessons_completed && Array.isArray(item.lessons_completed)) {
          progressData.completedLessons.push(...item.lessons_completed)
        }
      })
    }

    return NextResponse.json({
      ...progressData,
      source: 'supabase'
    })

  } catch (error) {
    console.error('Progress API error:', error)
    return NextResponse.json({
      completedLessons: [],
      completedModules: [],
      quizScores: {},
      error: 'Failed to fetch progress',
      source: 'error'
    }, { status: 500 })
  }
}

// POST - Save progress
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      userId = 'default_user', 
      moduleId, 
      lessonId,
      completed,
      quizScore 
    } = body

    // Check if Supabase is configured
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ success: true, source: 'no_supabase' })
    }

    // If lessonId is provided, we're marking a lesson complete
    if (lessonId) {
      // First, get existing progress for this module
      const { data: existing, error: fetchError } = await supabase
        .from('learn_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing progress:', fetchError)
      }

      const existingLessons = existing?.lessons_completed || []
      const updatedLessons = [...new Set([...existingLessons, lessonId])]

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('learn_progress')
          .update({
            lessons_completed: updatedLessons,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('Error updating progress:', updateError)
          return NextResponse.json({ success: false, error: 'Failed to update progress' }, { status: 500 })
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('learn_progress')
          .insert({
            user_id: userId,
            module_id: moduleId,
            lessons_completed: [lessonId],
            completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error inserting progress:', insertError)
          return NextResponse.json({ success: false, error: 'Failed to save progress' }, { status: 500 })
        }
      }

      return NextResponse.json({ success: true, lessonCompleted: lessonId })
    }

    // If completed is true, we're marking a module complete
    if (moduleId && completed !== undefined) {
      const { data: existing, error: fetchError } = await supabase
        .from('learn_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .single()

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('learn_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('Error updating module completion:', updateError)
          return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 })
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('learn_progress')
          .insert({
            user_id: userId,
            module_id: moduleId,
            completed: true,
            completed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error inserting module completion:', insertError)
          return NextResponse.json({ success: false, error: 'Failed to save' }, { status: 500 })
        }
      }

      return NextResponse.json({ success: true, moduleCompleted: moduleId })
    }

    // If quizScore is provided, save the quiz result
    if (moduleId && quizScore !== undefined) {
      const { data: existing, error: fetchError } = await supabase
        .from('learn_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .single()

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('learn_progress')
          .update({
            quiz_score: quizScore,
            completed: true,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('Error updating quiz score:', updateError)
          return NextResponse.json({ success: false, error: 'Failed to save quiz' }, { status: 500 })
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('learn_progress')
          .insert({
            user_id: userId,
            module_id: moduleId,
            quiz_score: quizScore,
            completed: true,
            completed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error inserting quiz score:', insertError)
          return NextResponse.json({ success: false, error: 'Failed to save quiz' }, { status: 500 })
        }
      }

      return NextResponse.json({ success: true, quizSaved: true, score: quizScore })
    }

    return NextResponse.json({ success: false, error: 'No action specified' }, { status: 400 })

  } catch (error) {
    console.error('Progress POST error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
