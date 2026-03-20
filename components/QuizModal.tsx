'use client'
import { useState, useEffect } from 'react'
import { X, CheckCircle, XCircle, Brain, RefreshCw, Loader2 } from 'lucide-react'

type QuizOption = {
  label: string
  value: string
}

type Quiz = {
  id: string
  question: string
  options: QuizOption[]
  correct: string
  explanation: string
}

type QuizResult = {
  answered: true
  correct: boolean
  score: number
}

export default function QuizModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [solvedCount, setSolvedCount] = useState(0)
  const [totalScore, setTotalScore] = useState(0)

  const fetchQuiz = async (mode: 'today' | 'random') => {
    const url = mode === 'random' ? '/api/quiz?mode=random' : '/api/quiz'
    const res = await fetch(url)
    return res.json()
  }

  useEffect(() => {
    // Try today's quiz first, if already answered go to random
    fetchQuiz('today')
      .then(data => {
        if (data.alreadyAnswered) {
          // Already answered today, fetch random
          return fetchQuiz('random')
        }
        return data
      })
      .then(data => {
        if (data?.quiz) setQuiz(data.quiz)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  const handleAnswer = async (value: string) => {
    if (selected || !quiz) return
    setSelected(value)
    setSubmitting(true)

    try {
      const res = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: quiz.id, answer: value }),
      })
      const data = await res.json()
      setResult({ answered: true, correct: data.correct, score: data.score })
      setSolvedCount(c => c + 1)
      setTotalScore(s => s + (data.score || 0))
    } catch {
      const correct = value === quiz.correct
      setResult({ answered: true, correct, score: 0 })
      setSolvedCount(c => c + 1)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = async () => {
    setLoadingMore(true)
    try {
      const data = await fetchQuiz('random')
      if (data.quiz) {
        setQuiz(data.quiz)
        setSelected(null)
        setResult(null)
      }
    } catch {}
    finally { setLoadingMore(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">바이브 코딩 퀴즈</h2>
          </div>
          <div className="flex items-center gap-3">
            {solvedCount > 0 && (
              <span className="text-xs text-gray-400">{solvedCount}문제 풀음 · +{totalScore}점</span>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : !quiz ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              퀴즈를 불러올 수 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Question */}
              <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                {quiz.question}
              </p>

              {/* Options */}
              {!result ? (
                <div className="space-y-2">
                  {quiz.options.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(opt.value)}
                      disabled={submitting}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                        selected === opt.value
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-green-400 hover:bg-green-50'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Result header */}
                  <div
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${
                      result.correct
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {result.correct ? (
                      <>
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        정답입니다!
                        {result.score > 0 && <span className="ml-auto text-xs font-normal">+{result.score}점</span>}
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 shrink-0" />
                        오답!
                        <span className="ml-auto text-xs font-normal">
                          정답: {quiz.options.find(o => o.value === quiz.correct)?.label}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Answer options review */}
                  <div className="space-y-1.5">
                    {quiz.options.map(opt => {
                      const isCorrectAnswer = opt.value === quiz.correct
                      const isUserPick = opt.value === selected
                      let style = 'bg-white text-gray-400 border-gray-100'
                      if (isCorrectAnswer) style = 'bg-green-50 text-green-700 border-green-200 font-medium'
                      if (isUserPick && !isCorrectAnswer) style = 'bg-red-50 text-red-400 border-red-200 line-through'
                      return (
                        <div key={opt.value} className={`px-4 py-2 rounded-xl text-sm border ${style}`}>
                          {opt.label}
                          {isCorrectAnswer && <span className="ml-1 text-green-500">&#10003;</span>}
                        </div>
                      )
                    })}
                  </div>

                  {/* Explanation */}
                  {quiz.explanation && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1">해설</p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {quiz.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Next quiz button */}
        {result && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <button
              onClick={handleNext}
              disabled={loadingMore}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  퀴즈 생성 중...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  다음 퀴즈
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
