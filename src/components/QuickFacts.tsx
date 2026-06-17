import { Card, CardContent } from "@/components/ui/card";
import { Zap, TrendingUp, AlertCircle, Award } from "lucide-react";

interface QuickFact {
  text: string;
  icon?: "zap" | "trending" | "alert" | "award";
}

interface QuickFactsProps {
  facts: QuickFact[] | string[];
  title?: string;
  columns?: 1 | 2 | 3;
}

const iconMap = {
  zap: Zap,
  trending: TrendingUp,
  alert: AlertCircle,
  award: Award,
};

export default function QuickFacts({ facts, title = "Quick Facts", columns = 1 }: QuickFactsProps) {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  };

  const normalizedFacts = facts.map((fact) => {
    if (typeof fact === "string") {
      return { text: fact, icon: undefined };
    }
    return fact;
  });

  return (
    <div className="space-y-6">
      {title && <h3 className="text-2xl font-bold text-foreground">{title}</h3>}
      <div className={`grid ${gridClass[columns]} gap-4`}>
        {normalizedFacts.map((fact, index) => {
          const IconComponent = fact.icon ? iconMap[fact.icon] : null;
          return (
            <Card key={index} className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 flex items-start gap-4">
                {IconComponent && (
                  <div className="flex-shrink-0 mt-1">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                )}
                <p className="text-base text-gray-700 font-medium">{fact.text}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
