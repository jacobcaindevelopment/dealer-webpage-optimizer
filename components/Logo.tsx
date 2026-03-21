export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const iconSize = size === "sm" ? "w-6 h-6" : size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${iconSize} bg-red rounded-lg flex items-center justify-center flex-shrink-0`}>
        <svg viewBox="0 0 24 24" fill="none" className={size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5"}>
          <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9" />
          <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        </svg>
      </div>
      <div>
        <div className={`${textSize} font-display font-bold tracking-tight text-txt leading-none`}>
          Dealer Webpage
        </div>
        <div className={`${size === "sm" ? "text-xs" : "text-xs"} font-display font-semibold tracking-widest text-red uppercase leading-none mt-0.5`}>
          Optimizer
        </div>
      </div>
    </div>
  );
}
