import { useAuth } from '../../contexts/AuthContext';
import RoleSwitcher from './RoleSwitcher';
import { ROLE_LABELS } from '../../utils/constants';

export default function Header() {
  const { user, role } = useAuth();

  return (
    <header className="bg-white border-b border-neutral-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Sentinel</h1>
              <p className="text-xs text-neutral-500">Insider Fraud Detection System</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <RoleSwitcher />

          <div className="border-l border-neutral-300 pl-6">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
                <p className="text-xs text-neutral-500">{ROLE_LABELS[role]}</p>
              </div>
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
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
