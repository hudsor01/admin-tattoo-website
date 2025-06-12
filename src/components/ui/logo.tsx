'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  href?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  variant?: 'text' | 'full';
  isLinked?: boolean;
}

export function Logo({
  className,
  href = '/',
  size = 'md',
  onClick,
  variant = 'text',
  isLinked = true,
}: LogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl md:text-4xl',
    lg: 'text-4xl md:text-5xl',
    xl: 'text-5xl md:text-6xl',
  };

  const sizePixels = {
    sm: { width: 100, height: 50 },
    md: { width: 180, height: 90 },
    lg: { width: 240, height: 120 },
    xl: { width: 300, height: 150 },
  };

  const content =
    variant === 'full' ? (
      <motion.div
        className={cn('relative glow-red-hover', className)}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        whileHover={{ scale: 1.05, '--glow-opacity': 0.5, '--glow-spread': '25px' }}
      >
        <div className="relative overflow-hidden rounded-md">
          <Image
            src="/logo.png"
            alt="Ink 37 Logo"
            width={sizePixels[size].width}
            height={sizePixels[size].height}
            priority
            sizes="(max-width: 768px) 180px, 240px"
            quality={95}
            className="relative z-10"
          />
          <div className="absolute inset-0 bg-fernando-gradient opacity-40 mix-blend-overlay"></div>
        </div>
      </motion.div>
    ) : (
      <motion.span
        className={cn('font-satisfy tracking-wide inline-block', sizeClasses[size], className)}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        whileHover={{ scale: 1.05 }}
      >
        <span className="text-white">Ink</span>{' '}
        <span className="relative">
          <span className="bg-gradient-to-r from-[#E63A35] to-[#FF6800] bg-clip-text text-transparent">37</span>
          <motion.span
            className="absolute -bottom-1 -left-1 -right-1 h-0.5 bg-gradient-to-r from-primary to-secondary"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </span>
      </motion.span>
    );

  if (onClick) {
    return (
      <button className="focus:outline-none" onClick={onClick}>
        {content}
      </button>
    );
  }

  // Only wrap in Link if isLinked is true and href is provided
  return isLinked && href ? <Link href={href}>{content}</Link> : content;
}

export default Logo;
