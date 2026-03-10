import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DataListProps {
  title: string;
  items: { name: string; value: string }[];
  variant?: "default" | "dark" | "accent";
}

const DataList = ({ title, items, variant = "default" }: DataListProps) => {
  const variantStyles = {
    default: "bg-card",
    dark: "bg-muted",
    accent: "bg-secondary/20",
  };

  return (
    <Card className={`border border-border ${variantStyles[variant]}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-heading font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2 font-body">
          {items.map((item, index) => (
            <li key={index} className="flex justify-between items-center text-sm">
              <span className="text-foreground">
                {index + 1}. {item.name}
              </span>
              <span className="text-muted-foreground ml-4">{item.value}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
};

export default DataList;
