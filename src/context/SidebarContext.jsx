'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext(undefined);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
};

export const SidebarProvider = ({ children }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [activeItem, setActiveItem] = useState(null);
    const [openSubmenu, setOpenSubmenu] = useState(null);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const mobile = width < 1024;
            const medium = width >= 1024 && width < 1280;

            setIsMobile(mobile);

            if (mobile) {
                setIsMobileOpen(false);
                setIsExpanded(false);
            } else if (medium) {
                setIsExpanded(false);
            } else {
                setIsExpanded(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const toggleSidebar = () => {
        setIsExpanded((prev) => !prev);
    };

    const toggleMobileSidebar = () => {
        setIsMobileOpen((prev) => !prev);
    };

    const toggleSubmenu = (item) => {
        setOpenSubmenu((prev) => (prev === item ? null : item));
    };

    return (
        <SidebarContext.Provider
            value={{
                isExpanded: isMobile ? false : isExpanded,
                isMobileOpen,
                isHovered,
                activeItem,
                openSubmenu,
                toggleSidebar,
                toggleMobileSidebar,
                setIsMobileOpen,
                setIsHovered,
                setActiveItem,
                toggleSubmenu,
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
};
