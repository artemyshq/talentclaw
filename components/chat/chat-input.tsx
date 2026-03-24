"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { ArrowUp, Plus, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react"

type AttachedFile = {
  file: File
  name: string
  uploading: boolean
  path?: string
  error?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return <ImageIcon className="w-3.5 h-3.5 shrink-0" />
  }
  return <FileText className="w-3.5 h-3.5 shrink-0" />
}

export function ChatInput({
  onSend,
  disabled = false,
  autoFocus = false,
}: {
  onSend: (text: string) => void
  disabled?: boolean
  autoFocus?: boolean
}) {
  const [value, setValue] = useState("")
  const [attachments, setAttachments] = useState<AttachedFile[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`
  }, [])

  useEffect(() => {
    resize()
  }, [value, resize])

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadError(null)

    const newAttachments: AttachedFile[] = Array.from(files).map((f) => ({
      file: f,
      name: f.name,
      uploading: true,
    }))

    setAttachments((prev) => [...prev, ...newAttachments])

    // Upload all files
    const formData = new FormData()
    for (const f of files) {
      formData.append("files", f)
    }

    try {
      const res = await fetch("/api/chat-upload", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) {
        setUploadError(data.error || "Upload failed")
        setAttachments((prev) =>
          prev.map((a) =>
            newAttachments.some((n) => n.name === a.name && a.uploading)
              ? { ...a, uploading: false, error: data.error }
              : a
          )
        )
        return
      }

      // Match returned files to attachments by name
      const uploaded: Record<string, string> = {}
      for (const f of data.files) {
        uploaded[f.name] = f.path
      }

      setAttachments((prev) =>
        prev.map((a) =>
          a.uploading && uploaded[a.name]
            ? { ...a, uploading: false, path: uploaded[a.name] }
            : a
        )
      )
    } catch {
      setUploadError("Upload failed. Please try again.")
      setAttachments((prev) =>
        prev.map((a) => (a.uploading ? { ...a, uploading: false, error: "Upload failed" } : a))
      )
    }
  }, [])

  const removeAttachment = useCallback((name: string) => {
    setAttachments((prev) => prev.filter((a) => a.name !== name))
    setUploadError(null)
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    const successfulAttachments = attachments.filter((a) => a.path && !a.error)
    if (!trimmed && successfulAttachments.length === 0) return

    // Any still uploading? Wait.
    if (attachments.some((a) => a.uploading)) return

    // Compose message with attachment info
    let message = trimmed
    if (successfulAttachments.length > 0) {
      const fileLines = successfulAttachments
        .map((a) => `- ${a.name} → ${a.path}`)
        .join("\n")
      const prefix = `[Attached files]\n${fileLines}\n\n`
      message = prefix + message
    }

    onSend(message)
    setValue("")
    setAttachments([])
    setUploadError(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, attachments, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const hasAttachments = attachments.length > 0
  const isUploading = attachments.some((a) => a.uploading)
  const canSend = (value.trim().length > 0 || attachments.some((a) => a.path)) && !isUploading

  return (
    <div
      className="bg-surface-raised border border-border-subtle rounded-2xl
        focus-within:border-accent/30 transition-colors shadow-sm"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Attachment chips */}
      {hasAttachments && (
        <div className="flex flex-wrap gap-2 px-4 pt-3">
          {attachments.map((a) => (
            <div
              key={a.name}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                ${a.error
                  ? "bg-danger/8 text-danger"
                  : "bg-surface-overlay text-text-secondary"
                }`}
            >
              {a.uploading ? (
                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
              ) : (
                fileIcon(a.name)
              )}
              <span className="truncate max-w-[160px]">{a.name}</span>
              <span className="text-text-muted">{formatFileSize(a.file.size)}</span>
              <button
                type="button"
                onClick={() => removeAttachment(a.name)}
                className="ml-0.5 p-0.5 rounded hover:bg-surface-raised transition-colors cursor-pointer"
                aria-label={`Remove ${a.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div className="px-4 pt-2 text-xs text-danger">{uploadError}</div>
      )}

      {/* Textarea area */}
      <div className="px-5 pt-4 pb-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Type your next message..." : "How can I help you today?"}
          autoFocus={autoFocus}
          rows={1}
          className="w-full resize-none bg-transparent text-base text-text-primary placeholder:text-text-muted
            outline-none min-h-[28px] max-h-[192px] leading-7"
          aria-label="Chat message input"
        />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.docx,.doc,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.gif,.webp,.svg,.xls,.xlsx,.rtf,.html"
        onChange={(e) => {
          handleFileSelect(e.target.files)
          // Reset so same file can be re-selected
          e.target.value = ""
        }}
      />

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between px-3 pb-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all
            ${disabled
              ? "bg-surface-overlay text-text-muted cursor-not-allowed"
              : "bg-surface-overlay text-text-muted hover:bg-accent hover:text-white active:scale-95 cursor-pointer"
            }
          `}
          aria-label="Attach files"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all
            ${canSend
              ? "bg-accent text-white hover:bg-accent-hover active:scale-95"
              : "bg-surface-overlay text-text-muted cursor-not-allowed"
            }
          `}
          aria-label={disabled ? "Queue message" : "Send message"}
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
