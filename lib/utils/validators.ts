import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be under 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be under 72 characters'),
})

// ─── Profile ──────────────────────────────────────────────────────────────────

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url('Invalid URL').optional().nullable(),
})

// ─── Onboarding ───────────────────────────────────────────────────────────────

export const onboardingSchema = z.object({
  targetRole: z
    .string()
    .min(2, 'Please enter a target role')
    .max(100),
  university: z
    .string()
    .min(2, 'Please enter your university')
    .max(150),
  graduationYear: z
    .number()
    .int()
    .min(2020)
    .max(2040),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
})

export type LoginInput        = z.infer<typeof loginSchema>
export type RegisterInput     = z.infer<typeof registerSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type OnboardingInput   = z.infer<typeof onboardingSchema>
