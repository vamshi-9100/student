import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTextSize } from "@/lib/text-sizes";

export function ChartCard({ title, children, isRTL }: any) {
  return (
    <Card className="dark:bg-gray-800">
      <CardHeader className={isRTL ? "text-right" : "text-left"}>
        <CardTitle className={getTextSize("cardTitle")}>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
