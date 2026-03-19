import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🚫</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h1>
        <p className="text-gray-500 mb-6">
          M.hub는 사내 임직원 전용 서비스입니다.<br />
          허용된 이메일 계정으로 로그인해 주세요.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors"
        >
          다른 계정으로 로그인
        </Link>
      </div>
    </div>
  )
}
