'use client';

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
// Comparison data interface
interface ComparisonData {
  previousValue: string;
  previousPeriod: string;
  yearOverYear: number;
}

// Metric card props interface
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  description?: string;
  href?: string;
  variant?: 'default' | 'revenue' | 'customers' | 'appointments' | 'critical' | 'success' | 'metallic';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  comparison?: string | ComparisonData;
  showProgress?: boolean;
}

export default function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  description,
  href,
  variant = 'default',
  priority = 'medium',
  comparison,
  showProgress = false,
}: MetricCardProps) {
  // Enhanced gradient overlay based on variant and priority
  const getGradientOverlay = () => {
    switch (variant) {
      case 'critical':
        return 'bg-gradient-to-br from-red-500/20 to-red-700/10';
      case 'success':
        return 'bg-gradient-to-br from-slate-400/15 to-slate-600/10';
      case 'metallic':
        return 'bg-gradient-to-br from-gray-400/20 to-gray-600/10';
      default:
        return 'bg-gradient-to-br from-primary/5 to-transparent';
    }
  };

  // Enhanced value styling based on priority
  const getValueClassName = () => {
    const base = 'admin-metric-value';
    switch (priority) {
      case 'critical':
        return cn(base, 'critical-metric');
      case 'high':
        return cn(base, 'success-metric');
      case 'low':
        return cn(base, 'neutral-metric');
      default:
        return base;
    }
  };

  // Enhanced icon styling
  const getIconClassName = () => {
    const base = 'p-2.5 rounded-xl transition-all duration-300';
    switch (variant) {
      case 'critical':
        return cn(base, 'bg-red-100/20 text-white group-hover:bg-red-200/30 group-hover:scale-110');
      case 'success':
        return cn(base, 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 group-hover:bg-slate-300 dark:group-hover:bg-slate-600');
      case 'metallic':
        return cn(base, 'bg-white/20 text-white group-hover:scale-110 group-hover:bg-white/30');
      default:
        return cn(base, 'bg-accent text-accent-foreground group-hover:bg-accent/80');
    }
  };

  const cardContent = (
    <>
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500", getGradientOverlay())} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="admin-metric-title tracking-wider uppercase text-xs font-semibold">
          {title}
        </CardTitle>
        <div className={getIconClassName()} aria-hidden="true">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-3">
          <div className={getValueClassName()}>{value}</div>
          {(change !== undefined || description) && (
            <div className="admin-metric-comparison">
              {change !== undefined && (
                <Badge
                  variant="outline"
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border-2',
                    trend === 'up' && 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800',
                    trend === 'down' && 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800',
                    trend === 'neutral' && 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700'
                  )}
                >
                  {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
                  {trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
                  {change > 0 && '+'}
                  {change}%
                </Badge>
              )}
              <p className="admin-text-small text-xs opacity-75">
                {description ?? 'from last month'}
              </p>
            </div>
          )}
          {comparison && (
            <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-border/40">
              {typeof comparison === 'object' && comparison.previousValue && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Previous:</span>
                  <span className="font-medium">{comparison.previousValue}</span>
                </div>
              )}
              {typeof comparison === 'object' && comparison.yearOverYear !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">YoY:</span>
                  <span className={cn(
                    "font-medium",
                    comparison.yearOverYear > 0 ? "text-emerald-600 dark:text-emerald-400" : 
                    comparison.yearOverYear < 0 ? "text-red-600 dark:text-red-400" : 
                    "text-muted-foreground"
                  )}>
                    {typeof comparison === 'object' && comparison.yearOverYear > 0 && '+'}
                    {typeof comparison === 'object' && comparison.yearOverYear}%
                  </span>
                </div>
              )}
            </div>
          )}
          {showProgress && (
            <div className="mt-3">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.abs(change ?? 0))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </>
  );

  // Enhanced card className based on variant
  const getCardClassName = (withLink = false) => {
    const baseClasses = cn(
      'relative overflow-hidden transition-all duration-500 group h-full',
      'flex flex-col justify-between',
      comparison ? 'min-h-[200px]' : 'min-h-[160px]',
      withLink && 'cursor-pointer'
    );

    switch (variant) {
      case 'critical':
        return cn(baseClasses, 'metric-card-critical hover:scale-[1.03]');
      case 'success':
        return cn(baseClasses, 'metric-card-success hover:scale-[1.02]');
      case 'metallic':
        return cn(baseClasses, 'metric-card', 'metallic-gradient hover:scale-[1.02]');
      default:
        return cn(baseClasses, 'metric-card hover:scale-[1.02]');
    }
  };

  if (href) {
    return (
      <Link href={href} className="block h-full">
        <Card className={getCardClassName(true)}>
          {cardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card className={getCardClassName()}>
      {cardContent}
    </Card>
  );
}
