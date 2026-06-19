import Link from "next/link"
import type { LucideIcon } from "lucide-react"

type AttributeCardProps = {
  icon: LucideIcon
  label: string
  description: string
  href: string
}

export function AttributeCard({ icon: Icon, label, description, href }: AttributeCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 rounded-xl border p-5 text-center transition-colors hover:bg-accent"
    >
      <Icon className="h-7 w-7 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Link>
  )
}
