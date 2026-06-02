import { Users } from 'lucide-react';
import type { Member } from '../../../services/api';
import { MemberListItem } from '../../../components/common/MemberListItem';
import { InviteQRBox } from '../../../components/common/InviteQRBox';
import { CURRENCY_OPTIONS } from '../../../utils/currency';
import { useCurrency } from '../../../hooks/useCurrencySetting';

interface SpaceSettingsViewProps {
  members: Member[];
  inviteToken?: string;
  copiedInvite: boolean;
  onCopyInvite: () => void;
}

/**
 * SpaceSettingsView
 *
 * Renders the "Trip Settings" tab content — invite QR card and
 * the members roster. Extracted from the inline switch-case block
 * in AppLayout to keep each feature view self-contained.
 *
 * Composes shared components: InviteQRBox, MemberListItem.
 */
export function SpaceSettingsView({
  members,
  inviteToken,
  copiedInvite,
  onCopyInvite,
}: SpaceSettingsViewProps) {
  const { currencyCode, setCurrencyCode } = useCurrency();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Trip Settings</h2>
        <p className="text-xs text-slate-400 font-medium">
          Manage members, invite others, and set the trip currency.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Currency
        </h3>
        <p className="text-[11px] text-slate-400">
          All amount displays, balances, and settlement labels use the selected currency for this trip.
        </p>
        <label className="block">
          <span className="sr-only">Select trip currency</span>
          <select
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value as typeof currencyCode)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code} className="bg-slate-950">
                {option.symbol} {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Invite QR panel */}
      <InviteQRBox
        inviteToken={inviteToken}
        copiedInvite={copiedInvite}
        onCopy={onCopyInvite}
        qrSize={130}
        subtitle="Let friends join this travel space instantly by scanning this QR code."
      />

      {/* Members roster */}
      <div className="glass-panel rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-4 h-4 text-primary" />
          Active Members ({members.length})
        </h3>
        <div className="space-y-3 pt-1">
          {members.map((m) => (
            <MemberListItem key={m.user_id} member={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
