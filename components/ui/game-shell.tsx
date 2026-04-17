'use client';

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function ViewFrame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('shell-container', className)}>{children}</div>;
}

type PanelTone = 'default' | 'soft' | 'raised';
type PanelPadding = 'sm' | 'md' | 'lg';

const panelToneClass: Record<PanelTone, string> = {
  default: 'game-panel',
  soft: 'game-panel game-panel-soft',
  raised: 'game-panel game-panel-raised',
};

const panelPaddingClass: Record<PanelPadding, string> = {
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-[18px]',
  lg: 'p-4 sm:p-[22px]',
};

export function Panel({
  children,
  className,
  tone = 'default',
  padding = 'md',
}: {
  children: ReactNode;
  className?: string;
  tone?: PanelTone;
  padding?: PanelPadding;
}) {
  return <div className={cn(panelToneClass[tone], panelPaddingClass[padding], className)}>{children}</div>;
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? <div className="section-kicker">{eyebrow}</div> : null}
        <div className="space-y-1">
          <h2 className="text-[1.625rem] font-display font-bold tracking-tight text-foreground sm:text-3xl">{title}</h2>
          {subtitle ? <p className="max-w-2xl text-sm leading-6 text-muted sm:text-[15px]">{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatChip({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: string | number;
  icon?: ElementType;
  className?: string;
}) {
  return (
    <div className={cn('hud-chip', className)}>
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-3.5 w-3.5 text-primary/90" /> : null}
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">{label}</span>
      </div>
      <span className="text-sm font-display font-bold text-foreground sm:text-base">{value}</span>
    </div>
  );
}

type SegmentedOption = {
  id: string;
  label: string;
  shortLabel?: string;
  icon?: ElementType;
};

export function SegmentedControl({
  value,
  onChange,
  options,
  className,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SegmentedOption[];
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('segmented-control', compact && 'segmented-control-compact', className)}>
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={isActive}
            className={cn('segmented-control-button', isActive && 'segmented-control-button-active')}
          >
            {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
            <span className="truncate">{option.shortLabel ?? option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

type ShellButtonVariant = 'primary' | 'secondary' | 'ghost';
type ShellButtonSize = 'sm' | 'md' | 'icon';

const shellButtonVariantClass: Record<ShellButtonVariant, string> = {
  primary: 'shell-button shell-button-primary',
  secondary: 'shell-button shell-button-secondary',
  ghost: 'shell-button shell-button-ghost',
};

const shellButtonSizeClass: Record<ShellButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm sm:px-5',
  icon: 'h-9 w-9 p-0',
};

export function ShellButton({
  className,
  variant = 'secondary',
  size = 'md',
  children,
  ...props
}: ComponentPropsWithoutRef<'button'> & {
  variant?: ShellButtonVariant;
  size?: ShellButtonSize;
}) {
  return (
    <button className={cn(shellButtonVariantClass[variant], shellButtonSizeClass[size], className)} {...props}>
      {children}
    </button>
  );
}
