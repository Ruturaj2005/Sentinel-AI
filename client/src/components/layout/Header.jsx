import { useAuth } from '../../contexts/AuthContext';
import RoleSwitcher from './RoleSwitcher';
import { ROLE_LABELS } from '../../utils/constants';

export default function Header() {
  const { user, role } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-200 bg-primary-500">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">Sentinel</h1>
              <p className="text-xs text-slate-500">Insider Fraud Detection Platform</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <RoleSwitcher />

          <div className="border-l border-slate-300 pl-6">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{ROLE_LABELS[role]}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                <span className="text-white font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
