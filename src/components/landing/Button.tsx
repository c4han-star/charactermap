import Link from "next/link";
import type { ComponentProps } from "react";

type BaseProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
};

type ButtonAsButton = BaseProps &
  Omit<ComponentProps<"button">, "className" | "children" | "type"> & {
    href?: undefined;
    type?: ComponentProps<"button">["type"];
  };

type ButtonAsLink = BaseProps &
  Omit<ComponentProps<typeof Link>, "className" | "children"> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ring)] disabled:pointer-events-none disabled:opacity-50";

const variantStyles = {
  primary: `${baseStyles} bg-accent text-white hover:bg-accent-hover`,
  secondary: `${baseStyles} border border-border bg-surface-elevated text-foreground hover:bg-surface hover:border-zinc-600`,
  ghost: `${baseStyles} text-muted hover:text-foreground hover:bg-white/5`,
} as const;

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const styles = `${variantStyles[variant]} ${className}`.trim();

  if ("href" in props && props.href) {
    const { href, children, ...linkProps } = props;
    return (
      <Link href={href} className={styles} {...linkProps}>
        {children}
      </Link>
    );
  }

  const { children, type = "button", ...buttonProps } = props as ButtonAsButton;
  return (
    <button type={type} className={styles} {...buttonProps}>
      {children}
    </button>
  );
}
