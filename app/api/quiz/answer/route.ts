import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const POINTS_FOR_CORRECT = 10

export async function POST(req: NextRequest) {
  try {
    const { quizId, answer } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: question } = await supabase
      .from('quiz_questions')
      .select('answer')
      .eq('id', quizId)
      .single()

    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

    const isCorrect = String(question.answer) === String(answer)

    // Save submission (ignore duplicate)
    await supabase
      .from('quiz_submissions')
      .insert({ user_id: user.id, question_id: quizId, is_correct: isCorrect })

    // Update quiz_score if correct
    if (isCorrect) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('quiz_score')
        .eq('id', user.id)
        .single()

      await supabase
        .from('profiles')
        .update({ quiz_score: (profile?.quiz_score ?? 0) + POINTS_FOR_CORRECT })
        .eq('id', user.id)
    }

    return NextResponse.json({ correct: isCorrect, score: isCorrect ? POINTS_FOR_CORRECT : 0 })
  } catch (error) {
    console.error('Quiz answer error:', error)
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}
