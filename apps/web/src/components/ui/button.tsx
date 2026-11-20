import * as React from "react";
import { cn } from "@groupdrive/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "primary"
    | "obsidian"
    | "secondary"
    | "outline"
    | "ghost"
    | "success"
    | "destructive"
    | "link";
  size?: "xs" | "sm" | "default" | "lg" | "xl" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const resolvedVariant = variant === "primary" ? "default" : variant;
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]";

    const variants = {
      default:
        "bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow active:bg-blue-800",
      obsidian:
        "bg-slate-900 text-white shadow-sm hover:bg-slate-800 hover:shadow active:bg-slate-950",
      secondary:
        "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-200/60",
      outline:
        "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 shadow-subtle",
      ghost:
        "text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
      success:
        "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow active:bg-emerald-800",
      destructive:
        "bg-rose-600 text-white shadow-sm hover:bg-rose-700 hover:shadow active:bg-rose-800",
      link:
        "text-blue-600 underline-offset-4 hover:underline p-0 h-auto font-medium active:scale-100",
    };

    const sizes = {
      xs: "h-7 px-2.5 text-xs rounded-md gap-1.5",
      sm: "h-9 px-3.5 text-xs rounded-lg gap-2",
      default: "h-11 px-5 text-sm rounded-xl gap-2",
      lg: "h-12 px-6 text-base rounded-xl gap-2.5",
      xl: "h-14 px-8 text-base font-bold rounded-2xl gap-3 shadow-card hover:shadow-cardHover",
      icon: "h-10 w-10 rounded-xl justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[resolvedVariant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Please wait...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
