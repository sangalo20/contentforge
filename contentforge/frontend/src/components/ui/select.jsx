import * as React from 'react'

import { cn } from '@/lib/utils'

const Select = React.forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        data-slot="select"
        className={cn(
          'h-9 w-full appearance-none rounded-lg border border-input bg-white pl-3 pr-9 text-sm text-slate-900 shadow-sm transition-colors outline-none hover:border-blue-300 hover:bg-blue-50/30 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  )
})

export { Select }
