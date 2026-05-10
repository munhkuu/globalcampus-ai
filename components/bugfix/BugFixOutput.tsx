'use client'

import { useState, useTransition } from 'react'
import { Check, Copy, Save } from 'lucide-react'
import { createVaultNote } from '@/lib/actions/vault'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import type { BugFixResponse } from '@/lib/ai/provider'

interface BugFixOutputProps {
  result: BugFixResponse
}

export function BugFixOutput({ result }: BugFixOutputProps) {
  const { toast } = useToast()
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const fixedCode = result.fixedCode.replace(/\\n/g, '\n')

  function handleCopy() {
    navigator.clipboard.writeText(fixedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSaveToVault() {
    startTransition(async () => {
      const content = buildMarkdown(result)
      const res = await createVaultNote({
        title: `Bug Fix: ${result.originalIssue.slice(0, 60)}`,
        content,
        tags: ['ai-generated', 'bugfix'],
        source: 'AI-Generated',
      })
      if (res?.error) {
        toast({ title: 'Save failed', description: res.error, variant: 'destructive' })
      } else {
        setSaved(true)
        toast({ title: 'Saved to Vault' })
      }
    })
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Fixed</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{result.originalIssue}</p>
        </div>
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

      {/* Fixed code */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Fixed Code — {result.language}
          </h3>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-muted/60 p-4 text-xs font-mono leading-relaxed">
          <code>{fixedCode}</code>
        </pre>
      </div>

      {/* Changes */}
      {result.changes.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Changes Made
          </h3>
          <ul className="space-y-1.5">
            {result.changes.map((change, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {change}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Explanation */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Why It Happened
        </h3>
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
          {result.explanation}
        </p>
      </div>

      {/* Tips */}
      {result.tips.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Tips to Avoid This
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.tips.map((tip, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tip}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function buildMarkdown(result: BugFixResponse): string {
  const lines: string[] = [
    `# Bug Fix: ${result.originalIssue}`,
    '',
    `**Language:** ${result.language}`,
    '',
    '## Fixed Code',
    '',
    `\`\`\`${result.language.toLowerCase()}`,
    result.fixedCode.replace(/\\n/g, '\n'),
    '```',
    '',
    '## Changes Made',
    ...result.changes.map((c) => `- ${c}`),
    '',
    '## Why It Happened',
    '',
    result.explanation,
    '',
    '## Tips',
    ...result.tips.map((t) => `- ${t}`),
  ]
  return lines.join('\n')
}
