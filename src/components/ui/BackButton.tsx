import Link from "next/link"
import { ChevronLeft } from "lucide-react"

type BackButtonProps = {
  href: string
}

export function BackButton({ href }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
    >
      <ChevronLeft className="h-4 w-4" />
    </Link>
  )
}
