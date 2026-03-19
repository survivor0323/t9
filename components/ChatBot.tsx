'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

export default function ChatBot({ projectContext }: { projectContext?: any }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '안녕하세요! 바이브코딩 어시스턴트입니다. 코딩 질문이나 M.hub 앱 추천을 도와드릴게요 👋' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMsg }],
          projectContext
        })
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let aiContent = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        aiContent += decoder.decode(value)
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: aiContent }
        ])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '오류가 발생했습니다. 다시 시도해주세요.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-green-600 text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-medium text-sm">M.hub 어시스턴트</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-green-700 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.content}
                  {loading && i === messages.length - 1 && msg.role === 'assistant' && !msg.content && (
                    <span className="animate-pulse">●●●</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()}
                className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 flex items-center justify-center transition-all hover:scale-105"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
    </>
  )
}
