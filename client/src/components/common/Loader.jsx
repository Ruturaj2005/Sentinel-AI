export default function Loader({ size = 'md', text = '' }) {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizes[size]} border-4 border-neutral-200 border-t-primary rounded-full animate-spin`}></div>
      {text && <p className="mt-4 text-sm text-neutral-600">{text}</p>}
    </div>
  );
}
