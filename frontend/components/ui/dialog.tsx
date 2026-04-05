// 'use client'

// import * as React from 'react'
// import * as DialogPrimitive from '@radix-ui/react-dialog'
// import { X } from 'lucide-react'
// import { cn } from '@/lib/utils'

// const Dialog = DialogPrimitive.Root
// const DialogTrigger = DialogPrimitive.Trigger
// const DialogPortal = DialogPrimitive.Portal
// const DialogClose = DialogPrimitive.Close

// const DialogOverlay = React.forwardRef<
//   React.ElementRef<typeof DialogPrimitive.Overlay>,
//   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
// >(({ className, ...props }, ref) => (
//   <DialogPrimitive.Overlay
//     ref={ref}
//     className={cn(
//       'fixed inset-0 z-50 bg-slate-950/96 backdrop-blur-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
//       className
//     )}
//     {...props}
//   />
// ))
// DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

// interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
//   hideClose?: boolean
// }

// const DialogContent = React.forwardRef<
//   React.ElementRef<typeof DialogPrimitive.Content>,
//   DialogContentProps
// >(({ className, children, hideClose = false, ...props }, ref) => (
//   <DialogPortal>
//     <DialogOverlay />
//     <DialogPrimitive.Content
//       ref={ref}
//       className={cn(
//         'fixed left-[50%] top-[50%] z-50 grid w-[min(92vw,44rem)] max-h-[calc(100vh-4rem)] translate-x-[-50%] translate-y-[-50%] gap-5 overflow-y-auto rounded-[2rem] border border-white/80 bg-white/90 p-6 pb-8 shadow-[0_40px_120px_-30px_rgba(15,23,42,0.45)] backdrop-blur-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 dark:border-slate-700/60 dark:bg-slate-950/88',
//         className
//       )}
//       {...props}
//     >
//       {children}
//       {!hideClose ? (
//         <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full border border-white/70 bg-white/72 p-2 text-slate-600 transition-colors hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-slate-50">
//           <X className="h-4 w-4" />
//           <span className="sr-only">Close</span>
//         </DialogPrimitive.Close>
//       ) : null}
//     </DialogPrimitive.Content>
//   </DialogPortal>
// ))
// DialogContent.displayName = DialogPrimitive.Content.displayName

// const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
//   <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
// )
// DialogHeader.displayName = 'DialogHeader'

// const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
//   <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
// )
// DialogFooter.displayName = 'DialogFooter'

// const DialogTitle = React.forwardRef<
//   React.ElementRef<typeof DialogPrimitive.Title>,
//   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
// >(({ className, ...props }, ref) => (
//   <DialogPrimitive.Title
//     ref={ref}
//     className={cn('font-display text-lg font-medium leading-none tracking-tight text-slate-900 dark:text-slate-50', className)}
//     {...props}
//   />
// ))
// DialogTitle.displayName = DialogPrimitive.Title.displayName

// const DialogDescription = React.forwardRef<
//   React.ElementRef<typeof DialogPrimitive.Description>,
//   React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
// >(({ className, ...props }, ref) => (
//   <DialogPrimitive.Description
//     ref={ref}
//     className={cn('text-sm leading-7 text-slate-600 dark:text-slate-300', className)}
//     {...props}
//   />
// ))
// DialogDescription.displayName = DialogPrimitive.Description.displayName

// export {
//   Dialog,
//   DialogPortal,
//   DialogOverlay,
//   DialogClose,
//   DialogTrigger,
//   DialogContent,
//   DialogHeader,
//   DialogFooter,
//   DialogTitle,
//   DialogDescription,
// }

'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      [
        'fixed inset-0 z-50',
        // 更深的遮罩，弱化背景存在感
        'bg-slate-950/55',
        // 加一点冷色渐变，让整体更高级，也更能压住背景
        'backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/45',
        // 动画
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      ].join(' '),
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  hideClose?: boolean
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, hideClose = false, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        [
          'fixed left-1/2 top-1/2 z-50',
          'grid w-[min(92vw,88rem)]',
          'max-h-[calc(100vh-4rem)]',
          '-translate-x-1/2 -translate-y-1/2',
          'gap-5 overflow-hidden',
          // 弹窗本体不要再半透明，否则继续和背景混在一起
          'rounded-[2rem] bg-white',
          // 更明确的边框和描边
          'border border-slate-200/90',
          'ring-1 ring-black/5',
          // 更强的投影，形成“浮层感”
          'shadow-[0_32px_80px_rgba(15,23,42,0.22),0_12px_24px_rgba(15,23,42,0.12)]',
          // 轻微内高光，边缘更干净
          'before:pointer-events-none before:absolute before:inset-0 before:rounded-[2rem] before:ring-1 before:ring-white/70',
          // 内容区
          'p-6 pb-8',
          // 动画
          'duration-200',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
          'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          // 暗色模式
          'dark:bg-slate-950 dark:border-slate-800 dark:ring-white/10',
          'dark:before:ring-white/5',
          'dark:shadow-[0_32px_80px_rgba(0,0,0,0.55),0_12px_24px_rgba(0,0,0,0.35)]',
        ].join(' '),
        className
      )}
      {...props}
    >
      {children}

      {!hideClose ? (
        <DialogPrimitive.Close
          className={cn(
            [
              'absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full',
              'border border-slate-200 bg-white',
              'text-slate-500 shadow-sm',
              'transition-all duration-200',
              'hover:scale-[1.03] hover:bg-slate-50 hover:text-slate-900',
              'focus:outline-none focus:ring-2 focus:ring-sky-500/30',
              'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
            ].join(' ')
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      ) : null}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
    {...props}
  />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'font-display text-lg font-semibold leading-none tracking-tight text-slate-950 dark:text-slate-50',
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm leading-7 text-slate-600 dark:text-slate-300', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}