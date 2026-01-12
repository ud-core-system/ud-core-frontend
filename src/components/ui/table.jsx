import { cn } from '@/lib/utils';

const Table = ({ children, className }) => {
    return (
        <table className={cn('w-full', className)}>
            {children}
        </table>
    );
};

const TableHeader = ({ children, className }) => {
    return (
        <thead className={className}>
            {children}
        </thead>
    );
};

const TableBody = ({ children, className }) => {
    return (
        <tbody className={className}>
            {children}
        </tbody>
    );
};

const TableRow = ({ children, className }) => {
    return (
        <tr className={className}>
            {children}
        </tr>
    );
};

const TableCell = ({ children, isHeader = false, className }) => {
    const Component = isHeader ? 'th' : 'td';

    return (
        <Component className={className}>
            {children}
        </Component>
    );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
