'use client';
import { useSidebar } from '@/context/SidebarContext';

const Backdrop = () => {
    const { isMobileOpen, toggleMobileSidebar } = useSidebar();

    if (!isMobileOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={toggleMobileSidebar}
        />
    );
};

export default Backdrop;
