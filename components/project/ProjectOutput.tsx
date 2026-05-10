'use client'

import { useState, useTransition } from 'react'
import { Check, ChevronDown, ChevronRight, Copy, Save } from 'lucide-react'
import { createVaultNote } from '@/lib/actions/vault'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils/cn'
import type { ProjectResponse, ProjectFile } from '@/lib/ai/provider'

interface ProjectOutputProps {
  result: ProjectResponse
}

export function ProjectOutput({ result }: ProjectOutputProps) {
  const { toast } = useToast()
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [expandedFile, setExpandedFile] = useState<number | null>(0)

  function handleSaveToVault() {
    startTransition(async () => {
      const content = buildMarkdown(result)
      const res = await createVaultNote({
        title: result.title,
        content,
        tags: ['ai-generated', 'project'],
        source: 'AI-Generated',
      })
      if (res?.error) {
        toast({ title: 'Save failed', description: res.error, variant: 'destructive' })
      } else {
        setSaved(true)
        toast({ title: 'Saved to Vault', description: result.title })
      }
    })
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{result.title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{result.description}</p>
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

      {/* Stack */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Stack
        </h3>
        <div className="flex flex-wrap gap-2">
          {result.stack.map((tech, i) => (
            <Badge key={i} variant="secondary" className="text-xs">{tech}</Badge>
          ))}
        </div>
      </div>

      {/* Files */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Files ({result.files.length})
        </h3>
        <div className="space-y-2">
          {result.files.map((file, i) => (
            <FileBlock
              key={i}
              file={file}
              isExpanded={expandedFile === i}
              onToggle={() => setExpandedFile(expandedFile === i ? null : i)}
            />
          ))}
        </div>
      </div>

      {/* Run instructions */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          How to Run
        </h3>
        <pre className="overflow-x-auto rounded-lg bg-muted/60 p-4 text-xs font-mono leading-relaxed">
          <code>{result.runInstructions.replace(/\\n/g, '\n')}</code>
        </pre>
      </div>

      {/* Next steps */}
      {result.nextSteps.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Next Steps
          </h3>
          <ul className="space-y-1.5">
            {result.nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function FileBlock({
  file,
  isExpanded,
  onToggle,
}: {
  file: ProjectFile
  isExpanded: boolean
  onToggle: () => void
}) {
  const [copied, setCopied] = useState(false)
  const content = file.content.replace(/\\n/g, '\n')

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <code className="text-xs font-mono font-medium truncate">{file.filename}</code>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{file.description}</span>
      </button>

      {isExpanded && (
        <div className="border-t">
          <div className="flex items-center justify-end px-3 py-1.5 bg-muted/20">
            <button
              onClick={handleCopy}
              className={cn(
                'flex items-center gap-1 text-xs transition-colors',
                copied ? 'text-emerald-500' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed bg-muted/60">
            <code>{content}</code>
          </pre>
        </div>
      )}
    </div>
  )
}

function buildMarkdown(result: ProjectResponse): string {
  const lines: string[] = [
    `# ${result.title}`,
    '',
    result.description,
    '',
    `**Stack:** ${result.stack.join(', ')}`,
    '',
  ]

  result.files.forEach((f) => {
    const ext = f.filename.split('.').pop() ?? ''
    lines.push(`## \`${f.filename}\``)
    lines.push('')
    lines.push(`_${f.description}_`)
    lines.push('')
    lines.push(`\`\`\`${ext}`)
    lines.push(f.content.replace(/\\n/g, '\n'))
    lines.push('```')
    lines.push('')
  })

  lines.push('## How to Run', '', '```sh', result.runInstructions.replace(/\\n/g, '\n'), '```', '')

  if (result.nextSteps.length > 0) {
    lines.push('## Next Steps', '', ...result.nextSteps.map((s) => `- ${s}`))
  }

  return lines.join('\n')
}
