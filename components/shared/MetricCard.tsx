import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  variant?: "default" | "accent" | "alert";
  className?: string;
}

const MetricCard = ({ label, value, subtitle, icon, variant = "default", className }: MetricCardProps) => {
  const variantStyles = {
    default: "bg-card border-border",
    accent: "bg-primary/10 border-primary",
    alert: "bg-destructive/20 border-destructive",
  };

  return (
    <Card className={cn("card-hover border", variantStyles[variant], className)}>
      <CardContent className="p-6">
        {icon && <div className="mb-2">{icon}</div>}
        <p className="text-sm text-muted-foreground mb-2 font-body">{label}</p>
        <p className={cn(
          "text-4xl font-heading font-bold mb-1",
          variant === "accent" && "text-primary metric-glow",
          variant === "alert" && "text-destructive"
        )}>
          {value}
        </p>
        {subtitle && <p className="text-xs text-muted-foreground font-body">{subtitle}</p>}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
