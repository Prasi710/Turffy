import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'TurfHub - Book Your Turf',
  description: 'Find and book the best turfs in your city',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}