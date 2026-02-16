export type Project = {
    id: string
    user_id: string
    title: string
    status: string
    created_at: string
    url?: string
    description?: string
    views: number
    screenshots?: string[]
}

export type Review = {
    id: string
    project_id: string
    user_id: string
    rating: number
    comment?: string
    created_at: string
}

export type Profile = {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
}
