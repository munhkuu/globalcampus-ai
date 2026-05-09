import { ExplainerClient } from '@/components/explainer/ExplainerClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lecture Explainer',
}

export default function ExplainerPage() {
  return <ExplainerClient />
}
