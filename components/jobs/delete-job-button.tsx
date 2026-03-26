"use client"

import { useState, useTransition } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { deleteJobAction } from "@/app/actions/jobs"

interface DeleteJobButtonProps {
  slug: string
  jobTitle: string
  onDeleted?: () => void
}

export function DeleteJobButton({ slug, jobTitle, onDeleted }: DeleteJobButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteJobAction(slug)
      if (!result.error) {
        onDeleted?.()
      }
      setShowConfirm(false)
    })
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-muted mr-1">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="px-2.5 py-1 rounded-lg bg-danger text-white text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-2.5 py-1 rounded-lg bg-surface-overlay text-text-secondary text-xs hover:text-text-primary transition-colors cursor-pointer"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-red-50 transition-colors cursor-pointer"
      title={`Delete ${jobTitle}`}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}
