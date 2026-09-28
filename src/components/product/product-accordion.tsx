import type { ReactNode } from "react";
import { PlusIcon } from "@/components/icons";

export function ProductAccordion({
  items,
}: {
  items: { title: string; content: ReactNode; open?: boolean }[];
}) {
  return (
    <div className="border-t">
      {items.map((item) => (
        <details key={item.title} open={item.open} className="group border-b">
          <summary className="flex cursor-pointer list-none items-center justify-between py-5 ui-label [&::-webkit-details-marker]:hidden">
            {item.title}
            <PlusIcon
              width={16}
              height={16}
              className="transition-transform duration-300 ease-standard group-open:rotate-45"
            />
          </summary>
          <div className="pb-6 text-body-sm text-ink-muted">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
