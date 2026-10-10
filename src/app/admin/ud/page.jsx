'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Building2,
    Loader2,
    X,
    Eye,
    AlertTriangle,
} from 'lucide-react';
import { udAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';

const KBLI_OPTIONS = [
    'protein hewani dan beras',
    'barang toko',
    'non makanan',
    'barang pasar (sayur, buah, dan roti rotian)',
    'Lainnya',
];

const INITIAL_FORM = {
    nama_ud: '',
    alamat: '',
    nama_pemilik: '',
    bank: '',
    no_rekening: '',
    nota_prefix: '',
    nota_terakhir: '',
    kbli: [],
    kbliLainnya: '',
    isActive: true,
};

export default function UDManagementPage() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { isReadOnly } = useAuth();

    // State
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalPages: 1,
        totalDocuments: 0,
    });

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [formLoading, setFormLoading] = useState(false);

    // View modal state
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewingItem, setViewingItem] = useState(null);
    const [viewCounter, setViewCounter] = useState(null);

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Nomor nota terakhir (bulan berjalan) + konfirmasi kode saat diubah
    const [notaCounter, setNotaCounter] = useState(null);
    const [counterDialogOpen, setCounterDialogOpen] = useState(false);
    const [counterVerifCode, setCounterVerifCode] = useState('');
    const [counterGeneratedCode, setCounterGeneratedCode] = useState('');

    const generateVerifCode = (namaUD) => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const initials = (namaUD || 'UD')
            .split(' ')
            .map((w) => w[0]?.toUpperCase() || '')
            .join('')
            .slice(0, 3);
        const random = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `${initials}-${random}`;
    };

    useEffect(() => {
        fetchData();
    }, [pagination.page, search]);

    useEffect(() => {
        const viewId = searchParams.get('view');
        if (viewId && data.length > 0) {
            const item = data.find((d) => d._id === viewId);
            if (item) {
                openViewModal(item);
            } else {
                // If not in current page, fetch it
                fetchSingleItem(viewId);
            }
        }
    }, [searchParams, data]);

    const fetchSingleItem = async (id) => {
        try {
            const response = await udAPI.getById(id);
            if (response.data.success) {
                openViewModal(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch UD for deep link:', error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: search || undefined,
            };
            const response = await udAPI.getAll(params);
            if (response.data.success) {
                setData(response.data.data);
                setPagination((prev) => ({
                    ...prev,
                    ...response.data.pagination,
                }));
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

    const openCreateModal = () => {
        setEditingItem(null);
        setFormData(INITIAL_FORM);
        setModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);

        // Extract custom KBLI (value that's not in KBLI_OPTIONS)
        const kbliArr = item.kbli || [];
        const kbliLainnya = kbliArr.find(k => !KBLI_OPTIONS.includes(k) && k !== 'Lainnya') || '';

        // Check if "Lainnya" should be marked as checked
        const processedKbli = kbliArr.map(k => KBLI_OPTIONS.includes(k) ? k : 'Lainnya');
        const uniqueKbli = [...new Set(processedKbli)];

        setFormData({
            nama_ud: item.nama_ud || '',
            alamat: item.alamat || '',
            nama_pemilik: item.nama_pemilik || '',
            bank: item.bank || '',
            no_rekening: item.no_rekening || '',
            nota_prefix: item.nota_prefix || '',
            nota_terakhir: '',
            kbli: uniqueKbli,
            kbliLainnya: kbliLainnya,
            isActive: item.isActive ?? true,
        });
        setNotaCounter(null);
        setModalOpen(true);

        udAPI.getNotaCounter(item._id)
            .then((res) => {
                const counter = res.data.data;
                setNotaCounter(counter);
                setFormData((prev) => ({ ...prev, nota_terakhir: String(counter.terakhir) }));
            })
            .catch((error) => toast.error(getErrorMessage(error)));
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingItem(null);
        setFormData(INITIAL_FORM);
        setNotaCounter(null);
    };

    const isCounterChanged = () =>
        Boolean(editingItem && notaCounter && formData.nota_terakhir !== '' &&
            Number(formData.nota_terakhir) !== notaCounter.terakhir);

    const openViewModal = (item) => {
        setViewingItem(item);
        setViewCounter(null);
        setViewModalOpen(true);

        udAPI.getNotaCounter(item._id)
            .then((res) => setViewCounter(res.data.data))
            .catch(() => setViewCounter(false)); // false = gagal dimuat
    };

    const closeViewModal = () => {
        setViewModalOpen(false);
        setViewingItem(null);
        setViewCounter(null);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleKbliChange = (kbli) => {
        setFormData((prev) => {
            const isRemoving = prev.kbli.includes(kbli);
            const newKbli = isRemoving
                ? prev.kbli.filter((k) => k !== kbli)
                : [...prev.kbli, kbli];

            return {
                ...prev,
                kbli: newKbli,
                // Clear kbliLainnya if "Lainnya" is unchecked
                kbliLainnya: kbli === 'Lainnya' && isRemoving ? '' : prev.kbliLainnya
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nama_ud.trim()) {
            toast.warning('Nama UD harus diisi');
            return;
        }

        if (isCounterChanged()) {
            const terakhir = Number(formData.nota_terakhir);
            if (!Number.isInteger(terakhir) || terakhir < 0) {
                toast.warning('Nomor nota terakhir harus bilangan bulat >= 0');
                return;
            }
            // Perubahan nomor nota harus dikonfirmasi dengan kode
            setCounterGeneratedCode(generateVerifCode(formData.nama_ud));
            setCounterVerifCode('');
            setCounterDialogOpen(true);
            return;
        }

        await saveUD();
    };

    const handleConfirmCounter = async () => {
        if (counterVerifCode !== counterGeneratedCode) {
            toast.error('Kode konfirmasi tidak sesuai');
            return;
        }
        const saved = await saveUD();
        if (!saved) return; // gagal: dialog tetap terbuka, error sudah di-toast
        setCounterDialogOpen(false);
        setCounterVerifCode('');
        setCounterGeneratedCode('');
    };

    const saveUD = async () => {
        try {
            setFormLoading(true);

            // Merge kbliLainnya into kbli array if "Lainnya" is checked
            const finalKbli = formData.kbli.map(k => {
                if (k === 'Lainnya') return formData.kbliLainnya;
                return k;
            }).filter(k => k && k.trim() !== '');

            const submissionData = {
                ...formData,
                kbli: finalKbli
            };
            // Remove helper field before sending to API
            delete submissionData.kbliLainnya;
            delete submissionData.nota_terakhir;

            if (editingItem) {
                await udAPI.update(editingItem._id, submissionData);
                if (isCounterChanged()) {
                    await udAPI.setNotaCounter(editingItem._id, { terakhir: Number(formData.nota_terakhir) });
                }
                toast.success('UD berhasil diperbarui');
            } else {
                await udAPI.create(submissionData);
                toast.success('UD berhasil ditambahkan');
            }

            closeModal();
            fetchData();
            return true;
        } catch (error) {
            toast.error(getErrorMessage(error));
            return false;
        } finally {
            setFormLoading(false);
        }
    };

    const openDeleteDialog = (item) => {
        setDeletingItem(item);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingItem) return;

        try {
            setDeleteLoading(true);
            await udAPI.delete(deletingItem._id);
            toast.success('UD berhasil dihapus');
            setDeleteDialogOpen(false);
            setDeletingItem(null);
            fetchData();
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Management UD</h1>
                    <p className="text-gray-500 mt-1">Kelola data Usaha Dagang</p>
                </div>
                {!isReadOnly() && (
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg
                   hover:bg-blue-700 transition-colors font-medium w-full sm:w-auto"
                    >
                        <Plus className="w-5 h-5" />
                        Tambah UD
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={handleSearch}
                        placeholder="Cari nama UD, pemilik, atau kode..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : data.length === 0 ? (
                    <EmptyState
                        icon={Building2}
                        title="Belum ada data UD"
                        description="Tambahkan data UD baru untuk memulai"
                        action={
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Plus className="w-4 h-4" />
                                Tambah UD
                            </button>
                        }
                    />
                ) : (
                    <>
                        {/* Table View (Desktop) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            No
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Kode UD
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Nama UD
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {data.map((item, index) => (
                                        <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {(pagination.page - 1) * pagination.limit + index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm bg-gray-100 px-2.5 py-1 rounded font-medium text-gray-900">
                                                    {item.kode_ud}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.nama_ud}</p>
                                                    <p className="text-sm text-gray-500 truncate max-w-[200px] lg:max-w-xs mt-0.5">
                                                        {item.alamat || '-'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full
                                                    ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                                                `}>
                                                    {item.isActive ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openViewModal(item)}
                                                        className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {!isReadOnly() && (
                                                        <>
                                                            <button
                                                                onClick={() => openEditModal(item)}
                                                                className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteDialog(item)}
                                                                className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Card View (Mobile) */}
                        <div className="md:hidden divide-y divide-gray-100">
                            {data.map((item, index) => (
                                <div key={item._id} className="p-4 space-y-4 text-[10px] sm:text-xs">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">
                                                    #{(pagination.page - 1) * pagination.limit + index + 1}
                                                </span>
                                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded font-medium text-gray-600">
                                                    {item.kode_ud}
                                                </span>
                                                <span className={`px-2 py-0.5 font-semibold rounded-full
                                                    ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                                                `}>
                                                    {item.isActive ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-gray-900 truncate text-sm sm:text-base">
                                                {item.nama_ud}
                                            </h3>
                                            <p className="text-gray-500 line-clamp-2 mt-1">
                                                {item.alamat || 'Tidak ada alamat'}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => openViewModal(item)}
                                                className="p-2 bg-green-50 text-green-600 rounded-lg"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            {!isReadOnly() && (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteDialog(item)}
                                                        className="p-2 bg-red-50 text-red-600 rounded-lg"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t border-gray-100">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-sm text-gray-500 order-2 sm:order-1">
                                    Menampilkan {data.length} dari {pagination.totalDocuments} data
                                </p>
                                <div className="order-1 sm:order-2">
                                    <Pagination
                                        currentPage={pagination.page}
                                        totalPages={pagination.totalPages}
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
                title={editingItem ? 'Edit UD' : 'Tambah UD Baru'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nama UD */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama UD <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="nama_ud"
                            value={formData.nama_ud}
                            onChange={handleFormChange}
                            placeholder="Contoh: UD Amanah Sumber Makmur"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Alamat */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Alamat
                        </label>
                        <textarea
                            name="alamat"
                            value={formData.alamat}
                            onChange={handleFormChange}
                            rows={2}
                            placeholder="Alamat lengkap UD"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Nama Pemilik */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nama Pemilik (An.)
                        </label>
                        <input
                            type="text"
                            name="nama_pemilik"
                            value={formData.nama_pemilik}
                            onChange={handleFormChange}
                            placeholder="Contoh: An. Ulul Azmi"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Bank & Rekening */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Bank
                            </label>
                            <input
                                type="text"
                                name="bank"
                                value={formData.bank}
                                onChange={handleFormChange}
                                placeholder="Contoh: Mandiri"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                No. Rekening
                            </label>
                            <input
                                type="text"
                                name="no_rekening"
                                value={formData.no_rekening}
                                onChange={handleFormChange}
                                placeholder="Contoh: 1610016136421"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Prefix Nomor Nota */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prefix Nomor Nota
                        </label>
                        <input
                            type="text"
                            name="nota_prefix"
                            value={formData.nota_prefix}
                            onChange={handleFormChange}
                            placeholder={editingItem?.kode_ud || 'Contoh: asm'}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Format nota: prefix/001/MM-YY. Kosongkan untuk memakai kode UD.
                        </p>
                    </div>

                    {/* Nomor Nota Terakhir (hanya saat edit) */}
                    {editingItem && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nomor Nota Terakhir {notaCounter ? `(periode ${notaCounter.periode})` : ''}
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                name="nota_terakhir"
                                value={formData.nota_terakhir}
                                onChange={handleFormChange}
                                disabled={!notaCounter}
                                placeholder={notaCounter ? '' : 'Memuat...'}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Nota berikutnya bulan ini memakai nomor {formData.nota_terakhir !== '' ? String(Number(formData.nota_terakhir) + 1).padStart(3, '0') : '-'}.
                                Perubahan butuh kode konfirmasi.
                            </p>
                        </div>
                    )}

                    {/* KBLI */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            KBLI (Kategori Barang)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {KBLI_OPTIONS.map((kbli) => (
                                <label
                                    key={kbli}
                                    className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer
                           hover:bg-gray-50 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.kbli.includes(kbli)}
                                        onChange={() => handleKbliChange(kbli)}
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                                    />
                                    <span className="text-sm">{kbli}</span>
                                </label>
                            ))}
                        </div>

                        {/* Custom KBLI Input */}
                        {formData.kbli.includes('Lainnya') && (
                            <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                <label className="block text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
                                    Sebutkan KBLI Lainnya
                                </label>
                                <input
                                    type="text"
                                    name="kbliLainnya"
                                    value={formData.kbliLainnya}
                                    onChange={handleFormChange}
                                    placeholder="Masukkan nama KBLI lainnya..."
                                    className="w-full px-3 py-2 border border-blue-200 bg-blue-50/30 rounded-lg
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                     placeholder:text-gray-400 text-sm"
                                    autoFocus
                                />
                            </div>
                        )}
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
                                    UD Aktif
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
                            {formLoading ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah UD'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Detail Modal */}
            <Modal
                isOpen={viewModalOpen}
                onClose={closeViewModal}
                title="Detail UD"
                size="lg"
            >
                {viewingItem && (
                    <div className="space-y-6">
                        {/* Header Section */}
                        <div className="pb-4 border-b border-gray-200">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{viewingItem.nama_ud}</h3>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="font-mono text-sm bg-blue-100 px-3 py-1 rounded font-medium text-blue-800">
                                            {viewingItem.kode_ud}
                                        </span>
                                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full
                                            ${viewingItem.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                                        `}>
                                            {viewingItem.isActive ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                    Alamat
                                </label>
                                <p className="text-gray-900">{viewingItem.alamat || '-'}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                    Nama Pemilik
                                </label>
                                <p className="text-gray-900">{viewingItem.nama_pemilik || '-'}</p>
                            </div>
                        </div>

                        {/* Banking Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                    Bank
                                </label>
                                <p className="text-gray-900">{viewingItem.bank || '-'}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                    No. Rekening
                                </label>
                                <p className="text-gray-900 font-mono">{viewingItem.no_rekening || '-'}</p>
                            </div>
                        </div>

                        {/* Nomor Nota */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                    Prefix Nomor Nota
                                </label>
                                <p className="text-gray-900 font-mono">{viewingItem.nota_prefix || viewingItem.kode_ud || '-'}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                    Nomor Nota Terakhir {viewCounter ? `(${viewCounter.periode})` : ''}
                                </label>
                                <p className="text-gray-900 font-mono">
                                    {viewCounter
                                        ? `${String(viewCounter.terakhir).padStart(3, '0')} — berikutnya ${String(viewCounter.terakhir + 1).padStart(3, '0')}`
                                        : viewCounter === false ? '-' : 'Memuat...'}
                                </p>
                            </div>
                        </div>

                        {/* KBLI Categories */}
                        <div className="pt-2">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                KBLI (Kategori Barang)
                            </label>
                            {viewingItem.kbli && viewingItem.kbli.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {viewingItem.kbli.map((kbli, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium
                                                bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200"
                                        >
                                            {kbli}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">Tidak ada kategori</p>
                            )}
                        </div>

                        {/* Metadata */}
                        {(viewingItem.createdAt || viewingItem.updatedAt) && (
                            <div className="pt-4 border-t border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
                                    {viewingItem.createdAt && (
                                        <div>
                                            <span className="font-semibold">Dibuat: </span>
                                            {new Date(viewingItem.createdAt).toLocaleString('id-ID', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short'
                                            })}
                                        </div>
                                    )}
                                    {viewingItem.updatedAt && (
                                        <div>
                                            <span className="font-semibold">Diperbarui: </span>
                                            {new Date(viewingItem.updatedAt).toLocaleString('id-ID', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short'
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Close Button */}
                        <div className="pt-4 border-t border-gray-200">
                            <button
                                onClick={closeViewModal}
                                className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium
                                    hover:bg-gray-200 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Konfirmasi Ubah Nomor Nota — dengan kode verifikasi */}
            <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${counterDialogOpen ? 'visible' : 'hidden'}`}>
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => { if (!formLoading) setCounterDialogOpen(false); }}
                />
                <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-fade-in text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Ubah Nomor Nota Terakhir</h3>
                    <p className="text-gray-500 mb-5 text-sm">
                        Nomor nota terakhir <span className="font-bold text-gray-900">{formData.nama_ud}</span> periode {notaCounter?.periode} akan
                        diubah dari <span className="font-bold text-gray-900">{notaCounter?.terakhir}</span> menjadi{' '}
                        <span className="font-bold text-gray-900">{formData.nota_terakhir}</span>.
                        Nota berikutnya akan memakai nomor {formData.nota_terakhir !== '' ? String(Number(formData.nota_terakhir) + 1).padStart(3, '0') : '-'}.
                    </p>
                    <div className="mb-5 p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-xs text-amber-500 font-semibold uppercase tracking-widest mb-1">Kode Konfirmasi</p>
                        <p className="font-mono text-2xl font-black text-amber-700 tracking-[0.3em]">{counterGeneratedCode}</p>
                    </div>
                    <div className="mb-6 text-left">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Ketik Kode di Atas untuk Konfirmasi
                        </label>
                        <input
                            type="text"
                            value={counterVerifCode}
                            onChange={(e) => setCounterVerifCode(e.target.value.toUpperCase())}
                            placeholder={counterGeneratedCode}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-center text-lg tracking-[0.2em] transition-all uppercase"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setCounterDialogOpen(false)}
                            disabled={formLoading}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmCounter}
                            disabled={formLoading || counterVerifCode !== counterGeneratedCode}
                            className="flex-[1.5] px-4 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:grayscale disabled:shadow-none active:scale-95"
                        >
                            {formLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Menyimpan...</span>
                                </div>
                            ) : 'Ya, Simpan'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirm Dialog */}
            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setDeletingItem(null);
                }}
                onConfirm={handleDelete}
                title="Hapus UD"
                message={`Apakah Anda yakin ingin menghapus "${deletingItem?.nama_ud}"? Data yang sudah dihapus tidak dapat dikembalikan.`}
                confirmText="Ya, Hapus"
                loading={deleteLoading}
            />
        </div>
    );
}
