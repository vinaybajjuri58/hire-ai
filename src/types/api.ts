// Backend type definitions

export enum UserRole {
  Candidate = "candidate",
  Recruiter = "recruiter",
}

export type TUser = {
  id: string
  name: string
  email: string
  createdAt: string // ISO date string format
  role?: UserRole
  role_selected?: boolean // Tracks whether the user has explicitly selected their role
  github?: string
  linkedin?: string
  twitter?: string
  resume_url?: string
}

export type TApiResponse<T> = {
  data?: T
  error?: string
  status: number
  emailVerificationRequired?: boolean
}

export type TRouteContext = {
  params: {
    id: string
  }
}

export type TLoginRequest = {
  email: string
  password: string
}

export type TSignupRequest = {
  name: string
  email: string
  password: string
  role?: UserRole
}

export type TAuthResponse = {
  user: TUser
  token?: string
  emailVerified?: boolean
}
