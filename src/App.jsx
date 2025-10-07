import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDocs,
    onSnapshot,
    writeBatch,
    updateDoc,
    query,
    where,
    serverTimestamp,
    increment,
    deleteDoc
} from 'firebase/firestore';

// --- Helper Functions & Configuration ---

const firebaseConfig = {
    apiKey: "AIzaSyDElzQdprgSfJsGE3I3nTqvIERiAbznCu4",
    authDomain: "music-acadamy-app.firebaseapp.com",
    projectId: "music-acadamy-app",
    storageBucket: "music-acadamy-app.appspot.com",
    messagingSenderId: "714753123495",
    appId: "1:714753123495:web:968d1d4533586fa46d2782",
    measurementId: "G-F2WH7HFY35"
};

const appId = 'default-music-app';
// --- Admin Configuration ---
const ADMIN_UIDS = ['jkFnWhZyv0evMPAYI0qLY9hNSO42', 'FrBKqEXGKkZdg7Etliq6uxIR7WH3'];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Create a secondary app instance for creating users without affecting the admin's session.
const secondaryApp = initializeApp(firebaseConfig, `secondary-app-${Date.now()}`);
const secondaryAuth = getAuth(secondaryApp);


// --- Static Course Data ---
const COURSES_DATA = [
    { id: 'aalaap', title: 'Aalaap (Beginner Group Classes)', monthlyFee: 700, admissionCharge: 1300 },
    { id: 'vyakaran', title: 'Vyakaran (Intermediate Group Classes)', monthlyFee: 700, admissionCharge: 1300 },
    { id: 'vistaar', title: 'Vistaar (Advanced Group Classes)', monthlyFee: 700, admissionCharge: 1300 },
    { id: 'kalakar', title: 'Kalakar (Advanced Individual Classes)', monthlyFee: 4000, admissionCharge: 0 },
    { id: 'arpeggio', title: 'Arpeggio (Individual Piano Classes)', monthlyFee: 1000, admissionCharge: 1000 },
    { id: 'chromatic', title: 'Chromatic (Individual Guitar Classes)', monthlyFee: 700, admissionCharge: 1300 },
];

// --- Icon Components ---
const LogOutIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const ChevronLeftIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const HomeIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const ShieldIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>;
const UserPlusIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="17" y1="11" x2="23" y2="11"></line></svg>;
const Trash2Icon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const DollarSignIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>;
const UsersIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const EditIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const SendIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
const MoreVerticalIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>;

// --- UI Components ---

const LoadingSpinner = () => ( <div className="flex justify-center items-center h-full"> <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div> </div> );

const AuthComponent = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <video
                        src="https://video.wixstatic.com/video/81702c_6268d3f9e3fa4e99a1bb9e7846488aa8/360p/mp4/file.mp4"
                        alt="Shurpancham Music Academy Logo"
                        className="w-24 h-24 mx-auto rounded-full object-cover shadow-lg"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                    <h1 className="text-4xl font-bold mt-4">Shurpancham Music Academy</h1>
                    <p className="text-gray-400">Student & Admin Portal</p>
                </div>
                <div className="bg-gray-800 p-8 rounded-lg shadow-2xl">
                    <h2 className="text-2xl font-semibold text-center mb-6">Log In</h2>
                    {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4 text-sm">{error}</p>}
                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <label className="block text-gray-400 mb-2" htmlFor="email">Email</label>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-400 mb-2" htmlFor="password">Password</label>
                            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-blue-800 disabled:cursor-not-allowed">
                            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div> : 'Log In'}
                        </button>
                    </form>
                    <p className="text-center text-xs text-gray-500 mt-6">
                        Please contact the administrator for login credentials.
                    </p>
                </div>
            </div>
        </div>
    );
};

const StudentDashboard = ({ user }) => {
    const [enrollments, setEnrollments] = useState([]);
    const [payments, setPayments] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const enrollmentsQuery = query(collection(db, `artifacts/${appId}/public/data/enrollments`), where('studentId', '==', user.uid));
        const unsubscribe = onSnapshot(enrollmentsQuery, (snapshot) => {
            const enrollmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEnrollments(enrollmentsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (enrollments.length > 0) {
            enrollments.forEach(enrollment => {
                const paymentsCollection = collection(db, `artifacts/${appId}/public/data/enrollments/${enrollment.id}/payments`);
                onSnapshot(paymentsCollection, (paymentsSnapshot) => {
                    const paymentsData = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setPayments(prev => ({ ...prev, [enrollment.id]: paymentsData }));
                });
            });
        }
    }, [enrollments]);

    if (loading) return <div className="p-8"><LoadingSpinner /></div>;

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
            <p className="text-gray-400 mb-8">Welcome! Here are your course and fee details.</p>
            {enrollments.length > 0 ? (
                <div className="space-y-8">
                    {enrollments.map(e => (
                        <div key={e.id} className="bg-gray-800 rounded-lg shadow-lg p-6">
                            <h2 className="text-2xl font-bold mb-2">{e.courseTitle}</h2>
                            <p className="text-sm text-gray-400 mb-4">Plan: Monthly</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 text-center">
                                <div className="bg-gray-700/50 p-4 rounded-lg"><p className="text-sm text-gray-400">Monthly Fee</p><p className="text-2xl font-bold">₹{e.monthlyFee.toLocaleString('en-IN')}</p></div>
                                <div className="bg-green-500/10 p-4 rounded-lg"><p className="text-sm text-green-400">Total Paid</p><p className="text-2xl font-bold text-green-300">₹{e.totalPaid.toLocaleString('en-IN')}</p></div>
                                <div className="bg-red-500/10 p-4 rounded-lg"><p className="text-sm text-red-400">Balance Due</p><p className="text-2xl font-bold text-red-300">₹{e.balanceDue.toLocaleString('en-IN')}</p></div>
                            </div>
                            <h3 className="text-xl font-semibold mt-6 mb-3">Payment History</h3>
                            <div className="space-y-2">
                                {(payments[e.id] || []).length > 0 ? (payments[e.id].map(p => (
                                    <div key={p.id} className="bg-gray-700/50 p-3 rounded-md flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">₹{p.amountPaid.toLocaleString('en-IN')}</p>
                                            <p className="text-xs text-gray-400">Receipt: {p.receiptNumber} ({p.paymentMethod})</p>
                                        </div>
                                        <p className="text-xs text-gray-400">{p.paymentDate?.toDate().toLocaleDateString()}</p>
                                    </div>
                                ))) : <p className="text-gray-400 text-sm text-center p-4">No payments found.</p>}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center bg-gray-800 p-8 rounded-lg">
                    <p className="text-gray-400">You are not yet enrolled in any courses.</p>
                </div>
            )}
        </div>
    );
};


const AdminDashboard = ({ setView, setSelectedEnrollment }) => {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [notification, setNotification] = useState('');
    const [openMenuId, setOpenMenuId] = useState(null);

    useEffect(() => {
        const enrollmentsQuery = query(collection(db, `artifacts/${appId}/public/data/enrollments`));
        const unsubscribe = onSnapshot(enrollmentsQuery, (snapshot) => {
            const enrollmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEnrollments(enrollmentsData);
            setLoading(false);
        }, (error) => { console.error("Error fetching enrollments:", error); setLoading(false); });
        return () => unsubscribe();
    }, []);

    const filteredEnrollments = useMemo(() => {
        return enrollments
            .filter(e => {
                if (statusFilter === 'all') return true;
                return e.status === statusFilter;
            })
            .filter(e => {
                const term = searchTerm.toLowerCase();
                return e.studentName?.toLowerCase().includes(term) ||
                       e.studentEmail?.toLowerCase().includes(term) ||
                       e.phoneNumber?.includes(term);
            });
    }, [enrollments, searchTerm, statusFilter]);

    const handleToggleStatus = async (e, enrollmentId, currentStatus) => {
        e.stopPropagation(); // Prevent row click
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const enrollmentRef = doc(db, `artifacts/${appId}/public/data/enrollments`, enrollmentId);
        try {
            await updateDoc(enrollmentRef, { status: newStatus });
            setNotification(`Student status updated to ${newStatus}.`);
        } catch (error) {
            console.error("Error updating student status:", error);
            setNotification('Failed to update status.');
        }
        setTimeout(() => setNotification(''), 3000);
    };
    
    const handleSendPasswordReset = async (e, email) => {
        e.stopPropagation(); // Prevent row click
        try {
            await sendPasswordResetEmail(auth, email);
            setNotification(`Password reset email sent to ${email}.`);
        } catch (error) {
            console.error("Error sending password reset email:", error);
            setNotification('Failed to send email.');
        }
        setTimeout(() => setNotification(''), 3000);
    };

    return (
        <div className="p-4 md:p-8">
            {notification && <div className="fixed top-5 right-5 bg-blue-600 text-white py-2 px-4 rounded-lg shadow-lg animate-pulse">{notification}</div>}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold">Student Roster</h1>
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                    />
                    <button onClick={() => setView('register-student')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2 flex-shrink-0">
                        <UserPlusIcon className="w-5 h-5"/> Register
                    </button>
                </div>
            </div>

             <div className="mb-4 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-400">Filter by status:</span>
                <button onClick={() => setStatusFilter('active')} className={`px-3 py-1 text-xs rounded-full ${statusFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Active</button>
                <button onClick={() => setStatusFilter('inactive')} className={`px-3 py-1 text-xs rounded-full ${statusFilter === 'inactive' ? 'bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Inactive</button>
                <button onClick={() => setStatusFilter('all')} className={`px-3 py-1 text-xs rounded-full ${statusFilter === 'all' ? 'bg-gray-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>All</button>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-left text-sm text-gray-300">
                        <thead className="bg-gray-700/50 text-xs uppercase text-gray-400">
                            <tr>
                                <th className="p-4">Student</th>
                                <th className="p-4">Course</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEnrollments.map(e => (
                                <tr key={e.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                                    <td className="p-4 cursor-pointer" onClick={() => { setSelectedEnrollment(e); setView('student-ledger');}}>
                                        <p className="font-medium">{e.studentName}</p>
                                        <p className="text-xs text-gray-400">{e.studentEmail}</p>
                                        <p className="text-xs text-gray-400">{e.phoneNumber}</p>
                                    </td>
                                    <td className="p-4 cursor-pointer" onClick={() => { setSelectedEnrollment(e); setView('student-ledger');}}>{e.courseTitle}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${e.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {e.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center relative">
                                         <button onClick={() => setOpenMenuId(openMenuId === e.id ? null : e.id)} className="p-2 rounded-full hover:bg-gray-600">
                                            <MoreVerticalIcon className="w-5 h-5"/>
                                         </button>
                                         {openMenuId === e.id && (
                                            <div className="absolute right-8 top-full mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10">
                                                <button onClick={(event) => { setSelectedEnrollment(e); setView('edit-student'); setOpenMenuId(null); event.stopPropagation(); }} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 flex items-center gap-2"><EditIcon className="w-4 h-4"/> Edit Details</button>
                                                <button onClick={(event) => {handleToggleStatus(event, e.id, e.status); setOpenMenuId(null);}} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 flex items-center gap-2">{e.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                                                <button onClick={(event) => {handleSendPasswordReset(event, e.studentEmail); setOpenMenuId(null);}} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 flex items-center gap-2"><SendIcon className="w-4 h-4"/> Resend Password</button>
                                            </div>
                                         )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {loading && <div className="p-8"><LoadingSpinner /></div>}
                     {!loading && filteredEnrollments.length === 0 && <p className="p-8 text-center text-gray-400">No students found.</p>}
                </div>
            </div>
        </div>
    );
};

const StudentLedger = ({ enrollment, setView }) => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form state
    const [amount, setAmount] = useState('');
    const [receiptNumber, setReceiptNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');

    useEffect(() => {
        const paymentsCollection = collection(db, `artifacts/${appId}/public/data/enrollments/${enrollment.id}/payments`);
        const unsubscribe = onSnapshot(paymentsCollection, (snapshot) => {
            const paymentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.paymentDate - a.paymentDate);
            setPayments(paymentsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [enrollment.id]);

    const handleAddPayment = async (e) => {
        e.preventDefault();
        const paidAmount = parseFloat(amount);
        if (isNaN(paidAmount) || paidAmount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        setIsAdding(true);
        try {
            const batch = writeBatch(db);
            const paymentRef = doc(collection(db, `artifacts/${appId}/public/data/enrollments/${enrollment.id}/payments`));
            batch.set(paymentRef, {
                amountPaid: paidAmount,
                receiptNumber,
                paymentMethod,
                paymentDate: serverTimestamp(),
            });

            const enrollmentRef = doc(db, `artifacts/${appId}/public/data/enrollments`, enrollment.id);
            const newBalance = enrollment.balanceDue - paidAmount;
            
            batch.update(enrollmentRef, {
                totalPaid: increment(paidAmount),
                balanceDue: newBalance,
                invoiceStatus: newBalance <= 0 ? 'Paid' : 'Pending',
            });
            await batch.commit();
            setAmount(''); setReceiptNumber(''); setPaymentMethod('Cash');
        } catch (error) {
            console.error("Error adding payment:", error);
        } finally {
            setIsAdding(false);
        }
    };

    const handleDeletePayment = async (payment) => {
        try {
            const batch = writeBatch(db);
            const paymentRef = doc(db, `artifacts/${appId}/public/data/enrollments/${enrollment.id}/payments`, payment.id);
            batch.delete(paymentRef);

            const enrollmentRef = doc(db, `artifacts/${appId}/public/data/enrollments`, enrollment.id);
            const newBalance = enrollment.balanceDue + payment.amountPaid;

            batch.update(enrollmentRef, {
                totalPaid: increment(-payment.amountPaid),
                balanceDue: newBalance,
                invoiceStatus: 'Pending',
            });
            await batch.commit();
        } catch (error) {
            console.error("Error deleting payment:", error);
        }
    };

    return (
         <div className="p-4 md:p-8">
             <button onClick={() => setView('admin-dashboard')} className="flex items-center text-blue-400 hover:text-blue-300 mb-6"> <ChevronLeftIcon className="w-5 h-5 mr-1" /> Back to Dashboard </button>
             <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                 <h1 className="text-2xl font-bold">Student Ledger</h1>
                 <p className="text-gray-400">{enrollment.studentEmail} - {enrollment.courseTitle}</p>
                
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 text-center">
                    <div className="bg-gray-700/50 p-4 rounded-lg"><p className="text-sm text-gray-400">Initial Invoice</p><p className="text-2xl font-bold">₹{enrollment.invoiceAmount.toLocaleString('en-IN')}</p></div>
                    <div className="bg-green-500/10 p-4 rounded-lg"><p className="text-sm text-green-400">Total Paid</p><p className="text-2xl font-bold text-green-300">₹{enrollment.totalPaid.toLocaleString('en-IN')}</p></div>
                    <div className="bg-red-500/10 p-4 rounded-lg"><p className="text-sm text-red-400">Balance Due</p><p className="text-2xl font-bold text-red-300">₹{enrollment.balanceDue.toLocaleString('en-IN')}</p></div>
                 </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                         <h2 className="text-xl font-semibold mb-4">Add New Payment / Receipt</h2>
                         <form onSubmit={handleAddPayment} className="bg-gray-700/30 p-4 rounded-lg space-y-4">
                            <div>
                               <label className="block text-sm font-medium text-gray-400 mb-1">Amount Paid</label>
                               <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., 2000" required/>
                            </div>
                             <div>
                               <label className="block text-sm font-medium text-gray-400 mb-1">Receipt Number</label>
                               <input type="text" value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., RCPT-00123" required/>
                            </div>
                             <div>
                               <label className="block text-sm font-medium text-gray-400 mb-1">Payment Method</label>
                               <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                   <option>Cash</option>
                                   <option>UPI</option>
                                   <option>Bank Transfer</option>
                                   <option>Card</option>
                                </select>
                            </div>
                            <button type="submit" disabled={isAdding} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-blue-800">
                                {isAdding ? 'Saving...' : 'Add Payment'}
                            </button>
                         </form>
                    </div>
                     <div>
                        <h2 className="text-xl font-semibold mb-4">Payment History</h2>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                             {loading ? <LoadingSpinner/> : payments.length > 0 ? payments.map(p => (
                                <div key={p.id} className="bg-gray-700/50 p-3 rounded-md flex justify-between items-center group">
                                    <div>
                                        <p className="font-semibold text-lg">₹{p.amountPaid.toLocaleString('en-IN')}</p>
                                        <p className="text-xs text-gray-400">Receipt: {p.receiptNumber} ({p.paymentMethod})</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-gray-400">{p.paymentDate?.toDate().toLocaleDateString()}</p>
                                        <button onClick={() => handleDeletePayment(p)} className="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2Icon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                             )) : <p className="text-gray-400 text-sm text-center p-8">No payments recorded for this student.</p>}
                        </div>
                    </div>
                </div>
             </div>
         </div>
    );
};

const RegisterStudent = ({ setView }) => {
    const [studentName, setStudentName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState(COURSES_DATA[0]?.id || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const adminUser = auth.currentUser;
        if (!adminUser) {
            setError("Admin user not found. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const newUser = userCredential.user;

            const selectedCourse = COURSES_DATA.find(c => c.id === selectedCourseId);
            const initialInvoiceAmount = selectedCourse.monthlyFee + selectedCourse.admissionCharge;
            
            const enrollmentRef = doc(collection(db, `artifacts/${appId}/public/data/enrollments`));
            await setDoc(enrollmentRef, {
                studentId: newUser.uid,
                studentEmail: email,
                studentName: studentName,
                phoneNumber: phoneNumber,
                courseId: selectedCourse.id,
                courseTitle: selectedCourse.title,
                status: 'active', // Set status to active by default
                enrolledAt: serverTimestamp(),
                invoiceAmount: initialInvoiceAmount,
                monthlyFee: selectedCourse.monthlyFee,
                admissionCharge: selectedCourse.admissionCharge,
                totalPaid: 0,
                balanceDue: initialInvoiceAmount,
            });
            
            await signOut(secondaryAuth);

            alert('Student registered successfully!');
            setView('admin-dashboard');

        } catch (err) {
            setError("Registration failed: " + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="p-4 md:p-8">
            <button onClick={() => setView('admin-dashboard')} className="flex items-center text-blue-400 hover:text-blue-300 mb-6"> <ChevronLeftIcon className="w-5 h-5 mr-1" /> Back to Dashboard </button>
            <div className="max-w-lg mx-auto bg-gray-800 rounded-lg shadow-lg p-8">
                <h1 className="text-2xl font-bold mb-6">Register New Student</h1>
                {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4 text-sm">{error}</p>}
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Student Full Name</label>
                        <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Student Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                        <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Initial Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Course</label>
                        <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {COURSES_DATA.map(course => <option key={course.id} value={course.id}>{course.title} (₹{course.monthlyFee}/mo + ₹{course.admissionCharge} admission)</option>)}
                        </select>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-blue-800">
                        {loading ? 'Registering...' : 'Register Student'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const AdminFinancialsDashboard = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrollments, setEnrollments] = useState([]);

    useEffect(() => {
        const fetchAllData = async () => {
            const enrollmentsQuery = query(collection(db, `artifacts/${appId}/public/data/enrollments`));
            onSnapshot(enrollmentsQuery, async (snapshot) => {
                const enrollmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setEnrollments(enrollmentsData);
                
                let allPayments = [];
                for (const enrollment of enrollmentsData) {
                    const paymentsQuery = query(collection(db, `artifacts/${appId}/public/data/enrollments/${enrollment.id}/payments`));
                    const paymentsSnapshot = await getDocs(paymentsQuery);
                    const paymentsData = paymentsSnapshot.docs.map(doc => ({
                        ...doc.data(),
                        studentEmail: enrollment.studentEmail,
                        studentId: enrollment.studentId,
                    }));
                    allPayments = [...allPayments, ...paymentsData];
                }
                setPayments(allPayments);
                setLoading(false);
            });
        };
        fetchAllData();
    }, []);

    const monthlyStats = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const currentMonthPayments = payments.filter(p => {
            const paymentDate = p.paymentDate?.toDate();
            return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
        });
        
        const totalRevenue = currentMonthPayments.reduce((acc, p) => acc + p.amountPaid, 0);
        const uniqueStudents = new Set(currentMonthPayments.map(p => p.studentId)).size;
        const estimatedRevenue = enrollments.filter(e => e.status === 'active').reduce((acc, e) => acc + (e.balanceDue || 0), 0);

        return {
            totalRevenue,
            studentsPaid: uniqueStudents,
            estimatedRevenue,
            payments: currentMonthPayments.sort((a,b) => b.paymentDate - a.paymentDate)
        };
    }, [payments, enrollments]);

    if (loading) return <div className="p-8"><LoadingSpinner /></div>;

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-2">Financials Dashboard</h1>
            <p className="text-gray-400 mb-8">Summary for the current month: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-sm font-semibold text-green-400">TOTAL REVENUE (THIS MONTH)</h2>
                    <p className="text-4xl font-bold mt-2">₹{monthlyStats.totalRevenue.toLocaleString('en-IN')}</p>
                </div>
                 <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-sm font-semibold text-yellow-400">ESTIMATED REVENUE (BALANCE DUE)</h2>
                    <p className="text-4xl font-bold mt-2">₹{monthlyStats.estimatedRevenue.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-sm font-semibold text-blue-400">STUDENTS PAID (THIS MONTH)</h2>
                    <p className="text-4xl font-bold mt-2">{monthlyStats.studentsPaid}</p>
                </div>
            </div>

            <h2 className="text-2xl font-semibold mb-4">Recent Transactions (This Month)</h2>
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                     <table className="w-full min-w-max text-left text-sm text-gray-300">
                        <thead className="bg-gray-700/50 text-xs uppercase text-gray-400">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Student</th>
                                <th className="p-4">Receipt #</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyStats.payments.map((p, index) => (
                                <tr key={index} className="border-b border-gray-700">
                                    <td className="p-4">{p.paymentDate.toDate().toLocaleDateString()}</td>
                                    <td className="p-4 font-medium">{p.studentEmail}</td>
                                    <td className="p-4">{p.receiptNumber}</td>
                                    <td className="p-4 text-right font-semibold text-green-400">₹{p.amountPaid.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {monthlyStats.payments.length === 0 && <p className="p-8 text-center text-gray-400">No transactions recorded this month.</p>}
                </div>
            </div>
        </div>
    );
};
const EditStudent = ({ enrollment, setView }) => {
    const [studentName, setStudentName] = useState(enrollment.studentName || '');
    const [phoneNumber, setPhoneNumber] = useState(enrollment.phoneNumber || '');
    const [email, setEmail] = useState(enrollment.studentEmail || '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const enrollmentRef = doc(db, `artifacts/${appId}/public/data/enrollments`, enrollment.id);
        try {
            await updateDoc(enrollmentRef, {
                studentName: studentName,
                phoneNumber: phoneNumber,
                studentEmail: email
            });
            alert('Student details updated successfully! Note: Changing the email here only updates the record. The student must use their original email to log in unless it is changed in the Firebase Authentication console.');
            setView('admin-dashboard');
        } catch (err) {
            setError("Update failed: " + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <button onClick={() => setView('admin-dashboard')} className="flex items-center text-blue-400 hover:text-blue-300 mb-6"> <ChevronLeftIcon className="w-5 h-5 mr-1" /> Back to Roster </button>
            <div className="max-w-lg mx-auto bg-gray-800 rounded-lg shadow-lg p-8">
                <h1 className="text-2xl font-bold mb-6">Edit Student Details</h1>
                <p className="text-sm text-gray-400 mb-4">Editing details for: <span className="font-semibold">{enrollment.studentEmail}</span></p>
                {error && <p className="bg-red-500/20 text-red-400 p-3 rounded-md mb-4 text-sm">{error}</p>}
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Student Full Name</label>
                        <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number</label>
                        <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required/>
                    </div>
                     <div className="pt-2">
                         <p className="text-xs text-gray-500">To change a student's login password, please use the "Resend Password" option on the main roster.</p>
                     </div>
                    <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 disabled:bg-blue-800">
                        {loading ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};


// --- Main App Component ---

export default function App() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [view, setView] = useState('admin-dashboard');
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && !currentUser.isAnonymous) {
                setUser(currentUser);
                const adminCheck = ADMIN_UIDS.includes(currentUser.uid);
                setIsAdmin(adminCheck);
                setView(adminCheck ? 'admin-dashboard' : 'dashboard');
            } else {
                setUser(null);
                setIsAdmin(false);
                setView('auth');
            }
            setAuthReady(true);
        });
        return () => unsubscribeAuth();
    }, []);

    const handleSignOut = async () => {
        await signOut(auth);
    };

    const renderView = () => {
        if (view === 'auth') return <AuthComponent />;
        if (isAdmin) {
             switch (view) {
                case 'admin-dashboard': return <AdminDashboard setView={setView} setSelectedEnrollment={setSelectedEnrollment} />;
                case 'student-ledger': return <StudentLedger enrollment={selectedEnrollment} setView={setView} />;
                case 'register-student': return <RegisterStudent setView={setView} />;
                case 'edit-student': return <EditStudent enrollment={selectedEnrollment} setView={setView} />;
                case 'financials': return <AdminFinancialsDashboard />;
                default: return <AdminDashboard setView={setView} setSelectedEnrollment={setSelectedEnrollment}/>;
            }
        }
        return <StudentDashboard user={user} />;
    };

    if (!authReady) { return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center"><LoadingSpinner /></div>; }
    
    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            { user ? (
                <div className="lg:flex">
                    <nav className="lg:w-64 lg:min-h-screen lg:p-4 lg:flex lg:flex-col lg:items-start lg:border-r lg:border-gray-700/50 lg:sticky lg:top-0 fixed bottom-0 w-full bg-gray-900/80 backdrop-blur-md border-t border-gray-700/50 z-50 flex justify-around items-center p-2 lg:justify-start">
                        <div className="hidden lg:flex items-center gap-2 mb-10 p-2">
                             <video
                                src="https://video.wixstatic.com/video/81702c_6268d3f9e3fa4e99a1bb9e7846488aa8/360p/mp4/file.mp4"
                                alt="Logo"
                                className="w-10 h-10 rounded-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                             />
                            <span className="text-xl font-bold">Shurpancham Music Academy</span>
                        </div>
                        <ul className="flex justify-around w-full lg:flex-col lg:space-y-3">
                            {isAdmin ? (
                                <>
                                <li> <button onClick={() => setView('admin-dashboard')} className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-4 p-2 lg:p-3 rounded-lg w-full transition-colors duration-200 text-xs lg:text-base ${view.includes('dashboard') || view.includes('ledger') || view.includes('register') || view.includes('edit') ? 'text-blue-400' : 'hover:bg-gray-800 text-gray-400'}`}> <UsersIcon className="w-6 h-6"/> <span className="font-medium">Student Roster</span> </button> </li>
                                <li> <button onClick={() => setView('financials')} className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-4 p-2 lg:p-3 rounded-lg w-full transition-colors duration-200 text-xs lg:text-base ${view === 'financials' ? 'text-blue-400' : 'hover:bg-gray-800 text-gray-400'}`}> <DollarSignIcon className="w-6 h-6"/> <span className="font-medium">Financials</span> </button> </li>
                                </>
                            ) : (
                                <li> <button onClick={() => setView('dashboard')} className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-4 p-2 lg:p-3 rounded-lg w-full transition-colors duration-200 text-xs lg:text-base ${view === 'dashboard' ? 'text-blue-400' : 'hover:bg-gray-800 text-gray-400'}`}> <HomeIcon className="w-6 h-6"/> <span className="font-medium">My Dashboard</span> </button> </li>
                            )}
                            <li> <button onClick={handleSignOut} className="flex flex-col lg:flex-row items-center gap-1 lg:gap-4 p-2 lg:p-3 rounded-lg w-full hover:bg-gray-800 text-gray-400 transition-colors duration-200 text-xs lg:text-base"> <LogOutIcon className="w-6 h-6"/> <span className="font-medium">Log Out</span> </button> </li>
                        </ul>
                    </nav>
                    <main className="flex-1 pb-20 lg:pb-0"> {renderView()} </main>
                </div>
            ) : (
                <AuthComponent />
            )}
        </div>
    );
}


