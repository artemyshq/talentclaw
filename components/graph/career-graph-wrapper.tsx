'use client'

import dynamic from 'next/dynamic'
import type { TimelineBranch } from '@/lib/timeline-data'

const CareerTimelineCanvas = dynamic(
  () => import('@/components/graph/career-timeline-canvas'),
  {
    ssr: false,
    loading: () => <div className="flex-1 bg-surface" />,
  },
)

export default function CareerGraphWrapper({
  branches,
}: {
  branches: TimelineBranch[]
}) {
  return <CareerTimelineCanvas branches={branches} />
}
