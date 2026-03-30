'use client'

import { useEffect, useRef, useState } from 'react'
import { BookOpen, Database, ScanSearch } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const moduleViews = {
  intro: {
    label: '工具介绍',
    icon: BookOpen,
    src: '/skillpecker/index.html?embed=1#home',
    fallbackHeight: 2100,
  },
  console: {
    label: '扫描控制台',
    icon: ScanSearch,
    src: '/skillpecker/index.html?embed=1&section=console#scan',
    fallbackHeight: 1180,
  },
  library: {
    label: '恶意技能库',
    icon: Database,
    src: '/skillpecker/index.html?embed=1#library',
    fallbackHeight: 1520,
  },
} as const

type ModuleViewKey = keyof typeof moduleViews

const initialHeights = Object.fromEntries(
  Object.entries(moduleViews).map(([key, item]) => [key, item.fallbackHeight])
) as Record<ModuleViewKey, number>

export default function SkillPeckerPage() {
  const tabsBarRef = useRef<HTMLDivElement | null>(null)
  const iframeRefs = useRef<Partial<Record<ModuleViewKey, HTMLIFrameElement | null>>>({})
  const observerCleanupRefs = useRef<Partial<Record<ModuleViewKey, () => void>>>({})
  const wheelCleanupRefs = useRef<Partial<Record<ModuleViewKey, () => void>>>({})
  const modalFrameKeyRef = useRef<ModuleViewKey | null>(null)

  const [activeTab, setActiveTab] = useState<ModuleViewKey>('intro')
  const [frameHeights, setFrameHeights] = useState<Record<ModuleViewKey, number>>(initialHeights)
  const [modalFrameKey, setModalFrameKey] = useState<ModuleViewKey | null>(null)
  const [viewportHeight, setViewportHeight] = useState(0)

  useEffect(() => {
    modalFrameKeyRef.current = modalFrameKey
  }, [modalFrameKey])

  useEffect(() => {
    const syncViewportHeight = () => setViewportHeight(window.innerHeight)
    syncViewportHeight()

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return
      }

      const payload = event.data
      if (!payload || payload.type !== 'skillpecker:modal-state') {
        return
      }

      const matchedKey = (Object.keys(moduleViews) as ModuleViewKey[]).find(
        (key) => iframeRefs.current[key]?.contentWindow === event.source
      )

      if (!matchedKey) {
        return
      }

      if (payload.open) {
        setModalFrameKey(matchedKey)
        iframeRefs.current[matchedKey]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      } else {
        setModalFrameKey((current) => (current === matchedKey ? null : current))
        window.requestAnimationFrame(() => updateFrameHeight(matchedKey))
      }
    }

    window.addEventListener('resize', syncViewportHeight)
    window.addEventListener('message', onMessage)

    return () => {
      Object.values(observerCleanupRefs.current).forEach((cleanup) => cleanup?.())
      Object.values(wheelCleanupRefs.current).forEach((cleanup) => cleanup?.())
      window.removeEventListener('resize', syncViewportHeight)
      window.removeEventListener('message', onMessage)
    }
  }, [])

  const updateFrameHeight = (key: ModuleViewKey) => {
    const iframe = iframeRefs.current[key]
    const doc = iframe?.contentDocument
    if (!iframe || !doc) {
      return
    }

    const nextHeight = Math.max(
      doc.documentElement?.scrollHeight ?? 0,
      doc.body?.scrollHeight ?? 0,
      moduleViews[key].fallbackHeight
    )

    setFrameHeights((current) => {
      if (Math.abs(current[key] - nextHeight) < 2) {
        return current
      }

      return {
        ...current,
        [key]: nextHeight,
      }
    })
  }

  const bindFrame = (key: ModuleViewKey, iframe: HTMLIFrameElement | null) => {
    iframeRefs.current[key] = iframe
  }

  const normalizeWheelDelta = (event: WheelEvent) => {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
      return event.deltaY * 18
    }

    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      return event.deltaY * window.innerHeight * 0.9
    }

    return event.deltaY
  }

  const hasScrollableAncestor = (target: EventTarget | null, deltaY: number) => {
    let node = target instanceof Element ? target : null

    while (node) {
      if (node instanceof HTMLElement) {
        const style = window.getComputedStyle(node)
        const overflowY = style.overflowY
        const canScroll =
          (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
          node.scrollHeight > node.clientHeight + 1

        if (canScroll) {
          const canScrollDown = deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 1
          const canScrollUp = deltaY < 0 && node.scrollTop > 1
          if (canScrollDown || canScrollUp) {
            return true
          }
        }
      }

      node = node.parentElement
    }

    return false
  }

  const attachWheelForwarding = (key: ModuleViewKey) => {
    wheelCleanupRefs.current[key]?.()

    const iframe = iframeRefs.current[key]
    const doc = iframe?.contentDocument
    if (!iframe || !doc) {
      return
    }

    const onWheel = (event: WheelEvent) => {
      if (modalFrameKeyRef.current === key) {
        return
      }

      if (hasScrollableAncestor(event.target, event.deltaY)) {
        return
      }

      event.preventDefault()
      const nextDeltaY = normalizeWheelDelta(event) * 1.18
      window.scrollBy({
        top: nextDeltaY,
        left: event.deltaX,
        behavior: 'auto',
      })
    }

    doc.addEventListener('wheel', onWheel, { passive: false })
    wheelCleanupRefs.current[key] = () => doc.removeEventListener('wheel', onWheel)
  }

  const handleFrameLoad = (key: ModuleViewKey) => {
    observerCleanupRefs.current[key]?.()
    attachWheelForwarding(key)
    updateFrameHeight(key)

    const iframe = iframeRefs.current[key]
    const doc = iframe?.contentDocument
    const target = doc?.documentElement
    if (!iframe || !doc || !target || typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(() => {
      if (modalFrameKey !== key) {
        updateFrameHeight(key)
      }
    })
    observer.observe(target)
    if (doc.body) {
      observer.observe(doc.body)
    }

    observerCleanupRefs.current[key] = () => observer.disconnect()
  }

  const getFrameHeight = (key: ModuleViewKey) => {
    if (modalFrameKey === key) {
      return Math.max(640, viewportHeight - 180)
    }

    return frameHeights[key]
  }

  const handleTabChange = (value: string) => {
    const nextTab = value as ModuleViewKey
    setActiveTab(nextTab)

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const targetTop = tabsBarRef.current?.getBoundingClientRect().top ?? 0
        const nextScrollTop = window.scrollY + targetTop
        window.scrollTo({
          top: Math.max(0, nextScrollTop),
          behavior: 'smooth',
        })
      })
    })
  }

  return (
    <section className="space-y-6 pt-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div ref={tabsBarRef} className="sticky top-0 z-30">
          <TabsList className="grid w-full grid-cols-3 rounded-[1.8rem] border border-white/80 bg-white/82 p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.07)] backdrop-blur-xl">
            {Object.entries(moduleViews).map(([value, item]) => {
              const Icon = item.icon
              return (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="min-h-16 gap-3 rounded-[1.2rem] border border-transparent px-4 text-sm font-semibold text-slate-600 data-[state=active]:border-sky-200 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-[0_18px_32px_rgba(15,23,42,0.14)] dark:data-[state=active]:bg-slate-100 dark:data-[state=active]:text-slate-900"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {Object.entries(moduleViews).map(([value, item]) => {
          const key = value as ModuleViewKey
          const modalOpen = modalFrameKey === key

          return (
            <TabsContent key={value} value={value} className="mt-0">
              <Card className="overflow-hidden rounded-[2rem] border-white/80 bg-white/68 p-2 sm:p-3">
                <iframe
                  ref={(node) => bindFrame(key, node)}
                  title={item.label}
                  src={item.src}
                  onLoad={() => handleFrameLoad(key)}
                  scrolling={modalOpen ? 'yes' : 'no'}
                  style={{ height: `${getFrameHeight(key)}px` }}
                  className="block w-full rounded-[1.5rem] border-0 bg-white"
                />
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </section>
  )
}
