import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export default function Button({
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className="rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 transition"
    >
      {children}
    </button>
  );
}