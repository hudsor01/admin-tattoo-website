import React from 'react';
import { Toaster as SonnerToaster } from 'sonner';

export interface ToasterProps extends React.ComponentProps<typeof SonnerToaster> {
  /** Position where toasts will appear */
  position?:
    | 'top-left'
    | 'top-right'
    | 'top-center'
    | 'bottom-left'
    | 'bottom-right'
    | 'bottom-center';
  /** Base duration for toasts (in ms) */
  duration?: number;
  /** Theme for the toasts (system uses the user's system preference) */
  theme?: 'light' | 'dark' | 'system';
  /** Whether to use richer, more saturated colors */
  richColors?: boolean;
  /** Gap between toasts */
  gap?: number;
  /** Whether to show close button on toasts */
  closeButton?: boolean;
  /** Directions to swipe to close toasts */
  swipeDirections?: Array<'left' | 'right'>;
  /** Additional class name for the toaster */
  className?: string;
}

/**
 * Renders the toast container
 */
export function Toaster({
  position = 'bottom-right',
  theme = 'system',
  richColors = true,
  duration = 5000,
  closeButton = true,
  swipeDirections = ['right'],
  className = '',
  ...props
}: ToasterProps) {
  return (
    <SonnerToaster
      position={position}
      theme={theme}
      richColors={richColors}
      duration={duration}
      closeButton={closeButton}
      className={`toaster ${className}`}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          success: 'group-[.toast]:border-green-500 group-[.toast]:text-green-700',
          error: 'group-[.toast]:border-red-500 group-[.toast]:text-red-700',
          warning: 'group-[.toast]:border-amber-500 group-[.toast]:text-amber-700',
          info: 'group-[.toast]:border-blue-500 group-[.toast]:text-blue-700',
        },
      }}
      swipeDirections={swipeDirections}
      {...props}
    />
  );
}
