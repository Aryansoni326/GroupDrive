import * as React from "react";
import { cn } from "@groupdrive/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "interactive" | "subtle" | "bordered";
}

export function Card({
  className,
  variant = "default",
  ...props
}: CardProps) {
  const variants = {
    default: "bg-white border border-slate-200/90 shadow-card rounded-2xl",
    elevated: "bg-white border border-slate-200 shadow-elevated rounded-2xl",
    interactive:
      "bg-white border border-slate-200/90 shadow-card hover:shadow-cardHover hover:border-slate-300 hover:-translate-y-1 transition-all duration-200 ease-out rounded-2xl cursor-pointer",
    subtle: "bg-slate-50 border border-slate-200/80 rounded-2xl",
    bordered: "bg-white border-2 border-slate-200 rounded-2xl",
  };

  return (
    <div
      className={cn("overflow-hidden", variants[variant], className)}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-xl font-bold tracking-tight text-slate-900",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-slate-500 leading-relaxed", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center p-6 pt-0 border-t border-slate-100 mt-auto",
        className
      )}
      {...props}
    />
  );
}
