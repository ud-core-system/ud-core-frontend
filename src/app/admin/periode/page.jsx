'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Calendar,
    Loader2,
    Lock,
    Unlock,
    X,
    RotateCcw,
} from 'lucide-react';
import { periodeAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage, formatDate, toDateInputValue } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import DatePicker from '@/components/ui/DatePicker';

const INITIAL_FORM = {
    nama_periode: '',
    tanggal_mulai: null,
    tanggal_selesai: null,
    isActive: true,
};

export default function PeriodeManagementPage() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { isReadOnly } = useAuth();

    // State
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        // No longer using totalPages/totalDocuments from API directly
    });

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [formLoading, setFormLoading] = useState(false);

    // Detail state
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [viewingItem, setViewingItem] = useState(null);

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteVerifCode, setDeleteVerifCode] = useState('');
    const [deleteGeneratedCode, setDeleteGeneratedCode] = useState('');

    // Close periode state
    const [closeDialogOpen, setCloseDialogOpen] = useState(false);
    const [closingItem, setClosingItem] = useState(null);
    const [closeLoading, setCloseLoading] = useState(false);
    const [closeVerifCode, setCloseVerifCode] = useState('');
    const [closeGeneratedCode, setCloseGeneratedCode] = useState('');

    // Unlock periode state
    const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
    const [unlockingItem, setUnlockingItem] = useState(null);
    const [unlockLoading, setUnlockLoading] = useState(false);
    const [unlockVerifCode, setUnlockVerifCode] = useState('');
    const [unlockGeneratedCode, setUnlockGeneratedCode] = useState('');

    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // Generate random verification code from periode name
    const generateVerifCode = (namaPeriode) => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const initials = (namaPeriode || 'P')
            .split(' ')
            .map((w) => w[0]?.toUpperCase() || '')
            .join('')
            .slice(0, 3);
        const random = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `${initials}-${random}`;
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const viewId = searchParams.get('view');
        if (viewId && data.length > 0) {
            const item = data.find((d) => d._id === viewId);
            if (item) {
                openDetailModal(item);
            } else {
                fetchSingleItem(viewId);
            }
        }
    }, [searchParams, data]);

    const fetchSingleItem = async (id) => {
        try {
            const response = await periodeAPI.getById(id);
            if (response.data.success) {
                openDetailModal(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch periode for deep link:', error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch all data at once to allow full client-side search across all "pages"
            const response = await periodeAPI.getAll({ limit: 1000 });
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const clearSearch = () => {
        setSearch('');
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    // Client-side filtering across the entire dataset
    const filteredData = data.filter(item =>
        item.nama_periode?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    // Client-side pagination
    const totalPages = Math.ceil(filteredData.length / pagination.limit);
    const displayData = filteredData.slice(
        (pagination.page - 1) * pagination.limit,
        pagination.page * pagination.limit
    );

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData(INITIAL_FORM);
        setModalOpen(true);
    };

    const openEditModal = (item) => {
        if (item.isClosed) {
            toast.warning('Periode yang sudah ditutup tidak dapat diedit');
            return;
        }
        setEditingItem(item);
        setFormData({
            nama_periode: item.nama_periode || '',
            tanggal_mulai: item.tanggal_mulai ? new Date(item.tanggal_mulai) : null,
            tanggal_selesai: item.tanggal_selesai ? new Date(item.tanggal_selesai) : null,
            isActive: item.isActive ?? true,
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingItem(null);
        setFormData(INITIAL_FORM);
        setIsDatePickerOpen(false);
    };

    const openDetailModal = (item) => {
        setViewingItem(item);
        setDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setDetailModalOpen(false);
        setViewingItem(null);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleDateChange = (name, date) => {
        setFormData((prev) => ({
            ...prev,
            [name]: date,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nama_periode.trim()) {
            toast.warning('Nama periode harus diisi');
            return;
        }
        if (!formData.tanggal_mulai) {
            toast.warning('Tanggal mulai harus diisi');
            return;
        }
        if (!formData.tanggal_selesai) {
            toast.warning('Tanggal selesai harus diisi');
            return;
        }
        if (new Date(formData.tanggal_selesai) < new Date(formData.tanggal_mulai)) {
            toast.warning('Tanggal selesai tidak boleh sebelum tanggal mulai');
            return;
        }

        try {
            setFormLoading(true);

            if (editingItem) {
                await periodeAPI.update(editingItem._id, formData);
                toast.success('Periode berhasil diperbarui');
            } else {
                await periodeAPI.create(formData);
                toast.success('Periode berhasil ditambahkan');
            }

            closeModal();
            fetchData();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setFormLoading(false);
        }
    };

    const openDeleteDialog = (item) => {
        if (item.isClosed) {
            toast.warning('Periode yang sudah ditutup tidak dapat dihapus');
            return;
        }
        const code = generateVerifCode(item.nama_periode);
        setDeleteGeneratedCode(code);
        setDeleteVerifCode('');
        setDeletingItem(item);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingItem) return;
        if (deleteVerifCode !== deleteGeneratedCode) {
            toast.error('Kode konfirmasi tidak sesuai');
            return;
        }

        try {
            setDeleteLoading(true);
            await periodeAPI.delete(deletingItem._id);
            toast.success('Periode berhasil dihapus');
            setDeleteDialogOpen(false);
            setDeletingItem(null);
            setDeleteVerifCode('');
            setDeleteGeneratedCode('');
            fetchData();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setDeleteLoading(false);
        }
    };

    const openCloseDialog = (item) => {
        if (item.isClosed) {
            toast.info('Periode sudah ditutup');
            return;
        }
        const code = generateVerifCode(item.nama_periode);
        setCloseGeneratedCode(code);
        setCloseVerifCode('');
        setClosingItem(item);
        setCloseDialogOpen(true);
    };

    const handleClosePeriode = async () => {
        if (!closingItem) return;
        if (closeVerifCode !== closeGeneratedCode) {
            toast.error('Kode konfirmasi tidak sesuai');
            return;
        }

        try {
            setCloseLoading(true);
            await periodeAPI.close(closingItem._id);
            toast.success('Periode berhasil ditutup');
            setCloseDialogOpen(false);
            setClosingItem(null);
            setCloseVerifCode('');
            setCloseGeneratedCode('');
            fetchData();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setCloseLoading(false);
        }
    };

    const openUnlockDialog = (item) => {
        if (!item.isClosed) {
            toast.info('Periode belum terkunci');
            return;
        }
        const code = generateVerifCode(item.nama_periode);
        setUnlockGeneratedCode(code);
        setUnlockVerifCode('');
        setUnlockingItem(item);
        setUnlockDialogOpen(true);
    };

    const handleUnlockPeriode = async () => {
        if (!unlockingItem) return;
        if (unlockVerifCode !== unlockGeneratedCode) {
            toast.error('Kode konfirmasi tidak sesuai');
            return;
        }

        try {
            setUnlockLoading(true);
            await periodeAPI.open(unlockingItem._id);
            toast.success('Periode berhasil dibuka kembali');
            setUnlockDialogOpen(false);
            setUnlockingItem(null);
            setUnlockVerifCode('');
            setUnlockGeneratedCode('');
            fetchData();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setUnlockLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Management Periode</h1>
                    <p className="text-sm sm:text-base text-gray-500 mt-0.5 sm:mt-1">Kelola data periode operasional</p>
                </div>
                {!isReadOnly() && (
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl
                   hover:bg-blue-700 active:bg-blue-800 transition-all font-medium shadow-sm shadow-blue-200 w-full sm:w-auto"
                    >
                        <Plus className="w-5 h-5" />
                        Tambah Periode
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-3 sm:p-4 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={handleSearch}
                        placeholder="Cari nama periode..."
                        className="w-full pl-11 pr-12 py-3 sm:py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl
                     focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all
                     text-sm sm:text-base"
                    />
                    {search && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg transition-colors"
                            title="Bersihkan pencarian"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white rounded-2xl border border-gray-100 py-12 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : displayData.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100">
                        <EmptyState
                            icon={Calendar}
                            title="Belum ada data periode"
                            description="Tambahkan data periode baru untuk memulai"
                            action={
                                <button
                                    onClick={openCreateModal}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Plus className="w-4 h-4" />
                                    Tambah Periode
                                </button>
                            }
                        />
                    </div>
                ) : (
                    <>
                        {/* Mobile View (Cards) */}
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {displayData.map((item, index) => (
                                <div key={item._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px]">
                                                        #{(pagination.page - 1) * pagination.limit + index + 1}
                                                    </span>
                                                    <h3 className="font-bold text-gray-900 text-base sm:text-lg line-clamp-2">{item.nama_periode}</h3>
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider
                                    ${item.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}
                                  `}>
                                                        {item.isActive ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                    {item.isClosed && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wider">
                                                            <Lock className="w-3 h-3" />
                                                            Closed
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Mulai</span>
                                                        <span className="font-medium text-gray-700">{formatDate(item.tanggal_mulai)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Selesai</span>
                                                        <span className="font-medium text-gray-700">{formatDate(item.tanggal_selesai)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                        {!item.isClosed ? (
                                            !isReadOnly() ? (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors active:scale-95"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => openCloseDialog(item)}
                                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-50 text-purple-600 rounded-xl text-sm font-bold hover:bg-purple-100 transition-colors active:scale-95"
                                                    >
                                                        <Lock className="w-4 h-4" />
                                                        Tutup
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteDialog(item)}
                                                        className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors active:scale-95"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                    <Unlock className="w-4 h-4" />
                                                    PERIODE TERBUKA
                                                </div>
                                            )
                                        ) : (
                                            !isReadOnly() ? (
                                                <button
                                                    onClick={() => openUnlockDialog(item)}
                                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-50 text-amber-600 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors active:scale-95 border border-amber-200"
                                                >
                                                    <Unlock className="w-4 h-4" />
                                                    Buka Kembali
                                                </button>
                                            ) : (
                                                <div className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                    <Lock className="w-4 h-4" />
                                                    PERIODE TERKUNCI
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop View (Table) */}
                        <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-2 md:px-3 lg:px-6 py-4 text-left text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider w-12 md:w-16">
                                                No
                                            </th>
                                            <th className="px-2 md:px-3 lg:px-6 py-4 text-left text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[100px] md:min-w-[150px]">
                                                Nama Periode
                                            </th>
                                            <th className="hidden md:table-cell px-2 md:px-3 lg:px-6 py-4 text-left text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                <span className="md:hidden lg:inline">Tanggal Mulai</span>
                                                <span className="hidden md:inline lg:hidden">Tgl. Mulai</span>
                                            </th>
                                            <th className="hidden md:table-cell px-2 md:px-3 lg:px-6 py-4 text-left text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                <span className="md:hidden lg:inline">Tanggal Selesai</span>
                                                <span className="hidden md:inline lg:hidden">Tgl. Selesai</span>
                                            </th>
                                            <th className="hidden sm:table-cell px-2 md:px-3 lg:px-6 py-4 text-center text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-2 md:px-3 lg:px-6 py-4 text-center text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {displayData.map((item, index) => (
                                            <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-2 md:px-3 lg:px-6 py-4 whitespace-nowrap text-[11px] md:text-sm text-gray-500">
                                                    {(pagination.page - 1) * pagination.limit + index + 1}
                                                </td>
                                                <td className="px-2 md:px-3 lg:px-6 py-4">
                                                    <p className="font-semibold text-gray-900 text-xs md:text-sm lg:text-base line-clamp-2">{item.nama_periode}</p>
                                                </td>
                                                <td className="hidden md:table-cell px-2 md:px-3 lg:px-6 py-4 whitespace-nowrap">
                                                    <p className="text-[11px] lg:text-sm text-gray-700 font-medium">{formatDate(item.tanggal_mulai)}</p>
                                                </td>
                                                <td className="hidden md:table-cell px-2 md:px-3 lg:px-6 py-4 whitespace-nowrap">
                                                    <p className="text-[11px] lg:text-sm text-gray-700 font-medium">{formatDate(item.tanggal_selesai)}</p>
                                                </td>
                                                <td className="hidden sm:table-cell px-2 md:px-3 lg:px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col items-center justify-center gap-1">
                                                        <span className={`inline-flex px-1.5 md:px-3 py-0.5 md:py-1 text-[9px] md:text-[10px] lg:text-xs font-bold rounded-full uppercase tracking-wider
                                    ${item.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}
                                  `}>
                                                            {item.isActive ? 'Aktif' : 'Nonaktif'}
                                                        </span>
                                                        {item.isClosed && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 md:px-3 py-0.5 md:py-1 text-[9px] md:text-[10px] lg:text-xs font-bold rounded-full bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wider">
                                                                <Lock className="w-2.5 h-2.5 md:w-3 h-3" />
                                                                Closed
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-2 md:px-3 lg:px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-0.5 md:gap-1">
                                                        {!item.isClosed ? (
                                                            !isReadOnly() ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => openEditModal(item)}
                                                                        className="p-1 md:p-1.5 lg:p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-all hover:scale-110"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit className="w-3.5 h-3.5 md:w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openCloseDialog(item)}
                                                                        className="p-1 md:p-1.5 lg:p-2 hover:bg-purple-50 rounded-lg text-purple-600 transition-all hover:scale-110"
                                                                        title="Tutup Periode"
                                                                    >
                                                                        <Lock className="w-3.5 h-3.5 md:w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openDeleteDialog(item)}
                                                                        className="p-1 md:p-1.5 lg:p-2 hover:bg-red-50 rounded-lg text-red-600 transition-all hover:scale-110"
                                                                        title="Hapus"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5 md:w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span className="text-[10px] md:text-xs text-gray-400 font-medium italic">Buka</span>
                                                            )
                                                        ) : (
                                                            !isReadOnly() ? (
                                                                <button
                                                                    onClick={() => openUnlockDialog(item)}
                                                                    className="p-1 md:p-1.5 lg:p-2 hover:bg-amber-50 rounded-lg text-amber-600 transition-all hover:scale-110"
                                                                    title="Buka Kembali"
                                                                >
                                                                    <Unlock className="w-3.5 h-3.5 md:w-4 h-4" />
                                                                </button>
                                                            ) : (
                                                                <span className="text-[10px] md:text-xs text-gray-400 font-medium italic">Terkunci</span>
                                                            )
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination Container */}
                        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-sm text-gray-500 font-medium">
                                    Menampilkan <span className="text-gray-900">{displayData.length}</span> dari <span className="text-gray-900">{filteredData.length}</span> data
                                </p>
                                <div className="w-full sm:w-auto overflow-x-auto flex justify-center">
                                    <Pagination
                                        currentPage={pagination.page}
                                        totalPages={totalPages}
                                        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={closeModal}
                title={editingItem ? 'Edit Periode' : 'Tambah Periode Baru'}
                size="lg"
                className={isDatePickerOpen ? 'min-h-[500px]' : ''}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nama Periode */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Periode <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="nama_periode"
                            value={formData.nama_periode}
                            onChange={handleFormChange}
                            placeholder="Contoh: Periode 5"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Tanggal Mulai & Selesai */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Mulai <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                                selected={formData.tanggal_mulai}
                                onChange={(date) => handleDateChange('tanggal_mulai', date)}
                                onOpenChange={setIsDatePickerOpen}
                                placeholder="Pilih tanggal mulai"
                                maxDate={formData.tanggal_selesai}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Selesai <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                                selected={formData.tanggal_selesai}
                                onChange={(date) => handleDateChange('tanggal_selesai', date)}
                                onOpenChange={setIsDatePickerOpen}
                                placeholder="Pilih tanggal selesai"
                                minDate={formData.tanggal_mulai}
                            />
                        </div>
                    </div>

                    {/* Status */}
                    {editingItem && (
                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleFormChange}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Periode Aktif
                                </span>
                            </label>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium
                       hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={formLoading}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium
                       hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {formLoading ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah Periode'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Periode Dialog — Custom with Verification Code */}
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${deleteDialogOpen ? 'visible' : 'hidden'}`}>
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => { if (!deleteLoading) { setDeleteDialogOpen(false); setDeletingItem(null); } }}
                />
                <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-fade-in text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Hapus Periode</h3>
                    <p className="text-gray-500 mb-5 text-sm">
                        Anda akan menghapus periode <span className="font-bold text-gray-900">{deletingItem?.nama_periode}</span>.
                        Tindakan ini permanen dan tidak dapat dibatalkan.
                    </p>
                    <div className="mb-5 p-3 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-xs text-red-500 font-semibold uppercase tracking-widest mb-1">Kode Konfirmasi</p>
                        <p className="font-mono text-2xl font-black text-red-700 tracking-[0.3em]">{deleteGeneratedCode}</p>
                    </div>
                    <div className="mb-6 text-left">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Ketik Kode di Atas untuk Konfirmasi
                        </label>
                        <input
                            type="text"
                            value={deleteVerifCode}
                            onChange={(e) => setDeleteVerifCode(e.target.value.toUpperCase())}
                            placeholder={deleteGeneratedCode}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 font-mono text-center text-lg tracking-[0.2em] transition-all uppercase"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setDeleteDialogOpen(false); setDeletingItem(null); }}
                            disabled={deleteLoading}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleteLoading || deleteVerifCode !== deleteGeneratedCode}
                            className="flex-[1.5] px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:grayscale disabled:shadow-none active:scale-95"
                        >
                            {deleteLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Menghapus...</span>
                                </div>
                            ) : 'Ya, Hapus'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Close Periode Dialog — Custom with Verification Code */}
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${closeDialogOpen ? 'visible' : 'hidden'}`}>
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => { if (!closeLoading) { setCloseDialogOpen(false); setClosingItem(null); } }}
                />
                <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-fade-in text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Kunci Periode</h3>
                    <p className="text-gray-500 mb-5 text-sm">
                        Anda akan mengunci <span className="font-bold text-gray-900">{closingItem?.nama_periode}</span>.
                        Periode yang dikunci tidak dapat diubah atau dihapus.
                    </p>
                    <div className="mb-5 p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <p className="text-xs text-purple-500 font-semibold uppercase tracking-widest mb-1">Kode Konfirmasi</p>
                        <p className="font-mono text-2xl font-black text-purple-700 tracking-[0.3em]">{closeGeneratedCode}</p>
                    </div>
                    <div className="mb-6 text-left">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Ketik Kode di Atas untuk Konfirmasi
                        </label>
                        <input
                            type="text"
                            value={closeVerifCode}
                            onChange={(e) => setCloseVerifCode(e.target.value.toUpperCase())}
                            placeholder={closeGeneratedCode}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono text-center text-lg tracking-[0.2em] transition-all uppercase"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setCloseDialogOpen(false); setClosingItem(null); }}
                            disabled={closeLoading}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleClosePeriode}
                            disabled={closeLoading || closeVerifCode !== closeGeneratedCode}
                            className="flex-[1.5] px-4 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:grayscale disabled:shadow-none active:scale-95"
                        >
                            {closeLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Mengunci...</span>
                                </div>
                            ) : 'Ya, Kunci Periode'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Unlock Periode Dialog — Custom with Verification Code */}
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${unlockDialogOpen ? 'visible' : 'hidden'}`}>
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => { if (!unlockLoading) { setUnlockDialogOpen(false); setUnlockingItem(null); } }}
                />
                <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-fade-in text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                        <Unlock className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Buka Kembali Periode</h3>
                    <p className="text-gray-500 mb-5 text-sm">
                        Anda akan membuka kembali periode <span className="font-bold text-gray-900">{unlockingItem?.nama_periode}</span>.
                        Periode akan dapat diubah dan digunakan kembali.
                    </p>
                    <div className="mb-5 p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-xs text-amber-500 font-semibold uppercase tracking-widest mb-1">Kode Konfirmasi</p>
                        <p className="font-mono text-2xl font-black text-amber-700 tracking-[0.3em]">{unlockGeneratedCode}</p>
                    </div>
                    <div className="mb-6 text-left">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Ketik Kode di Atas untuk Konfirmasi
                        </label>
                        <input
                            type="text"
                            value={unlockVerifCode}
                            onChange={(e) => setUnlockVerifCode(e.target.value.toUpperCase())}
                            placeholder={unlockGeneratedCode}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-center text-lg tracking-[0.2em] transition-all uppercase"
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setUnlockDialogOpen(false); setUnlockingItem(null); }}
                            disabled={unlockLoading}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleUnlockPeriode}
                            disabled={unlockLoading || unlockVerifCode !== unlockGeneratedCode}
                            className="flex-[1.5] px-4 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:grayscale disabled:shadow-none active:scale-95"
                        >
                            {unlockLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Membuka...</span>
                                </div>
                            ) : 'Ya, Buka Periode'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            <Modal
                isOpen={detailModalOpen}
                onClose={closeDetailModal}
                title="Detail Periode"
                size="md"
            >
                {viewingItem && (
                    <div className="space-y-6 py-2">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{viewingItem.nama_periode}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase
                                        ${viewingItem.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {viewingItem.isActive ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                    {viewingItem.isClosed && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 uppercase">
                                            Closed
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 border border-gray-100 rounded-2xl shadow-sm">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tanggal Mulai</p>
                                <p className="text-sm font-bold text-gray-700">{formatDate(viewingItem.tanggal_mulai)}</p>
                            </div>
                            <div className="bg-white p-4 border border-gray-100 rounded-2xl shadow-sm">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tanggal Selesai</p>
                                <p className="text-sm font-bold text-gray-700">{formatDate(viewingItem.tanggal_selesai)}</p>
                            </div>
                        </div>

                        <button
                            onClick={closeDetailModal}
                            className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all"
                        >
                            Tutup
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
