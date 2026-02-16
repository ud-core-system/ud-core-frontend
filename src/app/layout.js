import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { BulkUploadProvider } from '@/contexts/BulkUploadContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'Mutiara Care Indonesia',
    description: 'Sistem Manajemen Usaha Dagang untuk MBG',
    icons: {
        icon: '/favicon_io/favicon.ico',
        shortcut: '/favicon_io/cropped_circle_image.png',
        apple: '/favicon_io/apple-touch-icon.png',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="id">
            <body className={inter.className}>
                <ToastProvider>
                    <BulkUploadProvider>
                        <AuthProvider>
                            {children}
                        </AuthProvider>
                    </BulkUploadProvider>
                </ToastProvider>
            </body>
        </html>
    );
}
