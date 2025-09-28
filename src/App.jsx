import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    reauthenticateWithCredential,
    EmailAuthProvider
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

// For the preview environment, we'll use the hardcoded config.
// The Vercel-ready environment variable config is commented out below for deployment.
const firebaseConfig = {
    apiKey: "AIzaSyDElzQdprgSfJsGE3I3nTqvIERiAbznCu4",
    authDomain: "music-acadamy-app.firebaseapp.com",
    projectId: "music-acadamy-app",
    storageBucket: "music-acadamy-app.appspot.com",
    messagingSenderId: "714753123495",
    appId: "1:714753123495:web:968d1d4533586fa46d2782",
    measurementId: "G-F2WH7HFY35"
};

/*
// VERCEL DEPLOYMENT CONFIG:
// When deploying to Vercel, you will use environment variables.
// The code below is ready for that. You do not need to change it.
// You will add the variables in the Vercel project settings.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID,
    measurementId: import.meta.env.VITE_MEASUREMENT_ID
};
*/


const appId = 'default-music-app';
// --- Admin Configuration ---
const ADMIN_UIDS = ['jkFnWhZyv0evMPAYI0qLY9hNSO42'];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Create a secondary app instance for creating users without affecting the admin's session.
const secondaryApp = initializeApp(firebaseConfig, `secondary-app-${Date.now()}`);
const secondaryAuth = getAuth(secondaryApp);


// --- Static Course Data ---
const COURSES_DATA = [
    { id: 'vocal-singing', title: 'Vocal / Singing Classes', monthlyFee: 2000 },
    { id: 'keyboard-piano', title: 'Keyboard / Piano Classes', monthlyFee: 2500 },
    { id: 'guitar-classes', title: 'Guitar Classes', monthlyFee: 2200 },
    { id: 'tabla-classes', title: 'Tabla Classes', monthlyFee: 1800 },
    { id: 'violin-classes', title: 'Violin Classes', monthlyFee: 2500 },
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
                        alt="Shurpancham Academy Logo"
                        className="w-24 h-24 mx-auto rounded-full object-cover shadow-lg"
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
                    <h1 className="text-4xl font-bold mt-4">Shurpancham Academy</h1>
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
                             <p className="text-sm text-gray-400 mb-4">Plan: {e.planName}</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 text-center">
                                <div className="bg-gray-700/50 p-4 rounded-lg"><p className="text-sm text-gray-400">Monthly Fee</p><p className="text-2xl font-bold">₹{e.invoiceAmount.toLocaleString('en-IN')}</p></div>
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

    useEffect(() => {
        const enrollmentsQuery = query(collection(db, `artifacts/${appId}/public/data/enrollments`));
        const unsubscribe = onSnapshot(enrollmentsQuery, (snapshot) => {
            const enrollmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEnrollments(enrollmentsData);
            setLoading(false);
        }, (error) => { console.error("Error fetching enrollments:", error); setLoading(false); });
        return () => unsubscribe();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'Pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Student Roster</h1>
                <button onClick={() => setView('register-student')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2">
                    <UserPlusIcon className="w-5 h-5"/> Register Student
                </button>
            </div>
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-max text-left text-sm text-gray-300">
                        <thead className="bg-gray-700/50 text-xs uppercase text-gray-400">
                            <tr>
                                <th className="p-4">Student</th>
                                <th className="p-4">Course</th>
                                <th className="p-4 text-right">Monthly Fee</th>
                                <th className="p-4 text-right">Paid</th>
                                <th className="p-4 text-right">Balance</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrollments.map(e => (
                                <tr key={e.id} className="border-b border-gray-700 hover:bg-gray-700/30 cursor-pointer" onClick={() => { setSelectedEnrollment(e); setView('student-ledger');}}>
                                    <td className="p-4 font-medium">{e.studentEmail}</td>
                                    <td className="p-4">{e.courseTitle}</td>
                                    <td className="p-4 text-right">₹{e.invoiceAmount.toLocaleString('en-IN')}</td>
                                    <td className="p-4 text-right text-green-400">₹{e.totalPaid.toLocaleString('en-IN')}</td>
                                    <td className="p-4 text-right font-bold text-red-400">₹{e.balanceDue.toLocaleString('en-IN')}</td>
                                    <td className="p-4 text-center">
                                         <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(e.invoiceStatus)}`}>{e.invoiceStatus}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {loading && <div className="p-8"><LoadingSpinner /></div>}
                     {!loading && enrollments.length === 0 && <p className="p-8 text-center text-gray-400">No student enrollments yet.</p>}
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
                    <div className="bg-gray-700/50 p-4 rounded-lg"><p className="text-sm text-gray-400">Monthly Fee</p><p className="text-2xl font-bold">₹{enrollment.invoiceAmount.toLocaleString('en-IN')}</p></div>
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
            const fee = selectedCourse.monthlyFee;
            
            const batch = writeBatch(db);
            const enrollmentRef = doc(collection(db, `artifacts/${appId}/public/data/enrollments`));
            batch.set(enrollmentRef, {
                studentId: newUser.uid,
                studentEmail: email,
                studentName: studentName,
                courseId: selectedCourse.id,
                courseTitle: selectedCourse.title,
                planName: 'Monthly Plan',
                paymentPlan: 'monthly',
                enrolledAt: serverTimestamp(),
                invoiceStatus: 'Pending',
                invoiceAmount: fee,
                totalPaid: 0,
                balanceDue: fee,
            });
            
            await batch.commit();
            
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
                        <label className="block text-sm font-medium text-gray-400 mb-1">Initial Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" required/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Course Discipline</label>
                        <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {COURSES_DATA.map(course => <option key={course.id} value={course.id}>{course.title} (₹{course.monthlyFee}/month)</option>)}
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
        const enrollmentsQuery = query(collection(db, `artifacts/${appId}/public/data/enrollments`));
        const unsubscribe = onSnapshot(enrollmentsQuery, async (snapshot) => {
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
        return () => unsubscribe();
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

        return {
            totalRevenue,
            studentsPaid: uniqueStudents,
            payments: currentMonthPayments.sort((a,b) => b.paymentDate - a.paymentDate)
        };
    }, [payments]);

    if (loading) return <div className="p-8"><LoadingSpinner /></div>;

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-2">Financials Dashboard</h1>
            <p className="text-gray-400 mb-8">Summary for the current month: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-sm font-semibold text-green-400">TOTAL REVENUE (THIS MONTH)</h2>
                    <p className="text-4xl font-bold mt-2">₹{monthlyStats.totalRevenue.toLocaleString('en-IN')}</p>
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
                            <span className="text-xl font-bold">Shurpancham</span>
                        </div>
                        <ul className="flex justify-around w-full lg:flex-col lg:space-y-3">
                            {isAdmin ? (
                                <>
                                <li> <button onClick={() => setView('admin-dashboard')} className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-4 p-2 lg:p-3 rounded-lg w-full transition-colors duration-200 text-xs lg:text-base ${view.includes('dashboard') || view.includes('ledger') || view.includes('register') ? 'text-blue-400' : 'hover:bg-gray-800 text-gray-400'}`}> <UsersIcon className="w-6 h-6"/> <span className="font-medium">Student Roster</span> </button> </li>
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


