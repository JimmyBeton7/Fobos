import { useEffect, useMemo, useState, MouseEvent } from 'react'
import { Sidebar } from 'primereact/sidebar'
import './AppSidebar.styles.css'
import logo from '../../../../fobos_icon.png'
import { useIsMobile } from '../helpers/useIsMobile'

export type SidebarItem = {
  id: string
  label: string
  icon: string
  onClick?: () => void
  active?: boolean
}

type Props = {
  items: SidebarItem[]
  initialExpanded?: boolean
  onToggle?: (expanded: boolean) => void
  onWidthChange?: (widthPx: number) => void
}

export default function AppSidebar({ items, initialExpanded = true, onToggle, onWidthChange }: Props) {
  const [expanded, setExpanded] = useState(initialExpanded)
  const isMobile = useIsMobile()

  const width = useMemo(() => (expanded ? 180 : 65), [expanded])

  useEffect(() => {
    if (isMobile) {
      setExpanded(false)
    }
  }, [isMobile])

  useEffect(() => {
    onToggle?.(expanded)
    if (isMobile) {
      onWidthChange?.(0)
    } else {
      onWidthChange?.(width)
    }
  }, [expanded, width, isMobile, onToggle, onWidthChange])

  const onBackgroundClick = (e: MouseEvent<HTMLDivElement>) => {
    if (isMobile) return
    const target = e.target as HTMLElement
    if (target.closest('.nav-item')) return
    setExpanded(v => !v)
  }

  return (
    <Sidebar
      visible
      position="left"
      modal={false}
      dismissable={false}
      showCloseIcon={false}
      blockScroll={false}
      className={`app-sidebar ${expanded ? 'expanded' : 'collapsed'} ${isMobile ? 'mobile' : ''}`}
      style={isMobile ? { width: '100%' } : { width }}
      onHide={() => {}}
    >
      <div className="app-sidebar__content" onClick={onBackgroundClick}>
        {!isMobile && (
          <div className="app-sidebar__header">
            <div className="app-sidebar__brand">
              <div className="brand-mark">
                <img src={logo} alt="Fobos" />
              </div>
              {expanded && <div className="brand-title">Fobos</div>}
            </div>
          </div>
        )}

        <nav className="app-sidebar__nav">
          {items.map(it => (
            <button
              key={it.id}
              className={`nav-item ${it.active ? 'active' : ''}`}
              onClick={it.onClick}
              title={it.label}
            >
              <i className={it.icon} />
              {!isMobile && expanded && <span className="nav-label">{it.label}</span>}
            </button>
          ))}
        </nav>
      </div>
    </Sidebar>
  )
}
