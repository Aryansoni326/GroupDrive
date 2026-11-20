import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@groupdrive/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-sm",
        primary:
          "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
        outline:
          "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 text-slate-700",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900 text-slate-700",
        link:
          "text-slate-900 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

