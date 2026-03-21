export type ProjectType = 'webapp' | 'document'
export type ProjectStatus = 'draft' | 'public' | 'hidden'

export type Project = {
  id: string
  user_id: string
  title: string
  type: ProjectType
  status: ProjectStatus
  created_at: string
  url?: string
  file_url?: string
  github_url?: string
  description?: string
  tags: string[]
  category?: string
  views: number
  clicks: number
  screenshots: string[]
  is_featured: boolean
  difficulty?: 'low' | 'medium' | 'high'
  ai_feedback?: string
  ai_feedback_at?: string
  profiles?: Profile
  average_rating?: number
  review_count?: number
  bookmark_count?: number
  is_bookmarked?: boolean
}

export type Profile = {
  id: string
  full_name?: string
  avatar_url?: string
  is_admin?: boolean
  point?: number
}

export type PointLog = {
  id: string
  created_at: string
  user_id: string
  amount: number
  reason: string
  reference_id?: string
}

export type Review = {
  id: string
  project_id: string
  user_id: string
  rating: number
  comment?: string
  created_at: string
  profiles?: Profile
}

export type Bookmark = {
  id: string
  user_id: string
  project_id: string
  created_at: string
}

export type QuizQuestion = {
  id: string
  date: string
  question: string
  options: string[]
  answer: number
  explanation?: string
}

export type QuizSubmission = {
  id: string
  user_id: string
  question_id: string
  is_correct: boolean
  created_at: string
}
