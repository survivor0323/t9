import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

const client = new OpenAI()

export async function POST(req: NextRequest) {
  try {
    const { title, description, tags } = await req.json()

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `다음 앱/문서를 아래 카테고리 중 하나로 분류해주세요.
카테고리: 기획, 영업, 마케팅, 디자인, 운영, 경영, 개발, 기타

제목: ${title}
설명: ${description}
태그: ${tags.join(', ')}

카테고리 이름만 답변하세요.`
      }]
    })

    const text = (response.choices[0].message.content || '').trim()
    const validCategories = ['기획', '영업', '마케팅', '디자인', '운영', '경영', '개발', '기타']
    const category = validCategories.find(c => text.includes(c)) || '기타'

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Classify error:', error)
    return NextResponse.json({ category: '기타' })
  }
}
