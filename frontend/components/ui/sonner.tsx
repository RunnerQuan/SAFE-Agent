'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'dark' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast border border-sky-300/20 bg-slate-950/90 text-slate-100 shadow-2xl shadow-black/50 backdrop-blur-xl',
          description: 'group-[.toast]:text-slate-300/85',
          actionButton: 'group-[.toast]:bg-sky-500 group-[.toast]:text-white',
          cancelButton: 'group-[.toast]:bg-slate-800 group-[.toast]:text-slate-100',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }