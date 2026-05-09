'use client'

import { useState, useTransition } from 'react'
import { BookOpen, Save, Check } from 'lucide-react'
import { createVaultNote } from '@/lib/actions/vault'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import type { ExplainerResponse } from '@/lib/ai/provider'

interface ExplanationOutputProps {
  result: ExplainerResponse
  codeLanguage: string
}

export function ExplanationOutput({ result, codeLanguage }: ExplanationOutputProps) {
  const { toast } = useToast()
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSaveToVault() {
    startTransition(async () => {
      const content = buildMarkdown(result, codeLanguage)
      const res = await createVaultNote({
        title: result.concept,
        content,
        tags: ['ai-generated', 'explainer'],
        source: 'AI-Generated',
      })
      if (res?.error) {
        toast({ title: 'Save failed', description: res.error, variant: 'destructive' })
      } else {
        setSaved(true)
        toast({ title: 'Saved to Vault', description: result.concept })
      }
    })
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{result.concept}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveToVault}
          disabled={isPending || saved}
          className="shrink-0"
        >
          {saved ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
              Saved
            </>
          ) : (
            <>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Save to Vault
            </>
          )}
        </Button>
      </div>

      {/* Explanation */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="leading-relaxed text-sm text-foreground/90 whitespace-pre-line">
          {result.explanation}
        </p>
      </div>

      {/* Key points */}
      {result.keyPoints.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Key Points
          </h3>
          <ul className="space-y-1.5">
            {result.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Code example */}
      {result.codeExample && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Code Example — {codeLanguage}
          </h3>
          <pre className="overflow-x-auto rounded-lg bg-muted/60 p-4 text-xs font-mono leading-relaxed">
            <code>{result.codeExample.replace(/\\n/g, '\n')}</code>
          </pre>
        </div>
      )}

      {/* Korean terms */}
      {result.koreanTerms.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Korean Terms
          </h3>
          <div className="space-y-1.5">
            {result.koreanTerms.map((term, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
              >
                <span className="font-medium">{term.korean}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-muted-foreground">{term.english}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related concepts */}
      {result.relatedConcepts.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Explore Next
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.relatedConcepts.map((concept, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                <BookOpen className="mr-1 h-3 w-3" />
                {concept}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function buildMarkdown(result: ExplainerResponse, lang: string): string {
  const lines: string[] = [
    `# ${result.concept}`,
    '',
    result.explanation,
    '',
    '## Key Points',
    ...result.keyPoints.map((p) => `- ${p}`),
  ]

  if (result.codeExample) {
    lines.push('', `## Code Example`, '', `\`\`\`${lang.toLowerCase()}`, result.codeExample.replace(/\\n/g, '\n'), '```')
  }

  if (result.koreanTerms.length > 0) {
    lines.push('', '## Korean Terms', '', '| Korean | English |', '|--------|---------|')
    result.koreanTerms.forEach((t) => lines.push(`| ${t.korean} | ${t.english} |`))
  }

  if (result.relatedConcepts.length > 0) {
    lines.push('', '## Related Concepts', '', result.relatedConcepts.join(', '))
  }

  return lines.join('\n')
}
