import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, onSnapshot, setDoc, getDoc, query, deleteDoc, updateDoc } from 'firebase/firestore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { LogIn, LogOut, LayoutDashboard, Coins, Target, FileDown, PlusCircle, Trash2, Edit, Search, X as XIcon, Eye, EyeOff, TrendingUp, Wallet, ArrowUp, Copy } from 'lucide-react';

// --- Inisialisasi Firebase (Super Aman) ---
let app;
let auth;
let db;
let firebaseInitializationError = null;

try {
    if (!import.meta.env.VITE_FIREBASE_CONFIG) {
        throw new Error("Variabel VITE_FIREBASE_CONFIG tidak ditemukan.");
    }
    const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("KRITIS: Gagal total saat inisialisasi Firebase.", error);
    firebaseInitializationError = error.message;
}

const appId = 'default-app-id';

// --- FUNGSI YANG DIKEMBALIKAN: Untuk memuat script eksternal ---
const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Gagal memuat script ${src}`));
        document.head.appendChild(script);
    });
};


// --- Komponen Baru: Animasi saat scroll ---
function AnimatedSection({ children }) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.1,
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    return (
        <div
            ref={ref}
            className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
            {children}
        </div>
    );
}

// --- Komponen Baru: Tombol Kembali ke Atas ---
function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    return (
        <button
            onClick={scrollToTop}
            className={`fixed bottom-5 right-5 z-50 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            aria-label="Kembali ke atas"
        >
            <ArrowUp size={24} />
        </button>
    );
}

export default function App() {
    const [user, setUser] = useState(null);
    const [authReady, setAuthReady] = useState(false);
    const [firebaseError, setFirebaseError] = useState(firebaseInitializationError);

    useEffect(() => {
        if (firebaseError || !auth) return;
        
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setAuthReady(true);
            } else {
                signInAnonymously(auth).catch(error => {
                    console.error("Gagal login anonim:", error);
                    setFirebaseError(error.message); 
                });
            }
        });

        return () => unsubscribe();
    }, [firebaseError]);

    if (firebaseError) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-red-100 text-red-800 p-4">
                <h1 className="text-2xl font-bold mb-4">Koneksi Gagal</h1>
                <p className="text-center">Tidak dapat terhubung ke server Firebase.</p>
                <div className="mt-2 p-3 bg-red-200 rounded-md text-sm text-left">
                    <strong>Detail Error:</strong> {firebaseError}
                </div>
                <p className="text-center mt-4">
                    <b>Solusi:</b> Periksa kembali <b className="text-black">Environment Variables</b> di Netlify atau file <b className="text-black">.env.local</b> Anda.
                </p>
            </div>
        );
    }

    if (!authReady) {
        return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold">Menyiapkan Ruang Digital...</div></div>;
    }

    return (
        <div className="bg-gray-50 font-sans min-h-screen">
            {user ? (
                <MainApp user={user} onLogout={() => setUser(null)} />
            ) : (
                <LoginScreen onLogin={(profile) => setUser(profile)} />
            )}
            <ScrollToTopButton />
        </div>
    );
}

function LoginScreen({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const attemptLogin = (e) => {
        e.preventDefault();
        if (username === 'Nova' && password === 'SayangNia') {
            onLogin({ name: 'Nova', subtitle: 'Ayah Nova' });
            setError('');
        } else if (username === 'Nia' && password === 'SayangNova') {
            onLogin({ name: 'Nia', subtitle: 'Bunda Nia' });
            setError('');
        } else {
            setError('Nama pengguna atau kata sandi salah!');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-indigo-200 p-4">
            <form onSubmit={attemptLogin} className="w-full max-w-sm p-8 bg-white rounded-2xl shadow-xl space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">Dompet Digital</h1>
                    <p className="text-lg text-gray-600">Keluarga Nova - Nia</p>
                </div>
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center">{error}</div>}
                <div className="space-y-4">
                    <input type="text" placeholder="Nama Pengguna (Nova / Nia)" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 bg-gray-100 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} placeholder="Kata Sandi" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-gray-100 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>
                <button type="submit" className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105">
                    <LogIn className="mr-2 h-5 w-5" /> Masuk
                </button>
            </form>
             <p className="text-xs text-center text-gray-500 mt-4">Data disimpan per profil dan dapat dilihat bersama dalam satu keluarga.</p>
        </div>
    );
}

function MainApp({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState('dasbor');
    const [allTransactions, setAllTransactions] = useState([]);
    const [allBudgets, setAllBudgets] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [previousMonthBalance, setPreviousMonthBalance] = useState(0);
    const [scriptsLoaded, setScriptsLoaded] = useState(false);

    const profileDocPath = `artifacts/${appId}/public/data/profiles/${user.name}`;
    const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;

    useEffect(() => {
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")
            .then(() => loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js"))
            .then(() => loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"))
            .then(() => setScriptsLoaded(true))
            .catch(error => console.error("Gagal memuat skrip eksternal:", error));
    }, []);

    useEffect(() => {
        if (!db) return;
        setLoading(true);

        const transactionQuery = query(collection(db, `${profileDocPath}/transactions`));
        const budgetQuery = query(collection(db, `${profileDocPath}/budgets`));

        const unsubscribeTransactions = onSnapshot(transactionQuery, (snapshot) => {
            const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllTransactions(allDocs);
        }, (error) => console.error("Error fetching transactions:", error));

        const unsubscribeBudgets = onSnapshot(budgetQuery, (snapshot) => {
            const budgets = {};
            snapshot.forEach(doc => {
                budgets[doc.id] = doc.data(); // doc.id is "YYYY-MM"
            });
            setAllBudgets(budgets);
            setLoading(false);
        }, (error) => {
            setLoading(false);
            console.error("Error fetching budgets:", error);
        });

        return () => {
            unsubscribeTransactions();
            unsubscribeBudgets();
        };
    }, [user.name]);

    useEffect(() => {
        if (loading) return;

        const allMonths = [...new Set([
            ...Object.keys(allBudgets),
            ...allTransactions.map(t => t.date.substring(0, 7))
        ])].sort();

        let cumulativeBalance = 0;
        const balances = {};

        for (const month of allMonths) {
            const budget = allBudgets[month] || { incomes: [] };
            const income = budget.incomes?.reduce((s, i) => s + Number(i.amount || 0), 0) || 0;
            const spending = allTransactions
                .filter(t => t.date && t.date.startsWith(month))
                .reduce((s, t) => s + Number(t.amount || 0), 0);
            
            cumulativeBalance += (income - spending);
            balances[month] = cumulativeBalance;
        }

        const prevMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
        const prevMonthFormatted = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
        
        setPreviousMonthBalance(balances[prevMonthFormatted] || 0);

    }, [allTransactions, allBudgets, selectedDate, loading]);

    const budgetPlan = useMemo(() => allBudgets[formattedDate] || { incomes: [], savings: [], budgetCategories: [] }, [allBudgets, formattedDate]);
    
    const handleCopyPreviousBudget = async () => {
        const prevMonthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
        const prevMonthFormatted = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
        const previousBudget = allBudgets[prevMonthFormatted];

        if (previousBudget) {
            await setDoc(doc(db, `${profileDocPath}/budgets/${formattedDate}`), previousBudget);
        } else {
            alert("Tidak ada data rencana anggaran dari bulan sebelumnya.");
        }
    };

    const handleTransactionAction = async (action, data) => {
        const { id, ...payload } = data;
        const transactionPath = `${profileDocPath}/transactions`;
        try {
            if (action === 'add') {
                const newDocRef = await addDoc(collection(db, transactionPath), payload);
                const transactionId = newDocRef.id; 
                await fetch('/.netlify/functions/addToSheet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, user: user.name, transactionId }), });
            } else if (action === 'update') {
                await updateDoc(doc(db, transactionPath, id), payload);
                await fetch('/.netlify/functions/updateSheet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactionId: id, newData: { ...payload, user: user.name } }), });
            } else if (action === 'delete') {
                await deleteDoc(doc(db, transactionPath, id));
                await fetch('/.netlify/functions/deleteSheet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactionId: id }), });
            }
        } catch (error) {
            console.error(`Gagal ${action} transaksi: `, error);
        }
    };

    const handleUpdateBudgetPlan = async (newPlan) => {
        try {
            await setDoc(doc(db, `${profileDocPath}/budgets/${formattedDate}`), newPlan);
        } catch (error) {
            console.error("Gagal memperbarui rencana: ", error);
        }
    };
    
    const monthlyTransactions = useMemo(() => {
        return allTransactions.filter(t => t.date && t.date.startsWith(formattedDate));
    }, [allTransactions, formattedDate]);

    const monthlySummary = useMemo(() => {
        const totalIncome = budgetPlan.incomes?.reduce((s, i) => s + Number(i.amount || 0), 0) || 0;
        const totalSpent = monthlyTransactions.reduce((s, t) => s + Number(t.amount || 0), 0);
        const sisaSaldo = (previousMonthBalance + totalIncome) - totalSpent;
        return { totalIncome, totalSpent, sisaSaldo };
    }, [budgetPlan, monthlyTransactions, previousMonthBalance]);

    const exportData = (type) => {
        if (!scriptsLoaded) {
            alert("Pustaka ekspor sedang dimuat, silakan coba lagi sesaat lagi.");
            return;
        }
        
        // --- PERBAIKAN: Urutkan data sebelum diekspor ---
        const dataToExport = [...monthlyTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const { totalIncome, totalSpent, sisaSaldo } = monthlySummary;
        
        const formatCurrency = (value) => `Rp ${Number(value).toLocaleString('id-ID')}`;

        if (type === 'pdf') {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert("Pustaka PDF (jsPDF) tidak dapat dimuat.");
                return;
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            if (typeof doc.autoTable !== 'function') {
                alert("Pustaka tabel PDF (autoTable) tidak termuat. Silakan muat ulang halaman.");
                return;
            }
            doc.setFontSize(18);
            doc.text(`Laporan Keuangan - ${formattedDate}`, 14, 20);
            
            doc.setFontSize(12);
            doc.text(`Total Pemasukan: ${formatCurrency(totalIncome)}`, 14, 30);
            doc.text(`Total Pengeluaran: ${formatCurrency(totalSpent)}`, 14, 37);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(`Sisa Saldo: ${formatCurrency(sisaSaldo)}`, 14, 46);
            
            doc.autoTable({
                startY: 55,
                head: [['Tanggal', 'Deskripsi', 'Kategori', 'Nominal']],
                body: dataToExport.map(t => [t.date, t.description, t.category, formatCurrency(t.amount)]),
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] },
            });
            doc.save(`laporan_${user.name}_${formattedDate}.pdf`);
        } else if (type === 'excel') {
             const summaryData = [
                ["Laporan Keuangan", formattedDate],
                [],
                ["Total Pemasukan", totalIncome],
                ["Total Pengeluaran", totalSpent],
                ["Sisa Saldo", sisaSaldo],
                [],
             ];

            const transactionHeader = ["Tanggal", "Deskripsi", "Kategori", "Nominal"];
            const transactionBody = dataToExport.map(t => [t.date, t.description, t.category, t.amount]);

            const finalData = [...summaryData, transactionHeader, ...transactionBody];
            
            const worksheet = window.XLSX.utils.aoa_to_sheet(finalData);

            worksheet['!cols'] = [ {wch:12}, {wch:30}, {wch:20}, {wch:15} ];
            
            const workbook = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(workbook, worksheet, `Laporan ${formattedDate}`);
            window.XLSX.writeFile(workbook, `laporan_${user.name}_${formattedDate}.xlsx`);
        }
    };


    const tabs = [ { id: 'dasbor', label: 'Dasbor', icon: LayoutDashboard }, { id: 'pelacak', label: 'Pelacak Pengeluaran', icon: Coins }, { id: 'rencana', label: 'Rencana Anggaran', icon: Target }, ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 6}, (_, i) => currentYear + i);
    const months = Array.from({length: 12}, (_, i) => new Date(0, i).toLocaleString('id-ID', { month: 'long' }));

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <header className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl font-bold text-gray-800">Dompet Digital</h1>
                    <p className="text-xl text-gray-500">{user.subtitle}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 mt-4 md:mt-0">
                    <select value={selectedDate.getFullYear()} onChange={e => setSelectedDate(new Date(e.target.value, selectedDate.getMonth()))} className="p-2 border rounded-lg bg-white shadow-sm w-full sm:w-auto">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={selectedDate.getMonth()} onChange={e => setSelectedDate(new Date(selectedDate.getFullYear(), e.target.value))} className="p-2 border rounded-lg bg-white shadow-sm w-full sm:w-auto">
                        {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <button onClick={onLogout} className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600">
                        <LogOut className="mr-2 h-5 w-5" /> Keluar
                    </button>
                </div>
            </header>
            
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <nav className="flex space-x-1 sm:space-x-2 bg-gray-200 p-1 rounded-lg">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center px-3 py-2 text-sm md:text-base font-medium rounded-md transition-all duration-300 ease-in-out hover:-translate-y-1 ${activeTab === tab.id ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-300'}`}>
                            <tab.icon className="mr-2 h-4 w-4 md:h-5 md:w-5" /> {tab.label}
                        </button>
                    ))}
                </nav>
                 <div className="flex space-x-2">
                    <button onClick={() => exportData('pdf')} disabled={!scriptsLoaded} className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg shadow hover:bg-green-700 disabled:bg-gray-400"><FileDown className="h-4 w-4 mr-1" /> PDF</button>
                    <button onClick={() => exportData('excel')} disabled={!scriptsLoaded} className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:bg-gray-400"><FileDown className="h-4 w-4 mr-1" /> Excel</button>
                </div>
            </div>

            <main>
                {loading ? <div className="text-center py-10">Memuat data untuk {months[selectedDate.getMonth()]} {selectedDate.getFullYear()}...</div> : (
                    <>
                        {activeTab === 'dasbor' && <Dasbor allTransactions={allTransactions} currentMonthTransactions={monthlyTransactions} budgetPlan={budgetPlan} summary={monthlySummary} previousMonthBalance={previousMonthBalance} />}
                        {activeTab === 'pelacak' && <PelacakPengeluaran transactions={monthlyTransactions} budgetPlan={budgetPlan} onTransactionAction={handleTransactionAction} />}
                        {activeTab === 'rencana' && <RencanaAnggaran budgetPlan={budgetPlan} onUpdate={handleUpdateBudgetPlan} onCopyPrevious={handleCopyPreviousBudget} />}
                    </>
                )}
            </main>
        </div>
    );
}

function Dasbor({ allTransactions, currentMonthTransactions, budgetPlan, summary, previousMonthBalance }) {
    const expenseByCategory = useMemo(() => {
        return budgetPlan.budgetCategories?.map(cat => {
            const spent = currentMonthTransactions.filter(t => t.category === cat.name).reduce((s, t) => s + Number(t.amount || 0), 0);
            const allocation = Number(cat.allocation || 0);
            const usage = allocation > 0 ? (spent / allocation) * 100 : 0;
            return { name: cat.name, allocation, realization: spent, usage: Math.round(usage) };
        }) || [];
    }, [currentMonthTransactions, budgetPlan]);
    
    const dailyExpenseData = useMemo(() => {
        const data = currentMonthTransactions.reduce((acc, curr) => {
            const day = new Date(curr.date).getDate();
            if (!acc[day]) acc[day] = { name: `Tgl ${day}`, Pengeluaran: 0 };
            acc[day].Pengeluaran += Number(curr.amount);
            return acc;
        }, {});
        return Object.values(data).sort((a,b) => Number(a.name.split(' ')[1]) - Number(b.name.split(' ')[1]));
    }, [currentMonthTransactions]);
    
    const monthlyTrendData = useMemo(() => {
        const trends = {};
        allTransactions.forEach(t => {
            if (!t.date) return;
            const monthKey = t.date.substring(0, 7);
            if (!trends[monthKey]) {
                trends[monthKey] = 0;
            }
            trends[monthKey] += Number(t.amount || 0);
        });

        return Object.keys(trends).sort().slice(-6).map(key => {
            const [year, month] = key.split('-');
            const monthName = new Date(year, month - 1).toLocaleString('id-ID', { month: 'short' });
            return { name: `${monthName} '${year.slice(2)}`, Pengeluaran: trends[key] };
        });
    }, [allTransactions]);
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];
    const pieChartData = expenseByCategory.filter(d => d.realization > 0);

    return (
        <div className="space-y-6">
            <AnimatedSection>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <InfoCard title="Sisa Bulan Lalu" value={previousMonthBalance} color="from-gray-400 to-gray-500" icon={Wallet}/>
                    <InfoCard title="Pemasukan Bulan Ini" value={summary.totalIncome} color="from-green-400 to-green-500" />
                    <InfoCard title="Pengeluaran Bulan Ini" value={summary.totalSpent} color="from-red-400 to-red-500" />
                    <InfoCard title="Rencana Tabungan" value={budgetPlan.savings?.reduce((s, i) => s + Number(i.amount || 0), 0) || 0} color="from-yellow-400 to-yellow-500" />
                    <InfoCard title="Sisa Uang (Total)" value={summary.sisaSaldo} color="from-purple-400 to-purple-500" />
                </div>
            </AnimatedSection>
            <AnimatedSection>
                 <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
                        <h3 className="text-xl font-semibold mb-4">Ringkasan Anggaran per Kategori</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead><tr className="border-b"><th className="p-2 text-sm">Kategori</th><th className="p-2 text-sm">Alokasi</th><th className="p-2 text-sm">Realisasi</th><th className="p-2 w-1/3 text-sm">% Penggunaan</th></tr></thead>
                                <tbody>
                                    {expenseByCategory.map((item, index) => (
                                        <tr key={index} className="border-b"><td className="p-2 font-medium">{item.name}</td><td className="p-2">Rp {item.allocation.toLocaleString('id-ID')}</td><td className="p-2">Rp {item.realization.toLocaleString('id-ID')}</td>
                                            <td className="p-2">
                                                <div className="flex items-center">
                                                    <div className="w-full bg-gray-200 rounded-full h-4 mr-2"><div className={`${item.usage > 100 ? 'bg-red-500' : 'bg-blue-500'} h-4 rounded-full`} style={{ width: `${item.usage > 100 ? 100 : item.usage}%` }}></div></div>
                                                    <span className="text-sm">{item.usage}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
                        <h3 className="text-xl font-semibold mb-4">Realisasi Pengeluaran (%)</h3>
                        {pieChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={pieChartData} dataKey="realization" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>{pieChartData.map((e, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}</Pie>
                                    <Tooltip formatter={(v) => `Rp ${Number(v).toLocaleString('id-ID')}`} /><Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <p className="text-center text-gray-500 h-full flex items-center justify-center">Belum ada data.</p>}
                    </div>
                </div>
            </AnimatedSection>
            <AnimatedSection>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
                         <h3 className="text-xl font-semibold mb-4">Tren Pengeluaran Harian</h3>
                         {dailyExpenseData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dailyExpenseData}>
                                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{fontSize: 12}} /><YAxis tickFormatter={(v) => `Rp${(v/1e3).toFixed(0)}k`} tick={{fontSize: 12}}/>
                                    <Tooltip formatter={(v) => `Rp ${Number(v).toLocaleString('id-ID')}`} /><Legend /><Bar dataKey="Pengeluaran" fill="#82ca9d" />
                                </BarChart>
                            </ResponsiveContainer>
                         ) : <p className="text-center text-gray-500 h-full flex items-center justify-center">Belum ada data harian.</p>}
                    </div>
                    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
                         <h3 className="text-xl font-semibold mb-4 flex items-center"><TrendingUp className="mr-2 h-6 w-6 text-blue-500"/>Tren Pengeluaran Bulanan</h3>
                         {monthlyTrendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={monthlyTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{fontSize: 12}}/>
                                    <YAxis tickFormatter={(v) => `Rp${(v/1e6).toFixed(1)}jt`} tick={{fontSize: 12}}/>
                                    <Tooltip formatter={(v) => `Rp ${Number(v).toLocaleString('id-ID')}`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="Pengeluaran" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                         ) : <p className="text-center text-gray-500 h-full flex items-center justify-center">Belum ada data bulanan.</p>}
                    </div>
                </div>
            </AnimatedSection>
        </div>
    );
}

function InfoCard({ title, value, color, icon: Icon }) {
    return (
        <div className={`bg-gradient-to-br ${color} text-white p-4 rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1`}>
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold tracking-wide">{title}</h4>
                {Icon && <Icon className="h-5 w-5 opacity-70"/>}
            </div>
            <p className="text-2xl font-bold mt-1">Rp {Number(value).toLocaleString('id-ID')}</p>
        </div>
    );
}

function RencanaAnggaran({ budgetPlan, onUpdate, onCopyPrevious }) {
    const [plan, setPlan] = useState(budgetPlan); 

    useEffect(() => { setPlan(budgetPlan); }, [budgetPlan]);

    const handleUpdate = () => { onUpdate(plan); };
    
    const handleItemChange = (type, index, field, value) => {
        const newPlan = JSON.parse(JSON.stringify(plan));
        if(!newPlan[type]) newPlan[type] = [];
        newPlan[type][index][field] = value;
        setPlan(newPlan);
    };
    
    const handleAddItem = (type) => {
        const newPlan = JSON.parse(JSON.stringify(plan));
        const defaultItem = type === 'incomes' ? {source: '', amount: 0} : type === 'savings' ? {name: '', amount: 0} : {name: '', allocation: 0, type: 'Kebutuhan'};
        if(!newPlan[type]) newPlan[type] = [];
        newPlan[type].push(defaultItem);
        setPlan(newPlan);
    };

    const handleRemoveItem = (type, index) => {
        const newPlan = JSON.parse(JSON.stringify(plan));
        newPlan[type].splice(index, 1);
        setPlan(newPlan);
    };
    
    const totals = useMemo(() => {
        const totalIncome = plan.incomes?.reduce((s, i) => s + Number(i.amount || 0), 0) || 0;
        const totalSavings = plan.savings?.reduce((s, i) => s + Number(i.amount || 0), 0) || 0;
        const totalBudgeting = plan.budgetCategories?.reduce((s, i) => s + Number(i.allocation || 0), 0) || 0;
        return { totalIncome, totalSavings, totalBudgeting };
    }, [plan]);

    return (
        <AnimatedSection>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-700">Rencana Anggaran Bulan Ini</h2>
                    <button onClick={onCopyPrevious} className="flex items-center px-4 py-2 text-sm bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600">
                        <Copy className="h-4 w-4 mr-2" /> Gunakan Rencana Bulan Lalu
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                     <InfoCard title="Total Rencana Pemasukan" value={totals.totalIncome} color="from-green-400 to-green-500" />
                     <InfoCard title="Total Rencana Tabungan" value={totals.totalSavings} color="from-yellow-400 to-yellow-500" />
                     <InfoCard title="Total Rencana Anggaran" value={totals.totalBudgeting} color="from-blue-400 to-blue-500" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <EditableList title="Sumber Pemasukan" items={plan.incomes || []} type="incomes" onChange={handleItemChange} onAdd={handleAddItem} onRemove={handleRemoveItem} fields={[{name: 'source', placeholder: 'Sumber Gaji'}, {name: 'amount', placeholder: 'Jumlah', type: 'number'}]} />
                    <EditableList title="Rencana Tabungan" items={plan.savings || []} type="savings" onChange={handleItemChange} onAdd={handleAddItem} onRemove={handleRemoveItem} fields={[{name: 'name', placeholder: 'Dana Darurat'}, {name: 'amount', placeholder: 'Jumlah', type: 'number'}]} />
                    <EditableList title="Alokasi Anggaran" items={plan.budgetCategories || []} type="budgetCategories" onChange={handleItemChange} onAdd={handleAddItem} onRemove={handleRemoveItem} fields={[{name: 'name', placeholder: 'Makan & Minum'}, {name: 'allocation', placeholder: 'Alokasi', type: 'number'}]} hasType={true} />
                </div>
                <div className="flex justify-end mt-6"><button onClick={handleUpdate} className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700">Simpan Rencana Bulan Ini</button></div>
            </div>
        </AnimatedSection>
    );
}

function PelacakPengeluaran({ transactions, budgetPlan, onTransactionAction }) {
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("Semua");

    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => {
                const searchMatch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
                const categoryMatch = filterCategory === 'Semua' || t.category === filterCategory;
                return searchMatch && categoryMatch;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, searchTerm, filterCategory]);
    
    return (
        <AnimatedSection>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {editingTransaction && <EditTransactionModal transaction={editingTransaction} budgetPlan={budgetPlan} onClose={() => setEditingTransaction(null)} onSave={(data) => { onTransactionAction('update', data); setEditingTransaction(null);}} />}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
                    <h3 className="text-xl font-semibold mb-4">Tambah Pengeluaran</h3>
                    <TransactionForm budgetPlan={budgetPlan} onSubmit={(data) => onTransactionAction('add', data)} />
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
                    <h3 className="text-xl font-semibold mb-4">Riwayat Pengeluaran</h3>
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="relative flex-grow w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                            <input type="text" placeholder="Cari deskripsi..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 pl-10 border rounded-lg"/>
                        </div>
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full sm:w-auto p-2 border rounded-lg bg-white">
                            <option value="Semua">Semua Kategori</option>
                            {budgetPlan.budgetCategories?.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white z-10"><tr className="border-b"><th className="p-2 text-sm">Tanggal</th><th className="p-2 text-sm">Deskripsi</th><th className="p-2 text-sm">Kategori</th><th className="p-2 text-sm text-right">Nominal</th><th className="p-2 text-sm text-center">Aksi</th></tr></thead>
                            <tbody>
                                {filteredTransactions.map((t) => (
                                    <tr key={t.id} className="border-b hover:bg-gray-50">
                                        <td className="p-2">{t.date}</td><td className="p-2">{t.description}</td>
                                        <td className="p-2"><span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">{t.category}</span></td>
                                        <td className="p-2 text-right">Rp {Number(t.amount).toLocaleString('id-ID')}</td>
                                        <td className="p-2 text-center flex justify-center gap-2">
                                            <button onClick={() => setEditingTransaction(t)} className="text-blue-500 hover:text-blue-700"><Edit size={18}/></button>
                                            <button onClick={() => onTransactionAction('delete', { id: t.id })} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AnimatedSection>
    );
}

function TransactionForm({ budgetPlan, onSubmit, initialData = {} }) {
    const [date, setDate] = useState(initialData.date || new Date().toISOString().slice(0, 10));
    const [description, setDescription] = useState(initialData.description || '');
    const [category, setCategory] = useState(initialData.category || '');
    const [amount, setAmount] = useState(initialData.amount || '');

    useEffect(() => {
        if (!category && budgetPlan.budgetCategories?.length > 0) setCategory(budgetPlan.budgetCategories[0].name);
    }, [budgetPlan, category]);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!date || !description || !category || !amount) return;
        onSubmit({ ...initialData, date, description, category, amount: parseFloat(amount) });
        if (!initialData.id) { setDescription(''); setAmount(''); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-lg" required />
            <input type="text" placeholder="Deskripsi" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded-lg" required />
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border rounded-lg" required>
                <option value="" disabled>Pilih Kategori</option>
                {budgetPlan.budgetCategories?.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
            </select>
            <input type="number" placeholder="Nominal" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border rounded-lg" required />
            <button type="submit" className="w-full flex items-center justify-center p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
                {initialData.id ? 'Simpan Perubahan' : <><PlusCircle className="mr-2 h-5 w-5"/>Tambah</>}
            </button>
        </form>
    );
}

function EditTransactionModal({ transaction, budgetPlan, onClose, onSave }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Edit Pengeluaran</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><XIcon size={24}/></button>
                </div>
                <TransactionForm budgetPlan={budgetPlan} initialData={transaction} onSubmit={onSave} />
            </div>
        </div>
    );
}

function EditableList({ title, items, type, onChange, onAdd, onRemove, fields, hasType=false }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-md space-y-3 transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1">
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            {items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-2 items-center">
                    <div className="flex-grow w-full grid grid-cols-2 gap-2">
                        {fields.map(field => <input key={field.name} type={field.type || 'text'} placeholder={field.placeholder} value={item[field.name] || ''} onChange={(e) => onChange(type, index, field.name, e.target.value)} className="w-full p-2 border rounded-lg"/>)}
                    </div>
                    {hasType && (<select value={item.type || 'Kebutuhan'} onChange={(e) => onChange(type, index, 'type', e.target.value)} className="w-full sm:w-auto flex-grow p-2 border rounded-lg"><option>Kebutuhan</option><option>Keinginan</option></select>)}
                    <button onClick={() => onRemove(type, index)} className="text-red-500 hover:text-red-700 flex-shrink-0"><Trash2 size={20}/></button>
                </div>
            ))}
            <button onClick={() => onAdd(type)} className="w-full mt-2 p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">+ Tambah</button>
        </div>
    );
}
