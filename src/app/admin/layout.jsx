'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import Backdrop from '@/components/layout/Backdrop';

function AdminLayoutContent({ children }) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const { isExpanded, isHovered, isMobileOpen } = useSidebar();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/auth/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // Dynamic class for main content margin based on sidebar state
    const mainContentMargin = isMobileOpen
        ? 'ml-0'
        : isExpanded || isHovered
            ? 'lg:ml-[290px]'
            : 'lg:ml-[90px]';

    return (
        <div className="min-h-screen xl:flex bg-gray-50 dark:bg-gray-900">
            {/* Sidebar and Backdrop */}
            <AppSidebar />
            <Backdrop />

            {/* Main Content Area */}
            <div
                className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
            >
                {/* Header */}
                <AppHeader />

                {/* Page Content */}
                <div className="p-4 mx-auto max-w-screen-2xl md:p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }) {
    return (
        <SidebarProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </SidebarProvider>
    );
}
