import { getTextSize } from "@/lib/text-sizes";

export function PageHeader({ title, subtitle, actions, isRTL }: any) {
  return (
    <div
      className={`flex flex-col sm:flex-row justify-between gap-4 ${
        isRTL ? "sm:flex-row-reverse" : ""
      }`}
    >
      <div className={isRTL ? "text-right" : "text-left"}>
        <h1 className={`font-bold ${getTextSize("h1")}`}>{title}</h1>
        <p className={`text-muted-foreground ${getTextSize("body")}`}>
          {subtitle}
        </p>
      </div>
      {actions}
    </div>
  );
}
