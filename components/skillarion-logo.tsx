import Image from "next/image"

export function SkillArionLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex h-10 w-10 items-center justify-center">
        <Image
          src="/skillarion-logo.jpeg"
          alt="SkillArion Development Logo"
          width={40}
          height={40}
          className="object-contain"
        />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-tight">
          <span style={{ color: '#1E2058' }}>Skill</span>
          <span style={{ color: '#AF9457' }}>A</span>
          <span style={{ color: '#1E2058' }}>rion Development</span>
        </span>
        <span className="text-[10px] font-medium leading-tight text-muted-foreground">
          Work Progress Tracker
        </span>
      </div>
    </div>
  )
}
