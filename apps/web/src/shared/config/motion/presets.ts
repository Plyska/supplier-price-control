import type { Transition, Variants } from 'motion/react'

export const defaultTransition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1],
} satisfies Transition

export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
} satisfies Variants

export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} satisfies Variants

export const dialogVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0 },
} satisfies Variants

export const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.98, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0 },
} satisfies Variants
