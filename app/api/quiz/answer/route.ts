import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

const POINTS_FOR_CORRECT = 10

export async function POST(req: NextRequest) {
  try {
    const { quizId, answer } = await req.json()
    const supabase = await createClient()
    const admin = createAdminClient()

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

    // Award points if correct
    if (isCorrect) {
      const { data: profile } = await admin
        .from('profiles')
        .select('point')
        .eq('id', user.id)
        .single()

      await admin
        .from('profiles')
        .update({ point: (profile?.point ?? 0) + POINTS_FOR_CORRECT })
        .eq('id', user.id)

      // Log point history
      await admin
        .from('point_logs')
        .insert({
          user_id: user.id,
          amount: POINTS_FOR_CORRECT,
          reason: 'quiz_correct',
          reference_id: quizId,
        })
    }

    return NextResponse.json({ correct: isCorrect, score: isCorrect ? POINTS_FOR_CORRECT : 0 })
  } catch (error) {
    console.error('Quiz answer error:', error)
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
  }
}
