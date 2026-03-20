import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

const client = new OpenAI()

const OPTION_LETTERS = ['A', 'B', 'C', 'D']

async function generateQuizQuestion() {
  const topics = [
    '프롬프트 엔지니어링', 'Claude Code 활용법', 'Cursor IDE 기능',
    'AI 코딩 베스트 프랙티스', 'vibe coding 개념', 'LLM 기본 개념',
    'GitHub Copilot 활용', 'AI 보조 개발 워크플로우'
  ]
  const topic = topics[Math.floor(Math.random() * topics.length)]

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `${topic}에 관한 4지선다 퀴즈를 하나 만들어주세요.

다음 JSON 형식으로만 답하세요 (다른 텍스트 없이):
{
  "question": "질문 내용",
  "options": ["보기1", "보기2", "보기3", "보기4"],
  "answer": 0,
  "explanation": "정답 설명"
}

answer는 0-3 사이의 정답 인덱스입니다.`
    }]
  })

  const text = (response.choices[0].message.content || '').trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Invalid response format')
  return JSON.parse(jsonMatch[0])
}

function formatQuiz(question: any) {
  const options = (question.options as string[]).map((text: string, i: number) => ({
    label: `${OPTION_LETTERS[i]}. ${text}`,
    value: String(i),
  }))
  return {
    id: question.id,
    question: question.question,
    options,
    correct: String(question.answer),
    explanation: question.explanation,
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date())
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('mode')

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Random mode: return a random unanswered past question
    if (mode === 'random' && user) {
      // Get all question IDs the user already answered
      const { data: submissions } = await supabase
        .from('quiz_submissions')
        .select('question_id')
        .eq('user_id', user.id)

      const answeredIds = (submissions || []).map(s => s.question_id)

      // Fetch all questions not yet answered
      let query = admin
        .from('quiz_questions')
        .select('*')
        .lte('date', today)

      if (answeredIds.length > 0) {
        // Filter out answered questions using not.in
        query = query.not('id', 'in', `(${answeredIds.join(',')})`)
      }

      const { data: unanswered } = await query

      if (!unanswered || unanswered.length === 0) {
        return NextResponse.json({ quiz: null, noMore: true })
      }

      // Pick a random one
      const question = unanswered[Math.floor(Math.random() * unanswered.length)]
      return NextResponse.json({ quiz: formatQuiz(question) })
    }

    // Default mode: today's quiz
    let question: any = null
    const { data: existing } = await admin
      .from('quiz_questions')
      .select('*')
      .eq('date', today)
      .single()

    if (existing) {
      question = existing
    } else {
      // If AI generation fails (e.g. no credits), skip quiz silently
      let quiz
      try {
        quiz = await generateQuizQuestion()
      } catch {
        return NextResponse.json({ quiz: null })
      }
      const { data: created, error } = await admin
        .from('quiz_questions')
        .insert({ date: today, ...quiz })
        .select()
        .single()
      if (error) throw error
      question = created
    }

    // If logged in, check if already answered
    if (user) {
      const { data: submission } = await supabase
        .from('quiz_submissions')
        .select('is_correct')
        .eq('user_id', user.id)
        .eq('question_id', question.id)
        .single()

      if (submission) {
        return NextResponse.json({
          alreadyAnswered: true,
          score: submission.is_correct ? 10 : 0,
        })
      }
    }

    return NextResponse.json({ quiz: formatQuiz(question) })
  } catch (error) {
    console.error('Quiz GET error:', error)
    return NextResponse.json({ error: 'Failed to get quiz' }, { status: 500 })
  }
}
