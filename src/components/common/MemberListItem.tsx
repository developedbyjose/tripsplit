import type { Member } from '../../services/api';

interface MemberListItemProps {
  member: Member;
}

/**
 * MemberListItem
 *
 * Atomic, reusable row for displaying a single space member's
 * avatar, name, email, and role badge.
 *
 * Used in: DesktopRightPanel, SpaceSettingsView
 */
export function MemberListItem({ member }: MemberListItemProps) {
  const avatarSrc =
    member.user?.avatar_url ||
    `https://api.dicebear.com/7.x/adventurer/svg?seed=${member.user_id}`;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <img
          src={avatarSrc}
          alt={member.user?.name || 'Member'}
          className="w-7 h-7 rounded-full border border-slate-800 shrink-0"
        />
        <div>
          <h4 className="text-white text-xs font-bold">{member.user?.name}</h4>
          <p className="text-[9px] text-slate-500">{member.user?.email}</p>
        </div>
      </div>
      <span className="text-[9px] font-semibold text-primary uppercase tracking-wider bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md shrink-0">
        {member.role}
      </span>
    </div>
  );
}
