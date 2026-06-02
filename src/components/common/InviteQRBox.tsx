import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy } from 'lucide-react';

interface InviteQRBoxProps {
  inviteToken?: string;
  copiedInvite: boolean;
  onCopy: () => void;
  /** QR code pixel size — defaults to 130 */
  qrSize?: number;
  /** Optional subtitle override */
  subtitle?: string;
}

/**
 * InviteQRBox
 *
 * Reusable invite panel displaying a QR code, the raw invite token,
 * and a copy-to-clipboard button. Shows an animated skeleton while
 * the token is being fetched.
 *
 * Used in: DesktopRightPanel, SpaceSettingsView
 */
export function InviteQRBox({
  inviteToken,
  copiedInvite,
  onCopy,
  qrSize = 130,
  subtitle = 'Friends can join this travel space instantly by scanning this QR code.',
}: InviteQRBoxProps) {
  return (
    <div className="glass-panel rounded-2xl p-5 text-center flex flex-col items-center space-y-4">
      <div className="inline-flex p-2 rounded-xl bg-primary/10 text-primary">
        <QrCode className="w-5 h-5" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white">Invite Travel Buddy</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">{subtitle}</p>
      </div>

      {inviteToken ? (
        <div className="bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
          <QRCodeSVG value={inviteToken} size={qrSize} level="M" />
        </div>
      ) : (
        <div
          className="bg-slate-900 animate-pulse rounded-2xl"
          style={{ width: qrSize, height: qrSize }}
        />
      )}

      <div className="flex gap-2 w-full pt-1.5">
        <div className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3.5 py-2.5 rounded-xl truncate text-left font-mono">
          {inviteToken || 'Loading...'}
        </div>
        <button
          onClick={onCopy}
          className="bg-primary hover:bg-primary/90 text-white p-2.5 rounded-xl text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1 transition-all active:scale-95"
        >
          <Copy className="w-4 h-4" />
          <span>{copiedInvite ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
}
