import { motion, useInView, useSpring, useTransform, useMotionValue } from 'framer-motion'
import { useRef, useEffect, ReactNode } from 'react'

/* ===== Page wrapper with fade-in ===== */
export function PageAnimate({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ===== Scroll-triggered fade-in ===== */
export function ScrollReveal({ children, delay = 0, direction = 'up' }: { children: ReactNode; delay?: number; direction?: 'up' | 'down' | 'left' | 'right' }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const offset = { up: 30, down: -30, left: 30, right: -30 }[direction]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: offset === 30 || offset === -30 ? offset : 0, x: offset !== 30 && offset !== -30 ? offset : 0 }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  )
}

/* ===== Stagger container ===== */
export function StaggerContainer({ children, className, staggerDelay = 0.06 }: { children: ReactNode; className?: string; staggerDelay?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ===== Count-up number ===== */
export function CountUp({ target, duration = 1.5, suffix = '', prefix = '', decimals = 0 }: { target: number; duration?: number; suffix?: string; prefix?: string; decimals?: number }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 })
  const display = useTransform(spring, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`)

  useEffect(() => {
    if (isInView) motionVal.set(target)
  }, [isInView, target, motionVal])

  return <motion.span ref={ref}>{display}</motion.span>
}

/* ===== Hover lift card ===== */
export function HoverCard({ children, className, onClick, style }: { children: ReactNode; className?: string; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined, ...style }}
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      whileTap={onClick ? { scale: 0.985 } : undefined}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

/* ===== Animated progress ring (for pomodoro) ===== */
export function ProgressRing({ progress, size = 120, strokeWidth = 4, color = 'var(--color-accent)' }: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-light)" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ===== Floating dot pulse ===== */
export function PulseDot({ color = 'var(--color-success)' }: { color?: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 8, height: 8 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: 0.4 }}>
        <motion.span
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color }}
          animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </span>
      <span style={{ position: 'absolute', inset: 2, borderRadius: '50%', background: color }} />
    </span>
  )
}

/* ===== Typing cursor ===== */
export function TypingCursor() {
  return (
    <motion.span
      style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--color-accent)', marginLeft: 2, verticalAlign: 'text-bottom' }}
      animate={{ opacity: [1, 0, 1] }}
      transition={{ duration: 0.8, repeat: Infinity }}
    />
  )
}

/* ===== Image with lazy load + fade ===== */
export function FadeImage({ src, alt, style }: { src: string; alt: string; style?: React.CSSProperties }) {
  return (
    <motion.img
      src={src}
      alt={alt}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{ display: 'block', ...style }}
    />
  )
}
