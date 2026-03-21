interface Step {
  label: string;
  index: number;
}

interface Props {
  steps: Step[];
  current: number;
}

export default function StepIndicator({ steps, current }: Props) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.index} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              active ? "bg-red/15 text-red border border-red/30" :
              done ? "text-grn" :
              "text-txt-4"
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                active ? "bg-red text-white" :
                done ? "bg-grn text-white" :
                "bg-surface-3 text-txt-4"
              }`}>
                {done ? "✓" : step.index + 1}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px mx-1 ${done ? "bg-grn/40" : "bg-border-2"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
