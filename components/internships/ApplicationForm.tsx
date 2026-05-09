'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import {
  createApplication,
  updateApplication,
} from '@/lib/actions/internships'
import {
  internshipApplicationSchema,
  type InternshipApplicationInput,
} from '@/lib/utils/validators'
import { toInputDate } from '@/lib/utils/dates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils/cn'
import type { InternshipApplication } from '@/lib/types/app.types'

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied' },
  { value: 'online_assessment', label: 'Online Assessment' },
  { value: 'interview', label: 'Interview' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'accepted', label: 'Accepted' },
] as const

interface ApplicationFormProps {
  open: boolean
  onClose: () => void
  initialData?: InternshipApplication | null
}

export function ApplicationForm({
  open,
  onClose,
  initialData,
}: ApplicationFormProps) {
  const isEdit = !!initialData
  const router = useRouter()
  const { toast } = useToast()
  const [serverError, setServerError] = useState<string>()
  const [isPending, startTransition] = useTransition()

  const form = useForm<InternshipApplicationInput>({
    resolver: zodResolver(internshipApplicationSchema),
    defaultValues: {
      company_name: initialData?.company_name ?? '',
      role_title: initialData?.role_title ?? '',
      status: initialData?.status ?? 'applied',
      applied_date: toInputDate(initialData?.applied_date) || undefined,
      deadline: toInputDate(initialData?.deadline) || undefined,
      job_url: initialData?.job_url ?? undefined,
      location: initialData?.location ?? undefined,
      salary_range: initialData?.salary_range ?? undefined,
      recruiter_name: initialData?.recruiter_name ?? undefined,
      recruiter_email: initialData?.recruiter_email ?? undefined,
      notes: initialData?.notes ?? undefined,
      resume_version: initialData?.resume_version ?? undefined,
      is_priority: initialData?.is_priority ?? false,
    },
  })

  function handleClose() {
    form.reset()
    setServerError(undefined)
    onClose()
  }

  function onSubmit(values: InternshipApplicationInput) {
    setServerError(undefined)
    startTransition(async () => {
      const formData = new FormData()
      Object.entries(values).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
          formData.set(k, String(v))
        }
      })

      const result = isEdit
        ? await updateApplication(initialData.id, formData)
        : await createApplication(formData)

      if (result?.error) {
        setServerError(result.error)
        return
      }

      toast({
        title: isEdit ? 'Application updated' : 'Application added',
        description: `${values.company_name} — ${values.role_title}`,
      })
      handleClose()
      router.refresh()
    })
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="flex flex-col overflow-y-auto sm:max-w-lg">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>
            {isEdit ? 'Edit application' : 'New application'}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update the details for this application.'
              : 'Add a new internship application to your tracker.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-5 px-6 pb-6 pt-4"
          >
            {/* Company + Role */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Company *</FormLabel>
                    <FormControl>
                      <Input placeholder="Google" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role_title"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel>Role *</FormLabel>
                    <FormControl>
                      <Input placeholder="SWE Intern" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="applied_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applied date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* URL + Location */}
            <FormField
              control={form.control}
              name="job_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://jobs.google.com/..."
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seoul / Remote"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salary_range"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="₩3,000,000 / mo"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Recruiter */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="recruiter_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recruiter</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Kim Jisoo"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recruiter_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recruiter email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="recruiter@co.com"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Resume version */}
            <FormField
              control={form.control}
              name="resume_version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resume version</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="v3-backend-2026"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Interview tips, referral contact, key requirements…"
                      className="min-h-[100px] resize-none"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority toggle */}
            <FormField
              control={form.control}
              name="is_priority"
              render={({ field }) => (
                <FormItem>
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                      field.value
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'border-border bg-background text-muted-foreground hover:border-foreground/20'
                    )}
                  >
                    <Star
                      className={cn(
                        'h-4 w-4',
                        field.value && 'fill-amber-500 text-amber-500'
                      )}
                    />
                    {field.value ? 'Priority application' : 'Mark as priority'}
                  </button>
                </FormItem>
              )}
            />

            {serverError && (
              <p className="text-xs text-destructive">{serverError}</p>
            )}

            <div className="mt-auto flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? 'Saving…'
                  : isEdit
                  ? 'Save changes'
                  : 'Add application'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
