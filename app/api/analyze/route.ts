import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const client = new OpenAI()

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json()
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

    const supabase = await createClient()
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Build context
    let context = `프로젝트 이름: ${project.title}
설명: ${project.description || '없음'}
태그: ${(project.tags || []).join(', ')}
카테고리: ${project.category || '없음'}
유형: ${project.type === 'webapp' ? '웹앱' : '문서'}
`

    if (project.github_url) {
      context += `GitHub: ${project.github_url}\n`
    }

    const response = await client.chat.completions.create({
      model: 'gpt-5-codex',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `다음 사내 AI 산출물을 분석하고 개선 의견을 한국어로 제공해주세요.

${context}

다음 항목을 포함해서 분석해주세요:
1. **강점**: 이 산출물의 좋은 점 2-3가지
2. **개선 제안**: 더 나아질 수 있는 부분 2-3가지 (구체적으로)
3. **추가 기능 아이디어**: 비슷한 도구들과 비교했을 때 추가하면 좋을 기능 1-2가지

마크다운 형식으로 작성해주세요. 실용적이고 구체적인 의견을 주세요.`
      }]
    })

    const feedback = response.choices[0].message.content || ''

    await supabase
      .from('projects')
      .update({ ai_feedback: feedback, ai_feedback_at: new Date().toISOString() })
      .eq('id', projectId)

    return NextResponse.json({ success: true, feedback })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
