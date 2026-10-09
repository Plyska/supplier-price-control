import type { PropsWithChildren } from 'react'
import { m } from 'motion/react'
import { pageVariants } from '../../config/motion'

export function PageTransition({ children }: PropsWithChildren) {
  return (
    <m.div
      animate="animate"
      exit="exit"
      initial="initial"
      variants={pageVariants}
    >
      {children}
    </m.div>
  )
}
