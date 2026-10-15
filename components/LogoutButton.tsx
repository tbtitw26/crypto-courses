// components/LogoutButton.tsx - Logout button component

'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function LogoutButton() {
  const router = useRouter()
  const tUi = useTranslations('common.ui')

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm font-medium text-slate-300 hover:text-cyan-300 hover:underline transition"
    >
      {tUi('logOut')}
    </button>
  )
}


