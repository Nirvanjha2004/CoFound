// hero agent cursors hanging in the side gutters and they nudge away when ur mouse gets close
// no more center orb just these colored pointers aiming at the idea bar

import { useEffect, useRef, type RefObject } from 'react'
import { gsap } from '@/lib/gsap'
import { CursorLabel, CursorPointerIcon } from '@/components/cursor/CursorLabel'

// tip of the pointer svg sits upper left so we spin it to aim along travel
const POINTER_ANGLE_OFFSET = 135
const FLEE_RADIUS = 100
// just a little sideways when ur cursor gets close
const NUDGE_PX = 20
// leave room becoz the tip was getting shaved when it rotates
const LEFT_EDGE_PAD = 36
const RIGHT_EDGE_PAD = 118

type AgentSpec = {
  id: string
  label: string
  color: string
  // park in the side gutters never under the bar
  side: 'left' | 'right'
  // 0 near the search bar 1 up by the headline
  rise: number
  // 0 closer to the copy 1 nearer the screen edge
  gutter: number
  driftX: number
  driftY: number
}

const AGENTS: AgentSpec[] = [
  {
    id: 'orchestrator',
    label: 'Orchestrator',
    color: '#c96442',
    side: 'left',
    rise: 0.9,
    gutter: 0.92,
    driftX: 8,
    driftY: 5,
  },
  {
    id: 'researcher',
    label: 'Researcher',
    color: '#4a8eff',
    side: 'left',
    rise: 0.52,
    gutter: 0.96,
    driftX: 10,
    driftY: 4,
  },
  {
    id: 'validator',
    label: 'Validator',
    color: '#5fb87a',
    side: 'left',
    rise: 0.14,
    gutter: 0.88,
    driftX: 8,
    driftY: -3,
  },
  {
    id: 'builder',
    label: 'Builder',
    color: '#6366f1',
    side: 'right',
    rise: 0.86,
    gutter: 0.92,
    driftX: -8,
    driftY: 5,
  },
  {
    id: 'growth',
    label: 'Growth',
    color: '#22c55e',
    side: 'right',
    rise: 0.48,
    gutter: 0.96,
    driftX: -10,
    driftY: 4,
  },
  {
    id: 'market',
    label: 'Market',
    color: '#d9a441',
    side: 'right',
    rise: 0.12,
    gutter: 0.88,
    driftX: -8,
    driftY: -3,
  },
]

// one labeled pointer tip basically
function AgentCursor({
  label,
  color,
  agentId,
}: {
  label: string
  color: string
  agentId: string
}) {
  return (
    <div className="agent-cursor absolute left-0 top-0" data-agent={agentId}>
      <div className="agent-cursor-inner relative">
        <div className="agent-cursor-pointer origin-top-left">
          <CursorPointerIcon color={color} size={24} />
        </div>
        <div className="agent-cursor-label absolute left-5 top-5">
          <CursorLabel label={label} color={color} />
        </div>
      </div>
    </div>
  )
}

type AgentCursorsProps = {
  // the idea form we aim at and keep clear of
  targetRef?: RefObject<HTMLElement | null>
}

// bumps when the effect reboots so old raf loops die off
let animEpoch = 0

export function AgentCursors({ targetRef }: AgentCursorsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999, active: false })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true }
    }
    const onLeave = () => {
      mouseRef.current.active = false
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  useEffect(() => {
    const layer = containerRef.current
    if (!layer) return

    const epoch = ++animEpoch
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let resizeTimer = 0

    type Rt = {
      el: HTMLElement
      inner: HTMLElement
      pointer: HTMLElement
      agent: AgentSpec
      homeX: number
      homeY: number
      nudgeX: number
      baseAngle: number
      driftPhase: number
      bobPhase: number
    }

    const runtimes: Rt[] = []

    // park each cursor in the outer margins clear of the centered copy basically
    const layoutHomes = () => {
      const layerRect = layer.getBoundingClientRect()
      const targetRect = targetRef?.current?.getBoundingClientRect()
      if (!targetRect || targetRect.width < 40) return

      const formLeft = targetRect.left - layerRect.left
      const formRight = targetRect.right - layerRect.left
      const formCy = targetRect.top - layerRect.top + targetRect.height / 2
      const bandTop = Math.max(56, formCy - 280)
      const bandBottom = formCy - 8
      const contentPad = 36
      const leftGutterW = Math.max(72, formLeft - contentPad)
      const rightGutterW = Math.max(72, layerRect.width - formRight - contentPad)

      for (const rt of runtimes) {
        const edgeInset = LEFT_EDGE_PAD + (1 - rt.agent.gutter) * 24
        const xLeft = edgeInset + (1 - rt.agent.gutter) * Math.max(0, leftGutterW * 0.28)
        const xRight =
          layerRect.width -
          RIGHT_EDGE_PAD -
          edgeInset -
          (1 - rt.agent.gutter) * Math.max(0, rightGutterW * 0.28)

        rt.homeX =
          rt.agent.side === 'left'
            ? Math.max(LEFT_EDGE_PAD, Math.min(formLeft - 64, xLeft))
            : Math.max(formRight + 40, Math.min(layerRect.width - RIGHT_EDGE_PAD, xRight))

        rt.homeY = bandBottom - rt.agent.rise * (bandBottom - bandTop)
        rt.homeY = Math.max(bandTop, Math.min(bandBottom, rt.homeY))

        // tip points at the middle of the idea bar
        const aimX = formLeft + targetRect.width / 2 - rt.homeX
        const aimY = formCy - rt.homeY
        rt.baseAngle = (Math.atan2(aimY, aimX) * 180) / Math.PI + POINTER_ANGLE_OFFSET
      }
    }

    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(layoutHomes, 80)
    }

    // soft drift and bob and a shy nudge when the real mouse gets close
    const tick = (now: number) => {
      if (epoch !== animEpoch) return

      const mouse = mouseRef.current
      const layerRect = layer.getBoundingClientRect()
      const t = now / 1000

      for (const rt of runtimes) {
        const homeTipX = layerRect.left + rt.homeX
        const homeTipY = layerRect.top + rt.homeY
        const near =
          mouse.active &&
          Math.hypot(homeTipX - mouse.x, homeTipY - mouse.y) < FLEE_RADIUS

        const targetNudge = near ? (mouse.x < homeTipX ? NUDGE_PX : -NUDGE_PX) : 0
        rt.nudgeX += (targetNudge - rt.nudgeX) * 0.35

        const driftX = reduceMotion ? 0 : Math.sin(t * 0.7 + rt.driftPhase) * rt.agent.driftX
        const driftY = reduceMotion ? 0 : Math.cos(t * 0.55 + rt.driftPhase) * rt.agent.driftY
        const bob = reduceMotion ? 1 : 1 + Math.sin(t * 1.4 + rt.bobPhase) * 0.03
        const wobble = reduceMotion ? 0 : Math.sin(t * 0.9 + rt.bobPhase) * 6

        // clamp so nudge and drift dont shove tips past the edge again
        const rawX = rt.homeX + driftX + rt.nudgeX
        const x =
          rt.agent.side === 'left'
            ? Math.max(LEFT_EDGE_PAD - 8, rawX)
            : Math.min(layerRect.width - RIGHT_EDGE_PAD, rawX)
        const y = rt.homeY + driftY
        const angle = rt.baseAngle + wobble

        rt.el.style.transform = `translate3d(${x}px, ${y}px, 0)`
        rt.inner.style.transform = `scale(${bob})`
        rt.pointer.style.transform = `rotate(${angle}deg)`
      }

      raf = window.requestAnimationFrame(tick)
    }

    const boot = () => {
      if (epoch !== animEpoch) return
      if (layer.clientWidth < 40 || layer.clientHeight < 40 || !targetRef?.current) {
        raf = window.requestAnimationFrame(boot)
        return
      }

      const nodes = Array.from(layer.querySelectorAll<HTMLElement>('.agent-cursor'))
      nodes.forEach((el, i) => {
        const agent = AGENTS[i]
        const inner = el.querySelector<HTMLElement>('.agent-cursor-inner')
        const pointer = el.querySelector<HTMLElement>('.agent-cursor-pointer')
        if (!agent || !inner || !pointer) return

        gsap.killTweensOf(inner)
        el.style.left = '0px'
        el.style.top = '0px'

        runtimes.push({
          el,
          inner,
          pointer,
          agent,
          homeX: 0,
          homeY: 0,
          nudgeX: 0,
          baseAngle: POINTER_ANGLE_OFFSET,
          driftPhase: i * 1.1,
          bobPhase: i * 0.7,
        })

        inner.style.opacity = '0'
        gsap.to(inner, {
          opacity: 1,
          duration: reduceMotion ? 0.01 : 0.6,
          delay: 0.3 + i * 0.1,
          ease: 'power2.out',
        })
      })

      layoutHomes()
      window.addEventListener('resize', onResize)
      raf = window.requestAnimationFrame(tick)
    }

    raf = window.requestAnimationFrame(boot)

    return () => {
      animEpoch += 1
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.clearTimeout(resizeTimer)
      runtimes.forEach((rt) => gsap.killTweensOf(rt.inner))
    }
  }, [targetRef])

  return (
    <div
      ref={containerRef}
      className="agent-cursors-layer pointer-events-none absolute inset-0 z-[60] overflow-visible"
      aria-hidden
    >
      {AGENTS.map((agent) => (
        <AgentCursor
          key={agent.id}
          agentId={agent.id}
          label={agent.label}
          color={agent.color}
        />
      ))}
    </div>
  )
}
