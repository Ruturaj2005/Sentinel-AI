import clsx from 'clsx';
import { STATUS_COLORS, SEVERITY_COLORS } from '../../utils/constants';

export default function Badge({ children, variant = 'neutral', className, ...props }) {
  const getVariantClass = () => {
    // Check if it's a severity or status color
    if (STATUS_COLORS[variant]) {
      return STATUS_COLORS[variant];
    }
    if (SEVERITY_COLORS[variant]) {
      return SEVERITY_COLORS[variant].badge;
    }

    // Default variants
    const variants = {
      primary: 'bg-primary-100 text-primary-700',
      accent: 'bg-accent-100 text-accent-700',
      danger: 'badge-danger',
      warning: 'badge-warning',
      success: 'badge-success',
      neutral: 'badge-neutral',
      info: 'badge-info'
    };

    return variants[variant] || variants.neutral;
  };

  return (
    <span
      className={clsx('badge', getVariantClass(), className)}
      {...props}
    >
      {children}
    </span>
  );
}
