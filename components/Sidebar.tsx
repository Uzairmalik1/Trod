import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Home, Menu, ChevronDown, LogOut, Settings } from "lucide-react";

type SidebarProps = {
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean) => void;
};

const Sidebar = ({ isMobileOpen, setIsMobileOpen }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const showText = isMobileOpen || !isCollapsed;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileOpen(false);
      }
    }
    if (isMobileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileOpen, setIsMobileOpen]);

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden p-4 bg-gray-900 text-white flex justify-between items-center">
        <span className="text-xl font-semibold">My App</span>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        ref={menuRef}
        className={`
          fixed left-0 top-0 h-screen bg-gray-900 text-white flex flex-col p-4 transition-all duration-300 z-30
          ${isMobileOpen ? "w-72" : isCollapsed ? "w-20" : "w-72"}
          ${isMobileOpen ? "block" : "hidden md:block"}
        `}
      >
        {/* Desktop Collapse Toggle */}
        <div className="hidden md:flex justify-end">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 mb-4 bg-gray-700 rounded">
            <ChevronDown size={20} className={`transition-transform ${isCollapsed ? "rotate-180" : "rotate-0"}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          <Link href="/" className="flex items-center gap-2 p-3 hover:bg-gray-800 rounded-md">
            <Home size={20} />
            {showText && "Home"}
          </Link>
        </nav>

        {/* Settings & Logout */}
        <div className="mt-auto">
          <Link href="/settings" className="flex items-center gap-2 p-3 hover:bg-gray-800 rounded-md">
            <Settings size={20} />
            {showText && "Settings"}
          </Link>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 mt-4 rounded-md">
            {showText ? "Upgrade Plan" : "Up"}
          </button>
          <div className="flex items-center gap-2 p-3 hover:bg-gray-800 rounded-md cursor-pointer mt-4">
            <LogOut size={20} />
            {showText && "Logout"}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
