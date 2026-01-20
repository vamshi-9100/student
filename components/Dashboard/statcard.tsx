import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getTextSize } from "@/lib/text-sizes";

export function StatCard({ title, value, icon: Icon, footer, isRTL }: any) {
  return (
    <Card className="dark:bg-gray-800">
      <CardContent className="p-4 space-y-2">
        <div
          className={`flex justify-between items-center ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <span className={`text-muted-foreground ${getTextSize("cardText")}`}>
            {title}
          </span>
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>

        <div className={`font-bold ${getTextSize("h2")}`}>{value}</div>

        <Progress value={70} />

        <p className={`text-green-600 ${getTextSize("caption")}`}>{footer}</p>
      </CardContent>
    </Card>
  );
}
