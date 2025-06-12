'use client';

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

// Component-specific types - not shared, inline definition appropriate
interface LinearProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

interface StepIndicatorStep {
  label: string;
  description?: string;
  status: 'complete' | 'current' | 'pending' | 'error';
}

interface StepIndicatorProps {
  steps: StepIndicatorStep[];
  className?: string;
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface PulseDotProps {
  color?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LinearProgress({
  value,
  max = 100,
  className,
  showLabel = false,
  color = 'primary',
}: LinearProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div className={className}>
      <div className="relative">
        <Progress value={percentage} className="h-2" />
        <motion.div
          className={`absolute top-0 left-0 h-2 rounded-full ${colorClasses[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.5,
            ease: 'easeOut',
          }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-sm text-muted-foreground">{Math.round(percentage)}%</div>
      )}
    </div>
  );
}

export function CircularProgress({
  value,
  max = 100,
  size = 40,
  strokeWidth = 4,
  className,
  showLabel = false,
  color = 'primary',
}: CircularProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    primary: 'stroke-primary',
    success: 'stroke-green-500',
    warning: 'stroke-yellow-500',
    error: 'stroke-red-500',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted-foreground/20"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={colorClasses[color]}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 0.8,
            ease: 'easeOut',
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}

export function StepIndicator({ steps, className }: StepIndicatorProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step: StepIndicatorStep, index: number) => {
        const isLast = index === steps.length - 1;

        const statusConfig = {
          complete: {
            icon: CheckCircle,
            iconColor: 'text-green-500',
            bgColor: 'bg-green-500',
            textColor: 'text-foreground',
          },
          current: {
            icon: Loader2,
            iconColor: 'text-primary',
            bgColor: 'bg-primary',
            textColor: 'text-foreground',
          },
          pending: {
            icon: null,
            iconColor: 'text-muted-foreground',
            bgColor: 'bg-muted',
            textColor: 'text-muted-foreground',
          },
          error: {
            icon: XCircle,
            iconColor: 'text-red-500',
            bgColor: 'bg-red-500',
            textColor: 'text-foreground',
          },
        };

        const config = statusConfig[step.status];
        const Icon = config.icon;

        return (
          <div key={step.label} className="flex items-start">
            <div className="flex flex-col items-center mr-4">
              <motion.div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step.status === 'pending' ? config.bgColor : config.bgColor
                } ${step.status === 'pending' ? 'border-2 border-current' : ''}`}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                {Icon ? (
                  <Icon
                    className={`w-4 h-4 ${
                      step.status === 'pending' ? config.iconColor : 'text-white'
                    } ${step.status === 'current' ? 'animate-spin' : ''}`}
                  />
                ) : (
                  <div className={`w-2 h-2 rounded-full ${config.iconColor} bg-current`} />
                )}
              </motion.div>
              {!isLast && (
                <div
                  className={`w-px h-8 mt-2 ${
                    step.status === 'complete' ? 'bg-green-500' : 'bg-muted'
                  }`}
                />
              )}
            </div>
            <div className="flex-1 pb-8">
              <motion.h3
                className={`text-sm font-medium ${config.textColor}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.1 }}
              >
                {step.label}
              </motion.h3>
              {step.description && (
                <motion.p
                  className="text-xs text-muted-foreground mt-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                >
                  {step.description}
                </motion.p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LoadingDots({ size = 'md', className }: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={`item-${index}`}
          className={`${sizeClasses[size]} bg-current rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function PulseDot({ color = 'primary', size = 'md', className }: PulseDotProps) {
  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.8, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className={`absolute inset-0 ${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
        animate={{
          scale: [1, 2, 1],
          opacity: [0.7, 0, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
