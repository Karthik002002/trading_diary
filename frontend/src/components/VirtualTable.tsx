import React, { useRef } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,

    getSortedRowModel,
    type SortingState,
    type ColumnDef,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import cn from 'classnames';

interface VirtualTableProps<T> {
    data: T[];
    columns: ColumnDef<T, any>[];
    height?: string | number;
}

export function VirtualTable<T>({ data, columns, height = '500px' }: VirtualTableProps<T>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const { rows } = table.getRowModel();

    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 45, // Increased estimate slightly
        overscan: 5,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();
    const totalSize = rowVirtualizer.getTotalSize();

    const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
    const paddingBottom = virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0;

    return (
        <div
            ref={parentRef}
            className="border border-gray-700  rounded-xl overflow-auto bg-surface shadow-2xl"
            style={{ height: typeof height === 'number' ? `${height}px` : height }}
        >
            <table className="w-full text-left text-sm text-gray-300 relative border-collapse">
                <thead className="sticky top-0 bg-surface-highlight/90 backdrop-blur-md text-gray-100 uppercase text-xs z-10 shadow-md rounded-t-xl">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <th
                                        key={header.id}
                                        colSpan={header.colSpan}
                                        className={cn("px-6 py-4 cursor-pointer select-none border-b border-gray-700 text-secondary font-semibold tracking-wider hover:text-white transition-colors")}
                                        style={{ width: header.getSize() }}
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <span>
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                            </span>
                                            <span>
                                                {{
                                                    asc: <FaSortUp className="text-primary" />,
                                                    desc: <FaSortDown className="text-primary" />,
                                                }[header.column.getIsSorted() as string] ?? <FaSort className="text-border hover:text-secondary opacity-50" />}
                                            </span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>
                <tbody className="divide-y divide-border/30">
                    {paddingTop > 0 && (
                        <tr>
                            <td style={{ height: `${paddingTop}px` }} colSpan={columns.length} />
                        </tr>
                    )}
                    {virtualItems.map((virtualRow) => {
                        const row = rows[virtualRow.index];
                        return (
                            <tr
                                key={row.id}
                                className="hover:bg-surface-highlight/50 transition-colors group"
                            >
                                {row.getVisibleCells().map((cell) => {
                                    return (
                                        <td
                                            key={cell.id}
                                            className="px-6 py-3 whitespace-nowrap text-gray-400 group-hover:text-gray-200 transition-colors"
                                            style={{ width: cell.column.getSize() }}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                    {paddingBottom > 0 && (
                        <tr>
                            <td style={{ height: `${paddingBottom}px` }} colSpan={columns.length} />
                        </tr>
                    )}
                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={columns.length} className="px-6 py-12 text-center text-secondary">
                                <div className="flex flex-col items-center justify-center space-y-2">
                                    <span className="text-2xl opacity-20">📭</span>
                                    <span className="text-sm">No records found</span>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
