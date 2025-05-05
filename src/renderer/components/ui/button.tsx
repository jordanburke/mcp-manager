import * as React from "react"
import { Button as MantineButton, ButtonProps as MantineButtonProps } from "@mantine/core"

export interface ButtonProps extends Omit<MantineButtonProps, "variant"> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

// Mapping from our custom variants to Mantine variants
const variantMapping = {
  default: "filled",
  destructive: "filled",
  outline: "outline",
  secondary: "light",
  ghost: "subtle",
  link: "transparent",
}

// Mapping from our custom colors to Mantine colors
const colorMapping = {
  default: "blue",
  destructive: "red",
  outline: "gray",
  secondary: "gray",
  ghost: "gray",
  link: "blue",
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", color, ...props }, ref) => {
    // Map our custom variants to Mantine variants
    const mantineVariant = variantMapping[variant as keyof typeof variantMapping] || "filled"

    // Set color based on variant if not explicitly provided
    const mantineColor = color || colorMapping[variant as keyof typeof colorMapping]

    return (
      <MantineButton
        ref={ref}
        variant={mantineVariant}
        color={mantineColor}
        size={size}
        className={className}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button }
