import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatItem {
  label: string;
  value: string;
}

interface CompanyStatsProps {
  title?: string;
  stats: StatItem[];
  variant?: "default" | "compact";
}

export default function CompanyStats({ title = "Company Stats", stats, variant = "default" }: CompanyStatsProps) {
  if (variant === "compact") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white rounded-t-lg">
        <CardTitle className="text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              {stats.map((stat, index) => (
                <tr
                  key={index}
                  className={`border-b ${
                    index % 2 === 0 ? "bg-slate-50" : "bg-white"
                  } hover:bg-slate-100 transition-colors`}
                >
                  <td className="px-4 py-3 font-medium text-gray-700 w-2/3">
                    {stat.label}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-primary text-lg">
                    {stat.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
