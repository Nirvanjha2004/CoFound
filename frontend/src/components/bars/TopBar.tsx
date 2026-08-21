import { Compass } from 'lucide-react'
import { useMemo } from 'react'
import { useGoHome } from '@/hooks/useGoHome'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Average confidence across unlocked nodes — matches what users see as progress. */
function graphHealth(workspace: { nodes: { status: string; confidence: number }[] } | null) {
  if (!workspace?.nodes.length) return 0
  const unlocked = workspace.nodes.filter((n) => n.status !== 'locked')
  const pool = unlocked.length > 0 ? unlocked : workspace.nodes
  return Math.round(pool.reduce((sum, n) => sum + n.confidence, 0) / pool.length)
}

export function TopBar() {
  const goHome = useGoHome()
  const { workspace, setOnboardingOpen } = useWorkspaceStore()
  const score = useMemo(() => graphHealth(workspace), [workspace])

  const healthColor =
    score >= 70 ? 'bg-status-validated' : score >= 50 ? 'bg-status-needs-work' : 'bg-status-blocking'

  return (
    <header className="shell-panel flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={goHome}
          className="shrink-0 text-sm font-medium text-foreground transition-colors hover:text-primary"
        >
          CoFound
        </button>
        <span className="h-3 w-px shrink-0 bg-border" aria-hidden />
        <span className="truncate text-sm text-muted-foreground">
          {workspace?.workspace_name ?? 'Workspace'}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div
          className="flex items-center gap-2 rounded-md bg-surface-elevated px-2.5 py-1"
          title="Average confidence across unlocked graph nodes"
        >
          <span className="hidden text-xs text-muted-foreground sm:inline">Graph health</span>
          <span className="text-sm font-medium tabular-nums text-foreground">{score}</span>
          <span className={cn('size-2 rounded-full', healthColor)} aria-label="Graph health status" />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          onClick={() => setOnboardingOpen(true)}
          aria-label="Open guide"
        >
          <Compass className="size-4" />
        </Button>
      </div>
    </header>
  )
}
