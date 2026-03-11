'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'light' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast border border-white/80 bg-white/90 text-slate-900 shadow-2xl shadow-slate-800/15 backdrop-blur-xl',
          description: 'group-[.toast]:text-slate-600',
          actionButton: 'group-[.toast]:bg-[#f27835] group-[.toast]:text-white',
          cancelButton: 'group-[.toast]:bg-slate-100 group-[.toast]:text-slate-700',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
