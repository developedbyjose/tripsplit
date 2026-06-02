import { Users } from 'lucide-react';
import type { Member } from '../../../services/api';
import { MemberListItem } from '../../../components/common/MemberListItem';
import { InviteQRBox } from '../../../components/common/InviteQRBox';

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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Trip Settings</h2>
        <p className="text-xs text-slate-400 font-medium">
          Manage members and invite others.
        </p>
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
