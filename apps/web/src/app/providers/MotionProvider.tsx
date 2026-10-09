import type { PropsWithChildren } from 'react'
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react'
import { defaultTransition } from '../../shared/config/motion'

export function MotionProvider({ children }: PropsWithChildren) {
  return (
    <MotionConfig reducedMotion="user" transition={defaultTransition}>
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  )
}
