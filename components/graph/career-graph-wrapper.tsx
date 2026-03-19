'use client'

import dynamic from 'next/dynamic'
import type { CareerGraphData } from '@/lib/career-graph-data'

const CareerContextCanvas = dynamic(
  () => import('@/components/graph/career-context-canvas'),
  {
    ssr: false,
    loading: () => <div className="flex-1 bg-surface" />,
  },
)

export default function CareerGraphWrapper({
  data,
}: {
  data: CareerGraphData
}) {
  return <CareerContextCanvas data={data} />
}
