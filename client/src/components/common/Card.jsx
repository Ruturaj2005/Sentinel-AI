import clsx from 'clsx';

export default function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={clsx(
        'card',
        hover && 'card-hover cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
