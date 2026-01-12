import { cn } from '@/lib/utils';

const Badge = ({
    children,
    color = 'default',
    size = 'md',
    className,
}) => {
    const colorStyles = {
        default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        success: 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400',
        error: 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400',
        warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400',
        info: 'bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/10 dark:text-blue-light-400',
        brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400',
    };

    const sizeStyles = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 font-medium rounded-full',
                colorStyles[color],
                sizeStyles[size],
                className
            )}
        >
            {children}
        </span>
    );
};

export default Badge;
