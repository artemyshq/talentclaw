'use client'

import dynamic from 'next/dynamic'
import type { GraphNode, GraphEdge } from './graph-types'

const CareerGraphCanvas = dynamic(
  () => import('@/components/graph/career-graph-canvas'),
  {
    ssr: false,
    loading: () => <div className="flex-1 bg-surface" />,
  },
)

export default function CareerGraphWrapper({
  nodes,
  edges,
}: {
  nodes: GraphNode[]
  edges: GraphEdge[]
}) {
  return <CareerGraphCanvas nodes={nodes} edges={edges} />
}
