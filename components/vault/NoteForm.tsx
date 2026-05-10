'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createVaultNote, updateVaultNote } from '@/lib/actions/vault'
import { vaultNoteSchema, type VaultNoteInput } from '@/lib/utils/validators'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useToast } from '@/components/ui/use-toast'
import type { VaultNote } from '@/lib/types/app.types'

interface NoteFormProps {
  open: boolean
  onClose: () => void
  initialData?: VaultNote | null
}

export function NoteForm({ open, onClose, initialData }: NoteFormProps) {
  const isEdit = !!initialData
  const router = useRouter()
  const { toast } = useToast()
  const [serverError, setServerError] = useState<string>()
  const [isPending, startTransition] = useTransition()

  const form = useForm<VaultNoteInput>({
    resolver: zodResolver(vaultNoteSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      content: initialData?.content ?? '',
      tagsRaw: initialData?.tags?.join(', ') ?? '',
    },
  })

  function handleClose() {
    form.reset()
    setServerError(undefined)
    onClose()
  }

  function onSubmit(values: VaultNoteInput) {
    setServerError(undefined)
    startTransition(async () => {
      const tags = (values.tagsRaw ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const result = isEdit
        ? await updateVaultNote(initialData.id, {
            title: values.title,
            content: values.content ?? '',
            tags,
          })
        : await createVaultNote({
            title: values.title,
            content: values.content ?? '',
            tags,
            source: 'manual',
          })

      if (result?.error) {
        setServerError(result.error)
        return
      }

      toast({ title: isEdit ? 'Note updated' : 'Note saved', description: values.title })
      handleClose()
      router.refresh()
    })
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="flex flex-col overflow-y-auto sm:max-w-lg">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>{isEdit ? 'Edit note' : 'New note'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Update this vault note.' : 'Add a note to your Study Vault.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-5 px-6 pb-6 pt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Binary Search Tree — Explained" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Your notes, explanation, code snippets…"
                      className="min-h-[240px] resize-none font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tagsRaw"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="algorithms, dynamic-programming, interview"
                      {...field}
                      value={typeof field.value === 'string' ? field.value : ''}
                    />
                  </FormControl>
                  <FormDescription>Comma-separated</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serverError && (
              <p className="text-xs text-destructive">{serverError}</p>
            )}

            <div className="mt-auto flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add note'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
