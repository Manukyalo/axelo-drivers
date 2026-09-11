import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListChecks, Map, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BottomNav = () => {
  const { role } = useAuth();
  const isSafari = role === 'safari_driver';

  const navItems = [
    {
      icon: LayoutDashboard,
      label: 'Home',
      path: isSafari ? '/safari/dashboard' : '/driver/dashboard',
      id: 'nav-home',
    },
    {
      icon: ListChecks,
      label: isSafari ? 'Safaris' : 'Trips',
      path: isSafari ? '/safari/trips' : '/driver/trips',
      id: 'nav-trips',
    },
    {
      icon: Map,
      label: 'Map',
      path: isSafari ? '/safari/map' : '/driver/map',
      id: 'nav-map',
    },
    {
      icon: MessageSquare,
      label: 'Chat',
      path: isSafari ? '/safari/messages' : '/driver/messages',
      id: 'nav-chat',
    },
    {
      icon: User,
      label: 'Profile',
      path: isSafari ? '/safari/profile' : '/driver/profile',
      id: 'nav-profile',
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border-subtle"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-stretch">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            id={item.id}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-3 px-1 flex-1 transition-colors duration-150 ${
                isActive
                  ? 'text-accent-gold'
                  : 'text-text-muted hover:text-text-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-gold" />
                  )}
                </div>
                <span className="text-[10px] mt-1.5 font-medium tracking-wide leading-none">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
