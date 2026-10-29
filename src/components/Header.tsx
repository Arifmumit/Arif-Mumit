import React from 'react';
import { Sparkles, UploadCloud, Moon, Sun, User, Crown, LogOut, ShieldCheck, MailCheck, AlertCircle } from 'lucide-react';
import { ToolType } from '../types/image';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onOpenUpload: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTool,
  onSelectTool,
  onOpenUpload,
  darkMode,
  onToggleTheme,
  onOpenAuth,
  onOpenAdmin
}) => {
  const { currentUser, userProfile, isSuperAdmin, isAdmin, logout, resendVerificationEmail } = useAuth();
  const [resending, setResending] = React.useState<boolean>(false);
  const [sentMessage, setSentMessage] = React.useState<boolean>(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail();
      setSentMessage(true);
      setTimeout(() => setSentMessage(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setResending(false);
    }
  };

  const navItems: { id: ToolType; label: string }[] = [
    { id: 'compress', label: 'Compress' },
    { id: 'resize', label: 'Resize' },
    { id: 'crop', label: 'Crop & Rotate' },
    { id: 'convert', label: 'Convert' },
    { id: 'filters', label: 'Filter Studio' },
    { id: 'watermark', label: 'Watermark' },
    { id: 'bgremove', label: 'Background Key' },
    { id: 'metadata', label: 'EXIF & Base64' },
  ];

  return (
    <>
      {/* Unverified Email Warning Banner */}
      {currentUser && !currentUser.emailVerified && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Your email address (<span className="font-mono">{currentUser.email}</span>) is not verified yet. Please check your inbox for the verification link.
            </span>
          </div>
          <button
            onClick={handleResend}
            disabled={resending || sentMessage}
            className="px-3 py-1 bg-slate-900 text-white rounded-md text-[11px] font-bold hover:bg-slate-800 transition shrink-0"
          >
            {sentMessage ? 'Verification Link Sent!' : resending ? 'Sending...' : 'Resend Email'}
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-4 sm:px-6 h-16">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 text-slate-900 dark:text-white font-bold tracking-tight text-lg whitespace-nowrap shrink-0 group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:bg-indigo-500 transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>PixelForge</span>
          </a>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            {navItems.map((item) => {
              const isActive = activeTool === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTool(item.id)}
                  className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 text-xs ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 font-semibold'
                      : 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions + User Account / Admin + Theme Toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Admin Panel button if Admin or Super Admin */}
            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                  isSuperAdmin
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
                title={isSuperAdmin ? 'Super Admin Console' : 'Admin Console'}
              >
                <Crown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
              </button>
            )}

            {/* User Profile / Sign In */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white max-w-[120px] truncate">
                    {userProfile?.displayName || currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {userProfile?.role?.replace('_', ' ').toUpperCase() || 'USER'}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            <button
              onClick={onToggleTheme}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 active:scale-95 transition shadow-sm shadow-indigo-600/20 whitespace-nowrap shrink-0"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Open Image</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
