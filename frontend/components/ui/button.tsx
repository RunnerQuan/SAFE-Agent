import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-[#ff9146] to-[#f27835] text-white shadow-[0_10px_24px_rgba(242,120,53,0.28)] hover:brightness-105',
        destructive:
          'border border-rose-300/60 bg-rose-500/10 text-rose-700 hover:bg-rose-500/18',
        outline:
          'border border-white/70 bg-white/64 text-slate-700 shadow-[0_8px_20px_rgba(69,85,111,0.1)] hover:border-[#ff9146]/50 hover:text-slate-900 hover:shadow-[0_10px_24px_rgba(242,120,53,0.16)]',
        secondary:
          'border border-slate-200/70 bg-slate-50/85 text-slate-700 hover:bg-slate-100',
        ghost:
          'text-slate-600 hover:bg-white/70 hover:text-slate-900',
        link: 'text-[#f27835] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
