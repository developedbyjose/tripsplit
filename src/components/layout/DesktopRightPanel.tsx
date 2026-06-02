import { Users } from 'lucide-react';
import type { Member } from '../../services/api';
import { MemberListItem } from '../common/MemberListItem';
import { InviteQRBox } from '../common/InviteQRBox';

interface DesktopRightPanelProps {
  members: Member[];
  inviteToken?: string;
  copiedInvite: boolean;
  onCopyInvite: () => void;
}

/**
 * DesktopRightPanel
 *
 * Right-hand contextual sidebar shown only on lg+ screens.
 * Displays a members summary list and the shared invite QR card.
 */
export function DesktopRightPanel({
  members,
  inviteToken,
  copiedInvite,
  onCopyInvite,
}: DesktopRightPanelProps) {
  return (
    <aside className="hidden lg:flex flex-col w-[320px] bg-slate-950/80 border-l border-slate-900/80 p-5 shrink-0 z-30 space-y-6 overflow-y-auto">
      {/* Members list */}
      <div className="glass-panel rounded-2xl p-4 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-4 h-4 text-primary" />
          Active Members ({members.length})
        </h3>
        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
          {members.map((m) => (
            <MemberListItem key={m.user_id} member={m} />
          ))}
        </div>
      </div>

      {/* Invite QR */}
      <InviteQRBox
        inviteToken={inviteToken}
        copiedInvite={copiedInvite}
        onCopy={onCopyInvite}
        qrSize={140}
      />
    </aside>
  );
}
