import { Priority } from "@/lib/types";

const PRIORITY_STYLES: Record<Priority, string> = {
  "Fix Now": "bg-red/15 text-red border-red/30",
  "High Opportunity": "bg-amb/15 text-amb border-amb/30",
  "Needs Content Rebuild": "bg-blu/15 text-blu border-blu/30",
  Monitor: "bg-grn/15 text-grn border-grn/30",
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${PRIORITY_STYLES[priority]}`}>
      {priority}
    </span>
  );
}
