import clsx from 'clsx';

export default function Table({ children, className }) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx('min-w-full divide-y divide-neutral-200', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className }) {
  return (
    <thead className={clsx('bg-neutral-50', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }) {
  return (
    <tbody className={clsx('bg-white divide-y divide-neutral-200', className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className, ...props }) {
  return (
    <tr className={clsx('hover:bg-neutral-50', className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHeader({ children, className }) {
  return (
    <th
      className={clsx(
        'px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className, ...props }) {
  return (
    <td
      className={clsx('px-6 py-4 whitespace-nowrap text-sm text-neutral-900', className)}
      {...props}
    >
      {children}
    </td>
  );
}
