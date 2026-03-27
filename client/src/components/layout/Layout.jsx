import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-cyan-200/55 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-36 h-80 w-80 rounded-full bg-emerald-200/45 blur-3xl" />

      <div className="relative">
        <Header />
        <div className="mx-auto flex w-full max-w-[1400px] gap-4 px-4 pb-6 pt-4 md:px-6">
          <Sidebar />
          <main className="flex-1 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
