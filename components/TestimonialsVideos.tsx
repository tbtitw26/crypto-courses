'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { useRef, useEffect } from 'react'

export function TestimonialsVideos() {
  const t = useTranslations('home.testimonials')
  const video1Ref = useRef<HTMLVideoElement>(null)
  const video2Ref = useRef<HTMLVideoElement>(null)

  // Video1: Set poster frame at 0:01 and reset to 0:00 on play
  useEffect(() => {
    const video = video1Ref.current
    if (!video) return

    let hasSetPoster = false

    const setPosterFrame = () => {
      if (!hasSetPoster && video.readyState >= 2) {
        video.currentTime = 0.01
        hasSetPoster = true
      }
    }

    const handleLoadedMetadata = () => {
      setPosterFrame()
    }

    const handleLoadedData = () => {
      setPosterFrame()
    }

    const handleCanPlay = () => {
      setPosterFrame()
    }

    const handleSeeked = () => {
      // After seeking to 0.01, ensure it stays there if not playing
      if (!video.paused && video.currentTime === 0.01) {
        // If somehow playing at 0.01, reset to 0
        video.currentTime = 0
      }
    }

    const handlePlay = (e: Event) => {
      // Reset to beginning when play is clicked
      if (Math.abs(video.currentTime - 0.01) < 0.1) {
        video.currentTime = 0
      }
    }

    // Try to set poster frame immediately if video is already loaded
    if (video.readyState >= 2) {
      setPosterFrame()
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('seeked', handleSeeked)
    video.addEventListener('play', handlePlay)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('seeked', handleSeeked)
      video.removeEventListener('play', handlePlay)
    }
  }, [])

  // Video2: Limit playback to 18 seconds
  useEffect(() => {
    const video = video2Ref.current
    if (!video) return

    const handleTimeUpdate = () => {
      if (video.currentTime >= 18) {
        video.pause()
        video.currentTime = 18
      }
    }

    const handleSeeked = () => {
      if (video.currentTime > 18) {
        video.currentTime = 18
      }
    }

    const handleLoadedMetadata = () => {
      // Set max duration to 18 seconds if video is longer
      if (video.duration > 18) {
        // This will be enforced by timeupdate handler
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('seeked', handleSeeked)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('seeked', handleSeeked)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [])

  return (
    <div className="space-y-8">
      <div className="max-w-xl">
        <h2 className="section-heading">{t('title')}</h2>
        <p className="section-subheading">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Video 1 - Vertical format */}
        <motion.div
          className="relative group"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <div className="absolute -inset-4 bg-gradient-to-br from-brand-500/15 via-surface-100/60 to-brand-400/10 blur-2xl -z-10 opacity-60" />
          <div className="glass-panel rounded-2xl p-5 sm:p-6">
            <div className="relative w-full h-[420px] sm:h-[480px] rounded-xl overflow-hidden border border-surface-300 bg-surface-50 flex items-center justify-center">
              <video
                ref={video1Ref}
                src="/video1.mp4"
                controls
                preload="auto"
                className="w-full h-full object-contain"
                playsInline
                aria-label={t('video1Label')}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </motion.div>

        {/* Video 2 - Horizontal format */}
        <motion.div
          className="relative group"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.1 }}
        >
          <div className="absolute -inset-4 bg-gradient-to-br from-brand-500/15 via-surface-100/60 to-brand-400/10 blur-2xl -z-10 opacity-60" />
          <div className="glass-panel rounded-2xl p-5 sm:p-6">
            <div className="relative w-full h-[420px] sm:h-[480px] rounded-xl overflow-hidden border border-surface-300 bg-surface-50">
              <video
                ref={video2Ref}
                src="/video2.mp4"
                controls
                preload="metadata"
                className="w-full h-full object-cover"
                playsInline
                aria-label={t('video2Label')}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
