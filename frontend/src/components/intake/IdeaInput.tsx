// landing shell for the whole ui overhaul
// basically hero cursors on top then how it works then the idea to mrr story

import { useEffect, useRef, useState } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useIntakeAnimation } from '@/hooks/useAnimations'
import { clearSavedWorkspaceId, getSavedWorkspaceId } from '@/config/storage'
import { Button } from '@/components/ui/button'
import { AgentCursors } from '@/components/intake/AgentCursors'
import { AgentWorkGallery } from '@/components/intake/AgentWorkGallery'
import { CoFoundLogo } from '@/components/intake/OrbitalDiagram'
import { WorkspacePreview } from '@/components/intake/WorkspacePreview'
import { ApiError, apiFetch, warmApi } from '@/lib/api'

export function IdeaInput() {
  const [idea, setIdea] = useState('')
  const [resuming, setResuming] = useState(false)
  const [framing, setFraming] = useState(false)
  const [inputPulsing, setInputPulsing] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [resumeHint, setResumeHint] = useState<string | null>(null)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ready' | 'unavailable'>('checking')
  const [hasSavedWorkspace, setHasSavedWorkspace] = useState(() => Boolean(getSavedWorkspaceId()))
  const { createWorkspace, fetchWorkspace, loading, error } = useWorkspace()
  const containerRef = useIntakeAnimation()
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    let cancelled = false
    let activeController: AbortController | null = null
    let retryTimer: number | undefined
    const run = async () => {
      if (cancelled) return
      setBackendStatus((previous) => (previous === 'ready' ? previous : 'checking'))
      activeController = new AbortController()
      const ready = await warmApi(activeController.signal)
      if (cancelled) return
      setBackendStatus(ready ? 'ready' : 'unavailable')
      const savedId = getSavedWorkspaceId()
      if (ready && savedId) {
        try {
          await apiFetch(`/api/workspace/${savedId}`, { signal: activeController.signal, timeoutMs: 90_000 })
          if (!cancelled) setHasSavedWorkspace(true)
        } catch (caught) {
          if (cancelled) return
          if (caught instanceof ApiError && caught.status === 404) {
            clearSavedWorkspaceId()
            setHasSavedWorkspace(false)
            setSessionExpired(true)
          }
        }
      } else if (!savedId) setHasSavedWorkspace(false)
      if (!ready) retryTimer = window.setTimeout(() => void run(), 12_000)
    }
    void run()
    return () => { cancelled = true; activeController?.abort(); if (retryTimer !== undefined) window.clearTimeout(retryTimer) }
  }, [])

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault()
    if (!idea.trim() || loading || framing) return
    setFraming(true); setSessionExpired(false); setResumeHint(null)
    try { await Promise.all([createWorkspace(idea.trim()), new Promise((resolve) => window.setTimeout(resolve, 400))]) }
    finally { setFraming(false) }
  }

  const openSavedWorkspace = async () => {
    const savedId = getSavedWorkspaceId()
    if (!savedId) { setHasSavedWorkspace(false); return }
    setResuming(true); setSessionExpired(false); setResumeHint(null)
    try { await fetchWorkspace(savedId) }
    catch (caught) {
      const status = caught instanceof ApiError ? caught.status : undefined
      if (status === 404) { clearSavedWorkspaceId(); setHasSavedWorkspace(false); setSessionExpired(true) }
      else {
        setResumeHint(status === 502 || status === 503 || status === 504 ? 'The workspace service is waking up. Try again in a moment.' : 'Could not reopen your workspace yet. Check your connection and try again.')
        void warmApi().then((ready) => setBackendStatus(ready ? 'ready' : 'unavailable'))
      }
    } finally { setResuming(false) }
  }

  const handleGetStarted = async () => {
    if (hasSavedWorkspace || getSavedWorkspaceId()) { await openSavedWorkspace(); return }
    if (idea.trim()) { await handleSubmit(); return }
    const input = formRef.current?.querySelector<HTMLInputElement>('input')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    input?.focus(); setInputPulsing(true); window.setTimeout(() => setInputPulsing(false), 700)
  }

  const busy = loading || framing || resuming
  const ctaLabel = resuming ? 'Opening...' : framing ? 'Starting...' : hasSavedWorkspace ? 'Open workspace' : 'Get started'

  return (
    <div ref={containerRef} className="landing-page relative min-h-dvh overflow-x-hidden bg-background">
      <div className="landing-grain pointer-events-none fixed inset-0 z-0" aria-hidden />
      <header className="intake-nav relative z-40 mx-auto flex w-full max-w-[1320px] items-center justify-between px-6 py-6 md:px-10 md:py-8">
        <div className="flex items-center gap-3"><CoFoundLogo markClassName="size-7 text-primary md:size-8" /><span className="text-base font-semibold tracking-[-0.03em] text-foreground md:text-lg">CoFound</span></div>
        <Button type="button" onClick={() => void handleGetStarted()} disabled={busy} className="intake-nav-btn h-9 gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 text-xs text-primary hover:bg-primary hover:text-primary-foreground">{(resuming || (framing && !idea.trim())) && <span className="size-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />}{ctaLabel}</Button>
      </header>

      <main className="relative z-30 mx-auto w-full max-w-[1320px] px-6 pb-24 md:px-10">
        <section className="centered-hero relative mx-auto flex min-h-[560px] w-full max-w-[1320px] flex-col items-center pt-6 text-center md:min-h-[620px] md:pt-8">
          {/* colored agent cursors parked in the side gutters so they dont sit under the bar */}
          <AgentCursors targetRef={formRef} />
          <div className="relative z-10 flex w-full max-w-4xl flex-col items-center">
            <p className="intake-hero-badge mb-5"><span>AI founder operating system</span></p>
            <h1 className="intake-hero-title font-display max-w-[850px] text-[clamp(3.55rem,6.7vw,6.65rem)] leading-[0.91] tracking-[-0.06em] text-foreground">Your AI co-founder<br />for every step of <em>your journey.</em></h1>
            <p className="intake-hero-sub mt-5 max-w-[590px] text-[15px] leading-7 text-muted-foreground md:text-base">Specialized agents work in parallel: researching markets, validating assumptions, building your product, and scaling growth — all from one idea.</p>

            {(framing || resuming) && <div className="mt-2 flex items-center gap-3 rounded-lg border border-primary/30 bg-card/80 px-4 py-3 text-left text-sm text-foreground" role="status" aria-live="polite"><span className="size-4 shrink-0 animate-spin rounded-full border-2 border-primary/25 border-t-primary" /><span><strong className="block font-medium">{resuming ? 'Opening your workspace' : 'Building your workspace'}</strong><span className="text-xs text-muted-foreground">{resuming ? 'Restoring your graph and latest agent progress...' : 'Framing the idea and preparing your first decision point...'}</span></span></div>}
            {!framing && !resuming && backendStatus === 'checking' && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground" role="status"><span className="size-3 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />Checking workspace service...</p>}
            {!framing && !resuming && backendStatus === 'unavailable' && <p className="mt-3 text-xs text-amber-200/90" role="status">Workspace service is waking up. You can type now; we will retry when you continue.</p>}
            {sessionExpired && <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">Your previous session has expired. Enter a new idea to start fresh.</div>}
            {resumeHint && <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">{resumeHint}</div>}

            <form ref={formRef} onSubmit={(event) => void handleSubmit(event)} className="intake-input-shell relative z-20 mt-5 w-full max-w-[570px]">
              <div className={`flex items-center gap-3 rounded-xl border bg-surface/90 p-2 pl-4 shadow-[0_16px_50px_rgba(0,0,0,.16)] transition-all duration-300 ${inputPulsing ? 'border-primary ring-2 ring-primary/50' : 'border-border'}`}>
                <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-primary" aria-hidden><path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11 6.5 7.5 3 6l3.5-1.5L8 1Z" fill="currentColor" /></svg>
                <input type="text" value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="Describe your startup idea in a sentence or two..." className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" autoFocus disabled={busy} />
                <Button type="submit" disabled={!idea.trim() || busy} className="h-10 shrink-0 gap-2 rounded-lg bg-primary px-5 text-sm text-primary-foreground hover:bg-primary/90">{(loading || framing) && <span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />}{loading || framing ? 'Framing...' : 'Continue'}{!loading && !framing && <span aria-hidden>→</span>}</Button>
              </div>
              {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
              {hasSavedWorkspace && !resuming && !framing && <p className="mt-3 text-xs text-muted-foreground">Already set up? <button type="button" onClick={() => void openSavedWorkspace()} disabled={busy} className="font-medium text-primary underline-offset-2 hover:underline disabled:opacity-60">Open your last workspace</button></p>}
            </form>
          </div>
        </section>

        {/* the whole five agents into one workspace beat */}
        <AgentWorkGallery />
        {/* idea to mrr scrub which is where the story actually lands */}
        <WorkspacePreview />
      </main>
    </div>
  )
}
