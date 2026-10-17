import * as React from 'react'

import { cn } from '@/lib/utils'

const Label = React.forwardRef(function Label({ className, ...props }, ref) {
  return (
    <label
      ref={ref}
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-xs font-medium text-slate-500 select-none',
        className
      )}
      {...props}
    />
  )
})

export { Label }
