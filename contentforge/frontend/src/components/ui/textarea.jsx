import * as React from 'react'

import { cn } from '@/lib/utils'

const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        'w-full min-w-0 rounded-lg border border-input bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors outline-none placeholder:text-slate-400 hover:border-blue-300 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
})

export { Textarea }
