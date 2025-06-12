import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Type for Lucide React icons - matches the actual props
interface LucideIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
}

type LucideIcon = React.ComponentType<LucideIconProps>;

export type IconSize =
  | 'xs' // 12px
  | 'sm' // 16px
  | 'md' // 20px
  | 'lg' // 24px
  | 'xl' // 32px
  | '2xl'; // 40px

export type IconVariant =
  | 'default'
  | 'brand' // Primary color
  | 'muted' // Muted foreground color
  | 'accent' // Accent color
  | 'success' // Success color
  | 'warning' // Warning color
  | 'error' // Destructive color
  | 'subtle' // Low opacity foreground
  | 'inherit'; // Inherit color from parent

// Size classes for backward compatibility
const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
  '2xl': 'h-10 w-10',
};

// Map size to pixel values for LucideIcons
const sizePixels = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
};

// Map variant to color classes
const variantClasses = {
  default: 'text-foreground',
  brand: 'text-primary',
  muted: 'text-muted-foreground',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-destructive',
  subtle: 'text-foreground/50',
  inherit: '',
};

// Basic type for any icon component
export interface BaseIconProps {
  /**
   * Icon size
   * @default md
   */
  size?: IconSize | string;

  /**
   * Additional class names
   */
  className?: string;
}

// Basic type for backward compatibility
export type SimpleIconProps = React.SVGProps<SVGSVGElement> & BaseIconProps;

/**
 * Enhanced Icon props for the new Icon component
 */
export interface EnhancedIconProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'className'>,
    BaseIconProps {
  /**
   * The icon component to render (from lucide-react)
   */
  icon: LucideIcon;

  /**
   * Icon color variant
   * @default default
   */
  variant?: IconVariant;

  /**
   * Whether to add a subtle spin animation
   * @default false
   */
  spinning?: boolean;

  /**
   * Whether to add a subtle pulse animation
   * @default false
   */
  pulsing?: boolean;

  /**
   * Stroke width override (1-2 is thinner, 2 is default, 2-3 is thicker)
   */
  strokeWidth?: number;
}

/**
 * Simplified Icon component for backward compatibility
 */
export const Icon = forwardRef<SVGSVGElement, SimpleIconProps & { icon: React.ElementType }>(
  ({ icon: IconComponent, size = 'md', className, ...props }, ref) => {
    // Get size class or use custom size
    const sizeClass = sizeClasses[size as keyof typeof sizeClasses] ?? '';

    return (
      <IconComponent ref={ref} className={cn(sizeClass, className)} aria-hidden="true" {...props} />
    );
  }
);

Icon.displayName = 'Icon';

/**
 * Enhanced Icon component for the new design system
 * Uses Lucide icons with consistent styling across the application
 */
export const IconEnhanced = forwardRef<HTMLDivElement, EnhancedIconProps>(
  (
    {
      icon: IconComponent,
      variant = 'default',
      size = 'md',
      spinning = false,
      pulsing = false,
      strokeWidth,
      className,
      ...props
    },
    ref
  ) => {
    // Combine animations if needed
    const getAnimationClasses = () => {
      if (spinning && pulsing) {
        return 'animate-spin-slow animate-pulse';
      }
      if (spinning) {
        return 'animate-spin-slow';
      }
      if (pulsing) {
        return 'animate-pulse';
      }
      return '';
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center',
          variantClasses[variant as IconVariant],
          getAnimationClasses(),
          className
        )}
        {...props}
      >
        <IconComponent
          size={sizePixels[size as IconSize] ?? sizePixels.md}
          {...(strokeWidth !== undefined ? { strokeWidth } : {})}
          className="transition-colors duration-[--transition-fast]"
        />
      </div>
    );
  }
);

IconEnhanced.displayName = 'IconEnhanced';

export default Icon;
