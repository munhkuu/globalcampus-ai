'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { completeOnboarding } from '@/lib/actions/onboarding'
import { onboardingSchema, type OnboardingInput } from '@/lib/utils/validators'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils/cn'
import type { Metadata } from 'next'

const EXPERIENCE_OPTIONS = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Still learning fundamentals, limited project experience',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Comfortable with core CS, have personal or class projects',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Internship experience or strong project portfolio',
  },
] as const

const currentYear = new Date().getFullYear()
const GRAD_YEARS = Array.from({ length: 8 }, (_, i) => currentYear + i)

export default function OnboardingPage() {
  const [serverError, setServerError] = useState<string>()
  const [isPending, startTransition] = useTransition()

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      targetRole: '',
      university: '',
      graduationYear: currentYear + 1,
      experienceLevel: 'beginner',
    },
  })

  function onSubmit(values: OnboardingInput) {
    setServerError(undefined)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('targetRole', values.targetRole)
      formData.set('university', values.university)
      formData.set('graduationYear', String(values.graduationYear))
      formData.set('experienceLevel', values.experienceLevel)

      const result = await completeOnboarding(formData)
      if (result?.error) {
        setServerError(result.error)
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-[420px] space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground">
            <span className="text-sm font-bold text-background">GC</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Set up your profile
          </h1>
          <p className="text-sm text-muted-foreground">
            This helps us personalise your roadmaps and recommendations.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Target Role */}
            <FormField
              control={form.control}
              name="targetRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target role</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Software Engineer, Backend Developer"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* University */}
            <FormField
              control={form.control}
              name="university"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>University</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Korea University, KAIST"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Graduation Year */}
            <FormField
              control={form.control}
              name="graduationYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected graduation</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {GRAD_YEARS.map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => field.onChange(year)}
                        className={cn(
                          'rounded-md border px-3 py-1.5 text-sm transition-colors',
                          field.value === year
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border bg-background text-foreground hover:border-foreground/40'
                        )}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Experience Level */}
            <FormField
              control={form.control}
              name="experienceLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience level</FormLabel>
                  <div className="space-y-2">
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => field.onChange(opt.value)}
                        className={cn(
                          'w-full rounded-lg border p-3 text-left transition-colors',
                          field.value === opt.value
                            ? 'border-foreground bg-accent'
                            : 'border-border bg-background hover:border-foreground/30'
                        )}
                      >
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {opt.description}
                        </p>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serverError && (
              <p className="text-xs text-destructive">{serverError}</p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Saving…' : 'Get started'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
