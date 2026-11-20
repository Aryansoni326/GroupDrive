import * as React from "react";
import { cn } from "@groupdrive/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 transition-all placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 shadow-subtle",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>
        {error ? (
          <p className="text-xs font-medium text-rose-600">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
