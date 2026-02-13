export function SkillArionLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 2L3 7V17L12 22L21 17V7L12 2Z"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M12 8V16M8 10L12 8L16 10M8 14L12 16L16 14"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-tight text-foreground">
          SkillArion
        </span>
        <span className="text-[10px] font-medium leading-tight text-muted-foreground">
          Work Tracker
        </span>
      </div>
    </div>
  )
}
