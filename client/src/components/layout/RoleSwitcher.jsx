import { useAuth } from '../../contexts/AuthContext';
import { ROLES, ROLE_LABELS } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';

export default function RoleSwitcher() {
  const { role, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = async (newRole) => {
    if (newRole !== role) {
      await switchRole(newRole);
      navigate(`/${newRole}/dashboard`, { replace: true });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-600">Demo Mode:</span>
      <select
        value={role}
        onChange={(e) => handleRoleChange(e.target.value)}
        className="input text-sm py-1.5"
      >
        <option value={ROLES.EMPLOYEE}>{ROLE_LABELS[ROLES.EMPLOYEE]}</option>
        <option value={ROLES.MANAGER}>{ROLE_LABELS[ROLES.MANAGER]}</option>
        <option value={ROLES.INVESTIGATOR}>{ROLE_LABELS[ROLES.INVESTIGATOR]}</option>
      </select>
    </div>
  );
}
