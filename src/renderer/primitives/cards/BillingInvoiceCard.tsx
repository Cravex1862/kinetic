import React from 'react';
import { GlowConfig, StyleConfig, configToStyle, BaseMotionProps } from '../types';
import { buildGlowFilter } from '../utils/styleHelpers';

interface BillingInvoiceCardProps extends BaseMotionProps {
  glowConfig: GlowConfig;
  description: string;
  amount: string;
  dueDate?: string;
  status?: 'paid' | 'pending' | 'overdue';
  style?: StyleConfig;
}

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  paid: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Paid' },
  pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pending' },
  overdue: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Overdue' },
};

export const BillingInvoiceCard: React.FC<BillingInvoiceCardProps> = ({
  glowConfig,
  description,
  amount,
  dueDate,
  status,
  style,
}) => {
  const glow = buildGlowFilter(glowConfig);
  const us = configToStyle(style);
  const badge = status ? statusBadge[status] : undefined;
  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-900 px-4 py-3" style={{ ...glow, ...us }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate" style={us}>{description}</span>
          {badge && <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>}
        </div>
        {dueDate && <div className="text-xs text-gray-500 mt-0.5" style={us}>{dueDate}</div>}
      </div>
      <div className="text-sm font-semibold text-white flex-shrink-0 ml-3" style={us}>{amount}</div>
    </div>
  );
};
