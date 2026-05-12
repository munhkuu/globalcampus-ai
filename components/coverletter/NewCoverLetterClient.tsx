'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Link2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/cn'
import { createCoverLetter } from '@/lib/actions/coverletter'
import type { CompanyPreset } from '@/lib/coverletter/company-questions'

type ApplicationOption = {
  id: string
  company_name: string
  role_title: string
  deadline: string | null
  status: string
}

export function NewCoverLetterClient({
  companies,
  applications,
  prefilledAppId,
}: {
  companies: CompanyPreset[]
  applications: ApplicationOption[]
  prefilledAppId: string | null
}) {
  const prefilledApp = useMemo(
    () => applications.find((a) => a.id === prefilledAppId) ?? null,
    [applications, prefilledAppId]
  )
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedCompany, setSelectedCompany] = useState<CompanyPreset | null>(
    prefilledApp ? companies.find((c) => c.name === prefilledApp.company_name) ?? null : null
  )
  const [customCompany, setCustomCompany] = useState(
    prefilledApp && !companies.find((c) => c.name === prefilledApp.company_name)
      ? prefilledApp.company_name
      : ''
  )
  const [selectedQuestion, setSelectedQuestion] = useState<string>('')
  const [customQuestion, setCustomQuestion] = useState('')
  const [linkedAppId, setLinkedAppId] = useState<string | null>(prefilledAppId)
  const [error, setError] = useState<string>()
  const [isPending, startTransition] = useTransition()

  const companyName = selectedCompany?.name ?? customCompany.trim()
  const question = selectedQuestion || customQuestion.trim()

  function onCreate() {
    setError(undefined)
    if (!companyName) return setError('Pick or type a company.')
    if (!question) return setError('Pick or type a 자소서 question.')

    startTransition(async () => {
      const result = await createCoverLetter({
        company: companyName,
        question,
        content: '',
        application_id: linkedAppId,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push(`/coverletter/${result.id}`)
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/coverletter"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Back to drafts
      </Link>

      {step === 1 && (
        <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Pick a company</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Each company has its own 자소서 question style. Pick from our curated list to get tone hints, or type your own.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {companies.map((c) => {
              const active = selectedCompany?.name === c.name
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setSelectedCompany(c)
                    setCustomCompany('')
                  }}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-colors',
                    active
                      ? 'border-amber-500/40 bg-amber-500/10'
                      : 'border-border/60 bg-card hover:border-foreground/20'
                  )}
                >
                  <p className="text-sm font-semibold">{c.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.notes}</p>
                </button>
              )
            })}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custom-company">Or type any company</Label>
            <Input
              id="custom-company"
              placeholder="e.g. Hyundai, NCSoft, SK Hynix"
              value={customCompany}
              onChange={(e) => {
                setCustomCompany(e.target.value)
                if (e.target.value) setSelectedCompany(null)
              }}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (!companyName) return setError('Pick or type a company.')
                setError(undefined)
                setStep(2)
              }}
              className="gap-1.5"
            >
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </>
      )}

      {step === 2 && (
        <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Which question are you answering?
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedCompany ? (
                <>Real questions from {selectedCompany.name}&apos;s 자소서 form. Pick one or paste a different one.</>
              ) : (
                <>Paste the exact question the company is asking. Specificity matters.</>
              )}
            </p>
          </div>

          {selectedCompany && selectedCompany.questions.length > 0 && (
            <div className="space-y-2">
              {selectedCompany.questions.map((q) => {
                const active = selectedQuestion === q
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setSelectedQuestion(q)
                      setCustomQuestion('')
                    }}
                    className={cn(
                      'block w-full rounded-lg border p-3 text-left text-sm leading-relaxed transition-colors',
                      active
                        ? 'border-amber-500/40 bg-amber-500/10'
                        : 'border-border/60 bg-card hover:border-foreground/20'
                    )}
                  >
                    {q}
                  </button>
                )
              })}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="custom-question">Or paste a different question</Label>
            <Textarea
              id="custom-question"
              placeholder="e.g. 본인의 가장 큰 실패 경험과 그것을 통해 배운 점을 기술해 주세요."
              value={customQuestion}
              onChange={(e) => {
                setCustomQuestion(e.target.value)
                if (e.target.value) setSelectedQuestion('')
              }}
              className="min-h-[80px] resize-none text-sm"
              maxLength={1000}
            />
          </div>

          {/* Optional link to internship application */}
          {applications.length > 0 && (
            <div className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="inline-flex items-center gap-1.5 text-xs">
                  <Link2 className="h-3.5 w-3.5 text-blue-400" />
                  Link to internship application
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                {linkedAppId && (
                  <button
                    type="button"
                    onClick={() => setLinkedAppId(null)}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {applications.slice(0, 6).map((a) => {
                  const active = linkedAppId === a.id
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setLinkedAppId(active ? null : a.id)}
                      className={cn(
                        'rounded-md border p-2 text-left text-xs transition-colors',
                        active
                          ? 'border-blue-500/40 bg-blue-500/10'
                          : 'border-border/60 bg-background hover:border-foreground/20'
                      )}
                    >
                      <p className="font-medium">{a.company_name}</p>
                      <p className="truncate text-muted-foreground">{a.role_title}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setStep(1)} disabled={isPending}>
              Back
            </Button>
            <Button onClick={onCreate} disabled={isPending || !question} className="gap-1.5">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Start writing
                </>
              )}
            </Button>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </>
      )}
    </div>
  )
}
