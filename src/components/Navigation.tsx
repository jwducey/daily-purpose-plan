import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PieChart, ClipboardList, Settings, Timer, Calendar, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/budget', icon: PieChart, label: 'Budget' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/review', icon: ClipboardList, label: 'Review' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border md:relative md:border-t-0 md:border-r md:h-screen md:w-20 md:flex-shrink-0">
      <div className="flex md:flex-col items-center justify-around md:justify-start md:pt-8 md:gap-2 h-16 md:h-full">
        {/* Logo - desktop only */}
        <div className="hidden md:flex items-center justify-center mb-8">
          <div className="p-2.5 rounded-xl bg-life-energy">
            <Timer className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>

        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all',
              'text-muted-foreground hover:text-foreground',
              isActive && 'text-life-energy bg-life-energy/10'
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
