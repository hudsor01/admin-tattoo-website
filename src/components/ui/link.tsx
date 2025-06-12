'use client';

import React from 'react';
import NextLink from 'next/link';
import { cn } from '@/lib/utils';

interface LinkProps extends React.ComponentPropsWithoutRef<typeof NextLink> {
  noWrapper?: boolean;
}

/**
 * Safe Link component that avoids nested anchor tags
 * Use this instead of directly importing from next/link to prevent hydration errors
 */
export const LinkComponent: React.FC<LinkProps> = ({
  href,
  children,
  className,
  noWrapper = false,
  ...props
}) => {
  // Check if children contains an anchor tag
  const hasNestedAnchor = React.Children.toArray(children).some((child) => {
    if (React.isValidElement(child) && typeof child.type !== 'string') {
      // For custom components, we can't reliably determine if they render an anchor
      // So we rely on the noWrapper prop
      return false;
    }
    return React.isValidElement(child) && child.type === 'a';
  });

  // If noWrapper is true or children contains an anchor tag, use passHref with a fragment
  if (noWrapper ?? hasNestedAnchor) {
    return (
      <NextLink href={href} passHref legacyBehavior {...props}>
        {children}
      </NextLink>
    );
  }

  // Otherwise, use the standard Link behavior
  return (
    <NextLink className={cn(className)} href={href} {...props}>
      {children}
    </NextLink>
  );
};

export default LinkComponent;
