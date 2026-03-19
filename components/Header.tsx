'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, Plus, LogOut, User as UserIcon, ChevronDown, Globe, FileText, Shield } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Profile } from '@/types'

type HeaderProps = {
  user: any
  profile?: Profile | null
}

export default function Header({ user, profile }: HeaderProps) {
  const [registerOpen, setRegisterOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const registerRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (registerRef.current && !registerRef.current.contains(e.target as Node)) setRegisterOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchValue) params.set('q', searchValue)
    router.push(`/?${params.toString()}`)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4 max-w-7xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center font-bold text-lg group-hover:bg-green-700 transition-colors">
            M
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">M.hub</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-100 focus:border-green-300 transition-all"
              placeholder="산출물 검색..."
            />
          </div>
        </form>

        {/* Right */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Register dropdown */}
              <div className="relative" ref={registerRef}>
                <button
                  onClick={() => setRegisterOpen(!registerOpen)}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  등록
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setRegisterOpen(!registerOpen)}
                  className="sm:hidden p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
                {registerOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <Link
                      href="/register/webapp"
                      onClick={() => setRegisterOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Globe className="w-4 h-4 text-green-600" />
                      웹앱 등록
                    </Link>
                    <Link
                      href="/register/document"
                      onClick={() => setRegisterOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <FileText className="w-4 h-4 text-blue-500" />
                      문서 등록
                    </Link>
                  </div>
                )}
              </div>

              <div className="h-5 w-px bg-gray-200" />

              {/* User menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-full transition-colors"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="User" className="w-8 h-8 rounded-full border border-gray-200" />
                  ) : (
                    <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-50">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.user_metadata?.full_name || user.email}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      내 산출물
                    </Link>
                    {profile?.is_admin && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <Shield className="w-4 h-4 text-green-600" />
                        관리자
                      </Link>
                    )}
                    <button onClick={handleSignOut}
                      className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/login"
              className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
