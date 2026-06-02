import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useCurrency } from '../../hooks/useCurrencySetting';
import { History, Pencil, PlusCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface ActivityFeedProps {
  spaceId: string;
}

export function ActivityFeed({ spaceId }: ActivityFeedProps) {
  const { formatMoney } = useCurrency();
  const { data: activity = [], isLoading, error } = useQuery({
    queryKey: ['space-activity', spaceId],
    queryFn: () => api.getSpaceActivityLog(spaceId),
  });

  const getActivityText = (h: any) => {
    const editor = h.editor_name || 'Someone';
    
    switch (h.field_name) {
      case 'created':
        return {
          icon: <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />,
          text: (
            <span>
              <strong className="text-white font-semibold">{editor}</strong> added{' '}
              <span className="text-slate-300 font-medium">{h.new_value}</span>
            </span>
          )
        };
      case 'title':
        return {
          icon: <Pencil className="w-3.5 h-3.5 text-blue-400" />,
          text: (
            <span>
              <strong className="text-white font-semibold">{editor}</strong> renamed an expense to{' '}
              <strong className="text-slate-300">"{h.new_value}"</strong>{' '}
              <span className="text-slate-500 line-through">(was "{h.old_value}")</span>
            </span>
          )
        };
      case 'amount':
        return {
          icon: <Pencil className="w-3.5 h-3.5 text-amber-400" />,
          text: (
              <span>
                <strong className="text-white font-semibold">{editor}</strong> updated amount to{' '}
              <strong className="text-emerald-400">{formatMoney(Number(h.new_value))}</strong>{' '}
              <span className="text-slate-500 line-through">(was {formatMoney(Number(h.old_value))})</span>
              </span>
            )
          };
      case 'category':
        return {
          icon: <Pencil className="w-3.5 h-3.5 text-violet-400" />,
          text: (
            <span>
              <strong className="text-white font-semibold">{editor}</strong> changed category to{' '}
              <strong className="text-slate-300">{h.new_value}</strong>{' '}
              <span className="text-slate-500 line-through">({h.old_value})</span>
            </span>
          )
        };
      case 'paid_by':
        return {
          icon: <Pencil className="w-3.5 h-3.5 text-indigo-400" />,
          text: (
            <span>
              <strong className="text-white font-semibold">{editor}</strong> updated the payer details.
            </span>
          )
        };
      case 'settled':
        return {
          icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
          text: (
            <span className="text-emerald-400 font-semibold">
              {h.new_value}
            </span>
          )
        };
      default:
        return {
          icon: <HelpCircle className="w-3.5 h-3.5 text-slate-400" />,
          text: (
            <span>
              <strong className="text-white font-semibold">{editor}</strong> updated {h.field_name}
            </span>
          )
        };
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 flex flex-col justify-center items-center gap-2">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] text-slate-500">Loading activity feed...</p>
      </div>
    );
  }

  if (error) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-primary" /> Activity Feed
        </h2>
      </div>

      <div className="glass-panel rounded-2xl p-5 relative overflow-hidden">
        {activity.length === 0 ? (
          <p className="text-slate-400 text-xs text-center py-4">No recent activity logged.</p>
        ) : (
          <div className="relative border-l border-slate-900 ml-2.5 pl-5 space-y-5.5">
            {activity.slice(0, 10).map((h) => {
              const item = getActivityText(h);
              return (
                <div key={h.id} className="relative group">
                  {/* Timeline Dot Indicator */}
                  <div className="absolute left-[-28px] top-0.5 bg-slate-950 p-1 rounded-full border border-slate-800 group-hover:border-primary transition-colors">
                    {item.icon}
                  </div>
                  
                  {/* Activity Details */}
                  <div className="space-y-1">
                    <p className="text-[11.5px] leading-relaxed text-slate-400">
                      {item.text}
                    </p>
                    <span className="text-[8px] text-slate-500 font-semibold block">
                      {new Date(h.edited_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(h.edited_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
