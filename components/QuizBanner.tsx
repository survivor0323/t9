'use client'
import { useState, useEffect } from 'react'
import { X, CheckCircle, XCircle, Brain, RefreshCw } from 'lucide-react'

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

const SESSION_KEY = 'quiz_banner_dismissed'

export default function QuizBanner({ userId }: { userId: string }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [todayResult, setTodayResult] = useState<{ score: number } | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isBonusMode, setIsBonusMode] = useState(false)
  const [noMore, setNoMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    // Check session dismissal
    if (typeof window !== 'undefined') {
      const val = sessionStorage.getItem(SESSION_KEY)
      if (val === 'true') {
        setDismissed(true)
        setLoading(false)
        return
      }
    }

    // Fetch today's quiz
    fetch('/api/quiz')
      .then(r => r.json())
      .then(data => {
        if (data.alreadyAnswered) {
          setTodayResult({ score: data.score })
        } else if (data.quiz) {
          setQuiz(data.quiz)
        }
      })
      .catch(() => {
        // silently fail — quiz is optional UI
      })
      .finally(() => setLoading(false))
  }, [userId])

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, 'true')
    }
  }

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
      setResult({
        answered: true,
        correct: data.correct,
        score: data.score,
      })
    } catch {
      // Show local result based on correct answer in quiz data
      setResult({
        answered: true,
        correct: value === quiz.correct,
        score: 0,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleMoreQuiz = async () => {
    setLoadingMore(true)
    try {
      const res = await fetch('/api/quiz?mode=random')
      const data = await res.json()
      if (data.noMore || !data.quiz) {
        setNoMore(true)
      } else {
        setQuiz(data.quiz)
        setSelected(null)
        setResult(null)
        setTodayResult(null)
        setIsBonusMode(true)
      }
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false)
    }
  }

  if (dismissed || loading) return null

  // Already answered today (and not in bonus mode)
  if (todayResult && !isBonusMode) {
    return (
      <div className="relative flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-3.5 max-w-sm ml-auto">
        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
        <div className="flex-1 text-sm">
          <span className="font-semibold text-green-800">오늘 퀴즈 완료</span>
          {todayResult.score > 0 && (
            <span className="text-green-600 ml-1">(+{todayResult.score}점)</span>
          )}
        </div>
        {!noMore && (
          <button
            onClick={handleMoreQuiz}
            disabled={loadingMore}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50 shrink-0"
          >
            {loadingMore ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            더 풀기
          </button>
        )}
        {noMore && (
          <span className="text-xs text-gray-400 shrink-0">모두 완료!</span>
        )}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  if (!quiz) return null

  return (
    <div className="relative bg-green-50 border border-green-200 rounded-2xl p-5 max-w-sm ml-auto shadow-sm">
      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="닫기"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-green-600" />
        <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
          {isBonusMode ? '보너스 퀴즈' : '오늘의 바이브 코딩 퀴즈'}
        </span>
      </div>

      {/* Question */}
      <p className="text-sm font-medium text-gray-800 mb-3 leading-snug pr-4">
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
              className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition-all ${
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
          {/* Result feedback */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold ${
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
                틀렸습니다
              </>
            )}
          </div>

          {/* Explanation */}
          {quiz.explanation && (
            <p className="text-xs text-gray-600 leading-relaxed bg-white border border-gray-100 rounded-xl px-3 py-2">
              {quiz.explanation}
            </p>
          )}

          {/* More quiz button */}
          {!noMore && (
            <button
              onClick={handleMoreQuiz}
              disabled={loadingMore}
              className="flex items-center justify-center gap-1.5 w-full py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              퀴즈 더 풀기
            </button>
          )}
          {noMore && (
            <p className="text-center text-xs text-gray-400 py-1">풀 수 있는 퀴즈를 모두 완료했습니다!</p>
          )}
        </div>
      )}
    </div>
  )
}
