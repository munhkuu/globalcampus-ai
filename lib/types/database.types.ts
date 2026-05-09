/**
 * Hand-written types for Phase 2.
 * Replace with `supabase gen types typescript --project-id vfiiztyzynmsaftctlnf`
 * output once you have the Supabase CLI installed.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ApplicationStatus =
  | 'applied'
  | 'online_assessment'
  | 'interview'
  | 'rejected'
  | 'accepted'

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'

export type AiFeature = 'explainer' | 'roadmap' | 'summarizer'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          onboarding_completed: boolean
          target_role: string | null
          university: string | null
          graduation_year: number | null
          experience_level: ExperienceLevel | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          onboarding_completed?: boolean
          target_role?: string | null
          university?: string | null
          graduation_year?: number | null
          experience_level?: ExperienceLevel | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          onboarding_completed?: boolean
          target_role?: string | null
          university?: string | null
          graduation_year?: number | null
          experience_level?: ExperienceLevel | null
        }
        Relationships: []
      }
      internship_applications: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          company_name: string
          role_title: string
          status: ApplicationStatus
          applied_date: string | null
          deadline: string | null
          job_url: string | null
          recruiter_name: string | null
          recruiter_email: string | null
          notes: string | null
          resume_version: string | null
          is_priority: boolean
          location: string | null
          salary_range: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          company_name: string
          role_title: string
          status?: ApplicationStatus
          applied_date?: string | null
          deadline?: string | null
          job_url?: string | null
          recruiter_name?: string | null
          recruiter_email?: string | null
          notes?: string | null
          resume_version?: string | null
          is_priority?: boolean
          location?: string | null
          salary_range?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          company_name?: string
          role_title?: string
          status?: ApplicationStatus
          applied_date?: string | null
          deadline?: string | null
          job_url?: string | null
          recruiter_name?: string | null
          recruiter_email?: string | null
          notes?: string | null
          resume_version?: string | null
          is_priority?: boolean
          location?: string | null
          salary_range?: string | null
        }
        Relationships: []
      }
      vault_notes: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          title: string
          content: string
          tags: string[]
          source: string
          is_pinned: boolean
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          title: string
          content?: string
          tags?: string[]
          source?: string
          is_pinned?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          title?: string
          content?: string
          tags?: string[]
          source?: string
          is_pinned?: boolean
        }
        Relationships: []
      }
      study_goals: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          target_date: string | null
          completed: boolean
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          target_date?: string | null
          completed?: boolean
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          target_date?: string | null
          completed?: boolean
          completed_at?: string | null
        }
        Relationships: []
      }
      roadmap_sessions: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          session_name: string
          target_role: string
          current_skills: string[]
          experience_level: ExperienceLevel
          timeline_months: number
          roadmap_data: Json
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          session_name?: string
          target_role: string
          current_skills?: string[]
          experience_level?: ExperienceLevel
          timeline_months?: number
          roadmap_data?: Json
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          session_name?: string
          target_role?: string
          current_skills?: string[]
          experience_level?: ExperienceLevel
          timeline_months?: number
          roadmap_data?: Json
        }
        Relationships: []
      }
      ai_interactions: {
        Row: {
          id: string
          user_id: string
          created_at: string
          feature: AiFeature
          model_used: string
          input_hash: string
          prompt_tokens: number
          completion_tokens: number
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          feature: AiFeature
          model_used: string
          input_hash: string
          prompt_tokens?: number
          completion_tokens?: number
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          feature?: AiFeature
          model_used?: string
          input_hash?: string
          prompt_tokens?: number
          completion_tokens?: number
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      application_status: ApplicationStatus
      experience_level: ExperienceLevel
      ai_feature: AiFeature
    }
    CompositeTypes: {}
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
