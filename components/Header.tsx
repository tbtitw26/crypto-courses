'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  Coins,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PenLine,
  Receipt,
  Settings,
  ShoppingCart,
  Sparkles,
  User,
  Wallet,
  X,
} from 'lucide-react'
import { CurrencySelector, CurrencySelectorMobile } from './CurrencySelector'
import { LanguageToggle } from './LanguageToggle'
import { MiniCart } from './MiniCart'
import { useCart } from '@/contexts/CartContext'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCartHovered, setIsCartHovered] = useState(false)
  const [cartCloseTimeout, setCartCloseTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [builderCloseTimeout, setBuilderCloseTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isResourcesOpen, setIsResourcesOpen] = useState(false)
  const [resourcesCloseTimeout, setResourcesCloseTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const accountTimeout = useRef<NodeJS.Timeout | null>(null)
  const [isMobileLearnOpen, setIsMobileLearnOpen] = useState(false)
  const [isMobileResourcesOpen, setIsMobileResourcesOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { itemCount } = useCart()
  const tNav = useTranslations('common.nav')
  const tAuth = useTranslations('common.auth')
  const tHeader = useTranslations('common.header')
  const tBrand = useTranslations('common.brand')

  const user = session?.user as { id?: number; name?: string; email?: string; balance?: number } | undefined
  const isLoggedIn = !!session
  const userInitial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsBuilderOpen(false)
    setIsResourcesOpen(false)
    setIsAccountOpen(false)
  }, [pathname])

  useEffect(() => {
    return () => {
      if (cartCloseTimeout) clearTimeout(cartCloseTimeout)
      if (builderCloseTimeout) clearTimeout(builderCloseTimeout)
      if (resourcesCloseTimeout) clearTimeout(resourcesCloseTimeout)
      if (accountTimeout.current) clearTimeout(accountTimeout.current)
    }
  }, [cartCloseTimeout, builderCloseTimeout, resourcesCloseTimeout])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (href: string) => {
    const cleanHref = href.split('?')[0]
    if (cleanHref === '/') return pathname === '/'
    return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`)
  }

  const openBuilder = () => {
    if (builderCloseTimeout) { clearTimeout(builderCloseTimeout); setBuilderCloseTimeout(null) }
    setIsBuilderOpen(true)
  }
  const closeBuilderDelay = () => {
    const t = setTimeout(() => setIsBuilderOpen(false), 160)
    setBuilderCloseTimeout(t)
  }

  const openResources = () => {
    if (resourcesCloseTimeout) { clearTimeout(resourcesCloseTimeout); setResourcesCloseTimeout(null) }
    setIsResourcesOpen(true)
  }
  const closeResourcesDelay = () => {
    const t = setTimeout(() => setIsResourcesOpen(false), 160)
    setResourcesCloseTimeout(t)
  }

  const openAccount = () => {
    if (accountTimeout.current) { clearTimeout(accountTimeout.current); accountTimeout.current = null }
    setIsAccountOpen(true)
  }
  const closeAccountDelay = () => {
    if (accountTimeout.current) clearTimeout(accountTimeout.current)
    accountTimeout.current = setTimeout(() => setIsAccountOpen(false), 150)
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  const navLinkClass = (href: string) =>
    `inline-flex h-9 items-center rounded-lg px-3 text-[13px] font-medium transition-colors ${
      isActive(href)
        ? 'bg-surface-100 text-text-main'
        : 'text-text-secondary hover:bg-surface-50 hover:text-text-main'
    }`

  return (
    <>
      {/* ── Announcement / Risk bar ── */}
      <div className="border-b border-surface-200 bg-surface-950 text-surface-300">
        <div className="mx-auto flex max-w-page items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-[11px]">
            <AlertTriangle className="h-3 w-3 text-gold-400" />
            <span className="font-semibold uppercase tracking-wider text-gold-400">
              Education only
            </span>
            <span className="hidden text-surface-400 sm:inline">
              — No signals, no promises, no financial advice
            </span>
          </div>
          <Link
            href="/risk-and-disclaimer"
            className="text-[11px] font-medium text-surface-400 transition hover:text-white"
          >
            Risk info &rarr;
          </Link>
        </div>
      </div>

      {/* ── Main header ── */}
      <header
        className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled
            ? 'border-b border-surface-200 bg-white/95 shadow-sm backdrop-blur-xl'
            : 'border-b border-transparent bg-white/80 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex h-[56px] max-w-page items-center gap-2 px-4 sm:px-6 lg:gap-4 lg:px-8">

          {/* ── Brand block ── */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 rounded-lg py-1 focus-visible:outline-brand-500"
            aria-label={`${tBrand('name')} home`}
          >
            <span className="relative block h-8 w-[120px] sm:h-9 sm:w-[140px]">
              <Image
                src="/logo.png"
                alt={tBrand('name')}
                fill
                sizes="140px"
                priority
                className="object-contain object-left"
              />
            </span>
          </Link>

          <div className="hidden h-6 w-px bg-surface-200 lg:block" />

          {/* ── Desktop navigation ── */}
          <nav className="hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Primary navigation">
            <Link href="/courses" className={navLinkClass('/courses')}>
              {tNav('courses')}
            </Link>

            {/* Builder dropdown */}
            <div
              className="relative"
              onMouseEnter={openBuilder}
              onMouseLeave={closeBuilderDelay}
              onFocusCapture={openBuilder}
              onBlurCapture={closeBuilderDelay}
            >
              <button
                type="button"
                onClick={() => setIsBuilderOpen((v) => !v)}
                className={`inline-flex h-9 items-center gap-1 rounded-lg px-3 text-[13px] font-medium transition-colors ${
                  pathname.startsWith('/learn')
                    ? 'bg-surface-100 text-text-main'
                    : 'text-text-secondary hover:bg-surface-50 hover:text-text-main'
                }`}
                aria-expanded={isBuilderOpen}
                aria-haspopup="menu"
              >
                Builder
                <ChevronDown className={`h-3 w-3 text-text-muted transition-transform duration-200 ${isBuilderOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBuilderOpen && (
                <div
                  className="absolute left-0 top-full w-[360px] pt-2"
                  onMouseEnter={openBuilder}
                  onMouseLeave={closeBuilderDelay}
                >
                  <div className="rounded-xl border border-surface-200 bg-white p-1.5 shadow-card" role="menu">
                    <Link
                      href="/learn?tab=custom"
                      className="group flex gap-3 rounded-lg p-3 transition-colors hover:bg-surface-50"
                      role="menuitem"
                      onClick={() => setIsBuilderOpen(false)}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-200 bg-surface-0 text-brand-700 transition-colors group-hover:border-brand-200 group-hover:bg-brand-50">
                        <PenLine className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-main">Custom Course</p>
                        <p className="mt-0.5 text-xs leading-snug text-text-muted">Tailored PDF by a pro trader</p>
                      </div>
                    </Link>
                    <Link
                      href="/learn?tab=ai"
                      className="group flex gap-3 rounded-lg p-3 transition-colors hover:bg-surface-50"
                      role="menuitem"
                      onClick={() => setIsBuilderOpen(false)}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-200 bg-surface-0 text-ai transition-colors group-hover:border-brand-200 group-hover:bg-brand-50">
                        <BrainCircuit className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-main">AI Strategy</p>
                        <p className="mt-0.5 text-xs leading-snug text-text-muted">Generated trading plan with risk logic</p>
                      </div>
                    </Link>
                    <div className="my-1 border-t border-surface-100" />
                    <Link
                      href="/learn"
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
                      role="menuitem"
                      onClick={() => setIsBuilderOpen(false)}
                    >
                      <span>All learning tools</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Resources dropdown */}
            <div
              className="relative"
              onMouseEnter={openResources}
              onMouseLeave={closeResourcesDelay}
              onFocusCapture={openResources}
              onBlurCapture={closeResourcesDelay}
            >
              <button
                type="button"
                onClick={() => setIsResourcesOpen((v) => !v)}
                className={`inline-flex h-9 items-center gap-1 rounded-lg px-3 text-[13px] font-medium transition-colors ${
                  ['/resources', '/glossary', '/about', '/contact', '/faq', '/pricing'].some((p) => isActive(p))
                    ? 'bg-surface-100 text-text-main'
                    : 'text-text-secondary hover:bg-surface-50 hover:text-text-main'
                }`}
                aria-expanded={isResourcesOpen}
                aria-haspopup="menu"
              >
                Resources
                <ChevronDown className={`h-3 w-3 text-text-muted transition-transform duration-200 ${isResourcesOpen ? 'rotate-180' : ''}`} />
              </button>

              {isResourcesOpen && (
                <div
                  className="absolute left-0 top-full w-[200px] pt-2"
                  onMouseEnter={openResources}
                  onMouseLeave={closeResourcesDelay}
                >
                  <div className="rounded-xl border border-surface-200 bg-white p-1.5 shadow-card" role="menu">
                    {[
                      { href: '/pricing', label: tNav('pricing') },
                      { href: '/resources', label: 'Resources' },
                      { href: '/glossary', label: 'Glossary' },
                      { href: '/about', label: 'About' },
                      { href: '/contact', label: 'Contact' },
                      { href: '/faq', label: 'FAQ' },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive(item.href)
                            ? 'bg-surface-100 text-text-main'
                            : 'text-text-secondary hover:bg-surface-50 hover:text-text-main'
                        }`}
                        role="menuitem"
                        onClick={() => setIsResourcesOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isLoggedIn && (
              <Link href="/dashboard" className={navLinkClass('/dashboard')}>
                {tNav('dashboard')}
              </Link>
            )}
          </nav>

          {/* ── Desktop right ── */}
          <div className="ml-auto hidden shrink-0 items-center gap-1 lg:flex">
            <CurrencySelector />
            <LanguageToggle />

            <div className="mx-1 h-5 w-px bg-surface-200" />

            {/* Cart */}
            <div
              className="relative"
              onMouseEnter={() => {
                if (cartCloseTimeout) { clearTimeout(cartCloseTimeout); setCartCloseTimeout(null) }
                setIsCartHovered(true)
              }}
              onMouseLeave={() => {
                const timeout = setTimeout(() => setIsCartHovered(false), 180)
                setCartCloseTimeout(timeout)
              }}
            >
              <Link
                href="/cart"
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-50 hover:text-text-main"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-700 px-1 text-[9px] font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
              {isCartHovered && (
                <div className="absolute right-0 top-full pt-3">
                  <MiniCart
                    onMouseEnter={() => {
                      if (cartCloseTimeout) { clearTimeout(cartCloseTimeout); setCartCloseTimeout(null) }
                    }}
                    onMouseLeave={() => {
                      const timeout = setTimeout(() => setIsCartHovered(false), 180)
                      setCartCloseTimeout(timeout)
                    }}
                  />
                </div>
              )}
            </div>

            {/* Account */}
            <div
              className="relative"
              onMouseEnter={openAccount}
              onMouseLeave={closeAccountDelay}
              onFocusCapture={openAccount}
              onBlurCapture={closeAccountDelay}
            >
              <button
                type="button"
                onClick={() => setIsAccountOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-50 hover:text-text-main"
                aria-label="Account menu"
                aria-expanded={isAccountOpen}
                aria-haspopup="menu"
              >
                {isLoggedIn ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-900 text-[10px] font-bold text-white">
                    {userInitial}
                  </span>
                ) : (
                  <User className="h-4 w-4" />
                )}
              </button>

              {isAccountOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-surface-200 bg-white shadow-card"
                  onMouseEnter={openAccount}
                  onMouseLeave={closeAccountDelay}
                  role="menu"
                >
                  {isLoggedIn && user ? (
                    <>
                      <div className="border-b border-surface-100 px-4 py-3">
                        <p className="truncate text-sm font-semibold text-text-main">{user.name || user.email}</p>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-text-muted">
                          <Coins className="h-3.5 w-3.5 text-gold-500" />
                          <span>
                            <strong className="font-semibold text-text-main">
                              {user.balance ? Math.floor(user.balance).toLocaleString('en-US') : 0}
                            </strong>{' '}
                            {tHeader('tokens')}
                          </span>
                        </div>
                      </div>
                      <div className="p-1.5">
                        {[
                          { href: '/dashboard', icon: LayoutDashboard, label: tNav('dashboard') },
                          { href: '/dashboard/courses', icon: BookOpen, label: 'My Courses' },
                          { href: '/dashboard/custom-courses', icon: FileText, label: 'Custom Courses' },
                          { href: '/dashboard/ai-strategies', icon: Sparkles, label: 'AI Strategies' },
                          { href: '/dashboard/transactions', icon: Receipt, label: 'Transactions' },
                          { href: '/dashboard/receipts', icon: Wallet, label: 'Receipts' },
                          { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
                        ].map(({ href, icon: Icon, label }) => (
                          <Link
                            key={href}
                            href={href}
                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-50 hover:text-text-main"
                            role="menuitem"
                            onClick={() => setIsAccountOpen(false)}
                          >
                            <Icon className="h-4 w-4 text-text-muted" />
                            {label}
                          </Link>
                        ))}
                        <div className="my-1 border-t border-surface-100" />
                        <button
                          type="button"
                          onClick={() => signOut()}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-rose-50 hover:text-rose-700"
                          role="menuitem"
                        >
                          <LogOut className="h-4 w-4 text-text-muted" />
                          {tAuth('logOut')}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-3">
                      <Link
                        href="/register"
                        className="flex w-full items-center justify-center rounded-lg bg-surface-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-surface-800"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        {tAuth('getStarted')}
                      </Link>
                      <Link
                        href="/login"
                        className="mt-1.5 flex w-full items-center justify-center rounded-lg border border-surface-200 py-2.5 text-sm font-medium text-text-main transition-colors hover:bg-surface-50"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        {tAuth('logIn')}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mx-1 h-5 w-px bg-surface-200" />

            {/* Primary CTA */}
            {isLoggedIn ? (
              <Link
                href="/top-up"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-700 px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-800"
              >
                <Wallet className="h-3.5 w-3.5" />
                {tHeader('topUp')}
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-700 px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-800"
              >
                {tAuth('getStarted')}
              </Link>
            )}
          </div>

          {/* ── Mobile right ── */}
          <div className="ml-auto flex items-center gap-1.5 lg:hidden">
            <Link
              href="/cart"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="h-4 w-4" />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-700 px-1 text-[9px] font-bold text-white">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {isLoggedIn && (
              <Link
                href="/dashboard"
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                aria-label="Dashboard"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-900 text-[10px] font-bold text-white">
                  {userInitial}
                </span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-text-main transition-colors hover:bg-surface-100"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={tHeader('openMainMenu')}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu (fullscreen drawer) ── */}
        {isMobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="fixed inset-x-0 top-[calc(2.25rem+3.5rem)] bottom-0 z-50 overflow-y-auto bg-white lg:hidden"
          >
            <div className="mx-auto max-w-page px-4 pb-8 pt-4 sm:px-6">
              {/* Learn & Build */}
              <div className="border-b border-surface-100 py-4">
                <button
                  type="button"
                  onClick={() => setIsMobileLearnOpen((v) => !v)}
                  className="flex w-full items-center justify-between py-1 text-[11px] font-bold uppercase tracking-widest text-text-muted"
                  aria-expanded={isMobileLearnOpen}
                >
                  <span>Learn &amp; Build</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isMobileLearnOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileLearnOpen && (
                  <div className="mt-2 space-y-0.5">
                    {[
                      { href: '/courses', icon: BookOpen, label: tNav('courses'), desc: 'Library' },
                      { href: '/learn?tab=custom', icon: PenLine, label: 'Custom Course', desc: 'Tailored PDF' },
                      { href: '/learn?tab=ai', icon: BrainCircuit, label: 'AI Strategy', desc: 'Strategy PDF' },
                      { href: '/pricing', icon: Coins, label: tNav('pricing'), desc: 'Tokens & packs' },
                    ].map(({ href, icon: Icon, label, desc }) => (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
                          isActive(href.split('?')[0])
                            ? 'bg-surface-100 text-text-main'
                            : 'text-text-secondary hover:bg-surface-50 hover:text-text-main'
                        }`}
                        onClick={closeMobileMenu}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-surface-200 bg-surface-0 text-brand-700">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">{label}</span>
                        </span>
                        <span className="text-[11px] text-text-muted">{desc}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Resources */}
              <div className="border-b border-surface-100 py-4">
                <button
                  type="button"
                  onClick={() => setIsMobileResourcesOpen((v) => !v)}
                  className="flex w-full items-center justify-between py-1 text-[11px] font-bold uppercase tracking-widest text-text-muted"
                  aria-expanded={isMobileResourcesOpen}
                >
                  <span>Resources</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isMobileResourcesOpen ? 'rotate-180' : ''}`} />
                </button>
                {isMobileResourcesOpen && (
                  <div className="mt-2 space-y-0.5">
                    {[
                      { href: '/resources', label: 'Resources' },
                      { href: '/glossary', label: 'Glossary' },
                      { href: '/faq', label: 'FAQ' },
                      { href: '/about', label: 'About' },
                      { href: '/contact', label: 'Contact' },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                          isActive(item.href)
                            ? 'bg-surface-100 text-text-main'
                            : 'text-text-secondary hover:bg-surface-50 hover:text-text-main'
                        }`}
                        onClick={closeMobileMenu}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Wallet */}
              <div className="border-b border-surface-100 py-4">
                <p className="py-1 text-[11px] font-bold uppercase tracking-widest text-text-muted">Wallet</p>
                <div className="mt-2 space-y-0.5">
                  {isLoggedIn && user && (
                    <div className="flex items-center gap-2 rounded-lg bg-surface-0 px-3 py-2.5 text-sm">
                      <Coins className="h-4 w-4 text-gold-500" />
                      <span className="text-text-secondary">
                        <strong className="font-semibold text-text-main">
                          {user.balance ? Math.floor(user.balance).toLocaleString('en-US') : 0}
                        </strong>{' '}
                        {tHeader('tokens')}
                      </span>
                    </div>
                  )}
                  <Link
                    href="/top-up"
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-50 hover:text-text-main"
                    onClick={closeMobileMenu}
                  >
                    <Wallet className="h-4 w-4 text-brand-700" />
                    {tHeader('topUp')}
                  </Link>
                  <Link
                    href="/cart"
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-50 hover:text-text-main"
                    onClick={closeMobileMenu}
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Cart
                    </span>
                    {itemCount > 0 && (
                      <span className="rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-bold text-white">{itemCount}</span>
                    )}
                  </Link>
                </div>
              </div>

              {/* Preferences */}
              <div className="border-b border-surface-100 py-4 space-y-4">
                <p className="py-1 text-[11px] font-bold uppercase tracking-widest text-text-muted">Preferences</p>
                <CurrencySelectorMobile />
                <div className="flex items-center justify-between px-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Language</span>
                  <LanguageToggle />
                </div>
              </div>

              {/* Account */}
              <div className="py-4">
                {isLoggedIn && user ? (
                  <>
                    <p className="py-1 text-[11px] font-bold uppercase tracking-widest text-text-muted">Account</p>
                    <div className="mt-2 space-y-0.5">
                      <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-900 text-xs font-bold text-white">
                          {userInitial}
                        </span>
                        <p className="min-w-0 truncate text-sm font-semibold text-text-main">{user.name || user.email}</p>
                      </div>
                      {[
                        { href: '/dashboard', icon: LayoutDashboard, label: tNav('dashboard') },
                        { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
                      ].map(({ href, icon: Icon, label }) => (
                        <Link
                          key={href}
                          href={href}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-50 hover:text-text-main"
                          onClick={closeMobileMenu}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </Link>
                      ))}
                      <button
                        type="button"
                        onClick={() => { signOut(); setIsMobileMenuOpen(false) }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-rose-50 hover:text-rose-700"
                      >
                        <LogOut className="h-4 w-4" />
                        {tAuth('logOut')}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="grid gap-2">
                    <Link
                      href="/register"
                      className="flex w-full items-center justify-center rounded-lg bg-surface-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-surface-800"
                      onClick={closeMobileMenu}
                    >
                      {tAuth('signUp')}
                    </Link>
                    <Link
                      href="/login"
                      className="flex w-full items-center justify-center rounded-lg border border-surface-200 py-3 text-sm font-medium text-text-main transition-colors hover:bg-surface-50"
                      onClick={closeMobileMenu}
                    >
                      {tAuth('logIn')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
