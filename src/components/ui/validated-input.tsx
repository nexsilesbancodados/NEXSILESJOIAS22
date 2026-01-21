import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  showSuccessIcon?: boolean;
}

const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ className, label, error, touched, required, showSuccessIcon = false, ...props }, ref) => {
    const hasError = touched && error;
    const isValid = touched && !error && props.value && showSuccessIcon;

    return (
      <div className="space-y-1.5">
        {label && (
          <Label className={cn(hasError && "text-destructive")}>
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
        )}
        <div className="relative">
          <Input
            ref={ref}
            className={cn(
              "pr-10 transition-colors",
              hasError && "border-destructive focus-visible:ring-destructive/30",
              isValid && "border-green-500 focus-visible:ring-green-500/30",
              className
            )}
            aria-invalid={hasError ? "true" : undefined}
            aria-describedby={hasError ? `${props.id}-error` : undefined}
            {...props}
          />
          {hasError && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
          )}
          {isValid && (
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
          )}
        </div>
        {hasError && (
          <p 
            id={`${props.id}-error`} 
            className="text-xs text-destructive flex items-center gap-1 animate-fade-in"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

export { ValidatedInput };
