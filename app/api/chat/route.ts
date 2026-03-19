import OpenAI from 'openai'
import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const client = new OpenAI()

export async function POST(req: NextRequest) {
  try {
    const { messages, projectContext } = await req.json()

    const supabase = await createClient()

    // Get list of public apps for context
    const { data: apps } = await supabase
      .from('projects')
      .select('title, description, category, tags, url')
      .eq('status', 'public')
      .limit(20)

    const appsList = (apps || []).map(a =>
      `- ${a.title} (${a.category || '미분류'}): ${a.description?.slice(0, 80) || '설명 없음'}`
    ).join('\n')

    let systemPrompt = `당신은 M.hub의 AI 바이브코딩 어시스턴트입니다.
사내 임직원들이 만든 AI 산출물 공유 플랫폼에서 동작합니다.

주요 역할:
1. 바이브코딩(AI 보조 코딩) 가이드 - Claude Code, Cursor 등 AI 코딩 도구 활용법, 프롬프트 작성법
2. 코딩 질문 답변 및 디버깅 도움
3. M.hub에 등록된 앱 추천

현재 M.hub에 등록된 앱 목록:
${appsList || '(현재 등록된 앱이 없습니다)'}

항상 친절하고 실용적인 답변을 한국어로 제공하세요.`

    if (projectContext) {
      systemPrompt += `\n\n현재 사용자가 보고 있는 앱:
제목: ${projectContext.title}
설명: ${projectContext.description || '없음'}
태그: ${(projectContext.tags || []).join(', ')}`
    }

    const stream = await client.chat.completions.create({
      model: 'gpt-5-codex',
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content }))
      ]
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ''
          if (text) controller.enqueue(encoder.encode(text))
        }
        controller.close()
      }
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked' }
    })
  } catch (error) {
    console.error('Chat error:', error)
    return new Response('Error', { status: 500 })
  }
}
