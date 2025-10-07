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
    onSnapshot,
    updateDoc,
    query,
    where,
    serverTimestamp,
    increment,
    deleteDoc,
    getDocs
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

const AuthComponent = () => { /* ... existing component code ... */ };

const StudentDashboard = ({ user }) => { /* ... existing component code ... */ };

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

    const handleToggleStatus = async (enrollmentId, currentStatus) => {
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
    
    const handleSendPasswordReset = async (email) => {
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
                                            <div className="absolute right-12 top-10 w-48 bg-gray-700 rounded-md shadow-lg z-10">
                                                <button onClick={() => { setSelectedEnrollment(e); setView('edit-student'); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 flex items-center gap-2"><EditIcon className="w-4 h-4"/> Edit Details</button>
                                                <button onClick={() => {handleToggleStatus(e.id, e.status); setOpenMenuId(null);}} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 flex items-center gap-2">{e.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                                                <button onClick={() => {handleSendPasswordReset(e.studentEmail); setOpenMenuId(null);}} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 flex items-center gap-2"><SendIcon className="w-4 h-4"/> Resend Password</button>
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

const StudentLedger = ({ enrollment, setView }) => { /* ... existing component code ... */ };

const RegisterStudent = ({ setView }) => { /* ... existing component code ... */ };

const AdminFinancialsDashboard = ({ setView }) => { /* ... existing component code ... */ };

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


