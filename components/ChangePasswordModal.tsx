// components/ChangePasswordModal.tsx - Change password modal component

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const t = useTranslations('dashboard.settingsPage.security.changePassword')
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  })

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset()
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    }
  }, [isOpen, reset])

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        showToast({
          title: t('success.title'),
          description: t('success.message'),
          variant: 'success',
        })
        reset()
        onClose()
      } else {
        showToast({
          title: t('error.title'),
          description: result.error || t('error.message'),
          variant: 'error',
        })
      }
    } catch (error) {
      console.error('Failed to change password:', error)
      showToast({
        title: t('error.title'),
        description: t('error.message'),
        variant: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-surface-0/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel-strong rounded-2xl p-6 w-full max-w-md shadow-2xl pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-surface-200 flex items-center justify-center border border-surface-400">
                    <Lock className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-semibold text-text-main">{t('title')}</h2>
                    <p className="text-sm text-text-muted">{t('subtitle')}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-text-muted hover:text-text-main hover:bg-surface-200/50 rounded-lg transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="text-xs font-medium text-text-main">
                    {t('currentPassword.label')}
                  </label>
                  <div className="relative">
                    <input
                      {...register('currentPassword')}
                      type={showCurrentPassword ? 'text' : 'password'}
                      id="currentPassword"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 border border-surface-400 text-sm text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition"
                      placeholder={t('currentPassword.placeholder')}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.currentPassword.message}</span>
                    </div>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-xs font-medium text-text-main">
                    {t('newPassword.label')}
                  </label>
                  <div className="relative">
                    <input
                      {...register('newPassword')}
                      type={showNewPassword ? 'text' : 'password'}
                      id="newPassword"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 border border-surface-400 text-sm text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition"
                      placeholder={t('newPassword.placeholder')}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.newPassword.message}</span>
                    </div>
                  )}
                  <p className="text-sm text-text-muted">{t('newPassword.hint')}</p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-xs font-medium text-text-main">
                    {t('confirmPassword.label')}
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-50 border border-surface-400 text-sm text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition"
                      placeholder={t('confirmPassword.placeholder')}
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.confirmPassword.message}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="btn-secondary flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? t('submitting') : t('submit')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
