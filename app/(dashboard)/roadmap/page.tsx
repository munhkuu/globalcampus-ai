import { RoadmapClient } from '@/components/roadmap/RoadmapClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Career Roadmap',
}

export default function RoadmapPage() {
  return <RoadmapClient />
}
