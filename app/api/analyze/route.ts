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
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [{
        role: 'system',
        content: `당신은 사내 AI 산출물을 분석하는 시니어 개발자입니다.
프로젝트 이름, 설명, 태그, GitHub URL 등의 정보를 바탕으로 어떤 기술을 활용했는지 추론하고, 실용적인 피드백을 제공합니다.
태그나 설명에서 기술 스택 힌트를 적극적으로 파악하세요 (예: Supabase, OpenAI, MCP, Cursor, Chrome Extension, Streamlit, n8n 등).
마크다운 형식으로 한국어로 작성하되, 다른 직원들이 기술적으로 참고할 수 있도록 구체적으로 작성하세요.`
      }, {
        role: 'user',
        content: `다음 사내 AI 산출물을 분석해주세요.

${context}

아래 항목을 모두 포함해서 분석해주세요:

## 1. 강점
이 산출물의 좋은 점 2-3가지

## 2. 기술 구현 분석
프로젝트 정보를 바탕으로 추론되는 기술적 구현 내용을 분석해주세요. 예시:
- 외부 API 활용: 어떤 API를 어떤 용도로 연동했는지 (예: OpenAI API로 텍스트 생성, Google Vision API로 이미지 분석)
- AI/자동화 도구: MCP 서버, n8n, Make 등 활용 여부
- 프롬프트 엔지니어링: 시스템 프롬프트나 프롬프트 체이닝 등 특이한 접근법
- 성능 최적화: 캐싱, 벡터 DB, 스트리밍 등 기술적 최적화
- 창의적 접근: 크롬 익스텐션, 슬랙봇, 노코드 도구 조합 등 독특한 구현 방식
- 이미지/미디어: DALL-E, Stable Diffusion, Midjourney 등 이미지 생성 API 활용
- 데이터: Supabase, Firebase 등 백엔드 구성

확인 가능한 것만 작성하고, 추론인 경우 "~로 추정" 등으로 표기해주세요.

## 3. 개선 제안
더 나아질 수 있는 부분 2-3가지 (구체적인 기술 대안 포함)

## 4. 추가 기능 아이디어
비슷한 도구들과 비교했을 때 추가하면 좋을 기능 1-2가지 (구현 방법 힌트 포함)`
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
