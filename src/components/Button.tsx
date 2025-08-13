import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600";
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-blue-50",
    ghost: "text-slate-700 hover:bg-blue-50",
  };
  const width = fullWidth ? "w-full" : "";

  return (
    <button className={`${base} ${variants[variant]} ${width} ${className}`} {...rest}>
      {children}
    </button>
  );
}


