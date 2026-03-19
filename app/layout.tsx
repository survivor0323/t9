import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'M.hub — 사내 AI 산출물 공유 플랫폼',
  description: '임직원이 만든 웹앱과 AI 산출물을 공유하고 피드백을 나누는 공간',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
