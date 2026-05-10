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
  targetRole: z.string().min(2, 'Please enter a target role').max(100),
  university: z.string().min(2, 'Please enter your university').max(150),
  graduationYear: z.number().int().min(2020).max(2040),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
})

// ─── Internship Applications ──────────────────────────────────────────────────

const emptyToNull = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v))
  .nullable()
  .optional()

export const internshipApplicationSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(200),
  role_title: z.string().min(1, 'Role title is required').max(200),
  status: z
    .enum(['applied', 'online_assessment', 'interview', 'rejected', 'accepted'])
    .default('applied'),
  applied_date: emptyToNull,
  deadline: emptyToNull,
  job_url: emptyToNull,
  location: emptyToNull,
  salary_range: emptyToNull,
  recruiter_name: emptyToNull,
  recruiter_email: z
    .string()
    .email('Invalid email')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v)),
  notes: emptyToNull,
  resume_version: emptyToNull,
  is_priority: z.boolean().default(false),
})

// ─── Vault Notes ──────────────────────────────────────────────────────────────

export const vaultNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().max(50000).optional().default(''),
  tagsRaw: z.string().optional().default(''),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type OnboardingInput = z.infer<typeof onboardingSchema>
export type InternshipApplicationInput = z.infer<typeof internshipApplicationSchema>
export type VaultNoteInput = z.infer<typeof vaultNoteSchema>
