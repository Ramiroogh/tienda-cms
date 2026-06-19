import * as React from "react"
import { DayPicker } from "react-day-picker"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={es}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "w-fit",
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-2",
        nav: "flex items-center justify-between absolute inset-x-3 top-3",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 p-0",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 p-0",
        ),
        month_caption: "flex items-center justify-center pt-1",
        caption_label: "text-sm font-medium",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-xs text-muted-foreground font-normal pt-2 pb-1 text-center",
        weeks: "flex flex-col",
        week: "flex",
        day: "p-0",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal aria-selected:opacity-100",
        ),
        today: "bg-accent text-accent-foreground",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        chevron: "size-4",
        ...classNames,
      }}
      {...props}
    />
  )
}

export { Calendar }
