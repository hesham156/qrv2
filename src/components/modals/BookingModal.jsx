import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { appId, db } from "../../config/firebase";
import { sendBookingNotification } from "../../services/emailService";
import { Calendar as CalendarIcon, Clock, X, CheckCircle2, AlertCircle } from "lucide-react";

export default function BookingModal({ adminId, employeeId, themeColor, onClose, t, bookingSettings, initialValues }) {
    const [name, setName] = useState(initialValues?.name || '');
    const [phone, setPhone] = useState(initialValues?.phone || '');
    const [date, setDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Slot Management
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Default settings if undefined
    // Default settings with Memoization to prevent infinite loop
    const settings = bookingSettings || { days: [0, 1, 2, 3, 4], start: '09:00', end: '17:00', slotDuration: 30 };

    // Destructure for dependency array stability
    const { days, start, end, slotDuration } = settings;

    // Calculate slots when date changes
    useEffect(() => {
        if (!date) {
            setAvailableSlots([]);
            return;
        }

        const fetchSlots = async () => {
            setLoadingSlots(true);
            setSelectedTime(''); // Reset selection
            try {
                const selectedDateObj = new Date(date);
                const dayOfWeek = selectedDateObj.getDay();

                // 1. Check if day is a working day
                if (!days.includes(dayOfWeek)) {
                    setAvailableSlots([]);
                    return;
                }

                // 2. Fetch existing bookings from public collection
                // NOTE: We use a separate 'appointments' path for availability
                const q = query(
                    collection(db, 'artifacts', appId, 'users', adminId, 'employees', employeeId, 'appointments'),
                    where('bookingDate', '==', date)
                );

                let takenSlots = [];
                try {
                    const snapshot = await getDocs(q);
                    takenSlots = snapshot.docs.map(doc => doc.data().bookingTime);
                } catch (err) {
                    console.warn("Could not fetch appointments, using optimistic UI.", err);
                }

                // 3. Generate all possible slots
                const slots = [];
                let [startHour, startMin] = start.split(':').map(Number);
                const [endHour, endMin] = end.split(':').map(Number);

                // Create Date objects for comparison
                let current = new Date(selectedDateObj);
                current.setHours(startHour, startMin, 0);

                const endDate = new Date(selectedDateObj);
                endDate.setHours(endHour, endMin, 0);

                while (current < endDate) {
                    const timeString = current.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                    // Check if slot is taken
                    if (!takenSlots.includes(timeString)) {
                        slots.push(timeString);
                    }
                    // Increment by duration
                    current.setMinutes(current.getMinutes() + slotDuration);
                }

                setAvailableSlots(slots);
            } catch (error) {
                console.error("Error fetching slots:", error);
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [date, adminId, employeeId, days.join(','), start, end, slotDuration]); // dependency on primitives

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!date || !selectedTime) return;

        setLoading(true);
        try {
            // 0. Initialize Zoom Link (Try to generate)
            let zoomLink = '';
            let zoomPassword = '';
            try {
                // Combine date and time for Zoom (YYYY-MM-DDTHH:mm:ss)
                const startTime = `${date}T${selectedTime}:00`;
                const { createZoomMeeting } = await import('../../services/zoomService');
                const meeting = await createZoomMeeting(`Meeting with ${name}`, startTime);
                zoomLink = meeting.joinUrl;
                zoomPassword = meeting.password;
            } catch (zoomError) {
                console.warn("Zoom creation failed:", zoomError);
                // Proceed without Zoom link, or show a toast
            }

            // 1. Check for existing Lead (by Phone) to prevent duplicates
            const leadsRef = collection(db, 'artifacts', appId, 'users', adminId, 'employees', employeeId, 'leads');
            const duplicateQuery = query(leadsRef, where('phone', '==', phone));
            const duplicateSnap = await getDocs(duplicateQuery);

            const bookingData = {
                name,
                phone,
                interest: `APPOINTMENT: ${date} at ${selectedTime}`,
                type: 'booking',
                bookingDate: date,
                bookingTime: selectedTime,
                zoomLink,
                zoomPassword,
                updatedAt: serverTimestamp() // Important for sorting
            };

            if (!duplicateSnap.empty) {
                // UPDATE Existing Lead
                const existingLead = duplicateSnap.docs[0];
                const existingData = existingLead.data();

                // Create a history entry from the OLD data (or current state)
                const historyEntry = {
                    date: existingData.bookingDate || existingData.createdAt,
                    interest: existingData.interest,
                    type: existingData.type || 'interaction',
                    note: 'Previous Interaction'
                };

                const currentHistory = existingData.history || [];

                await updateDoc(doc(leadsRef, existingLead.id), {
                    ...bookingData,
                    status: 'new', // Reset status or keep? Usually reset to 'new' or 'follow_up' for new appointment. Let's say 'new'.
                    history: [...currentHistory, historyEntry]
                });
            } else {
                // CREATE New Lead
                await addDoc(leadsRef, {
                    ...bookingData,
                    status: 'new',
                    createdAt: serverTimestamp(),
                    history: [] // Init empty history
                });
            }

            // 2. Public Appointment (Availability Data Only)
            // This is separate (calendar blocking), so we always add it.
            await addDoc(collection(db, 'artifacts', appId, 'users', adminId, 'employees', employeeId, 'appointments'), {
                bookingDate: date,
                bookingTime: selectedTime,
                reserved: true,
                createdAt: serverTimestamp()
            });

            // 3. Send Email Notification (Non-blocking)
            sendBookingNotification({
                name,
                phone,
                date,
                time: selectedTime,
                zoomLink // Pass to email
            }).catch(err => console.error("Email failed:", err));

            setSubmitted({
                date,
                time: selectedTime,
                zoomLink,
                zoomPassword
            });
            // Removed auto-close timeout to let user see details
            // setTimeout(onClose, 2500);
        } catch (error) {
            console.error(error);
            window.alert(t.errorTitle || "Error processing booking");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-6 shadow-2xl relative border border-white/20 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 z-10"><X size={24} /></button>

                {submitted ? (
                    <div className="text-center py-10 px-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">{t.bookingSuccess || "Confirmed!"}</h3>
                        <p className="text-sm text-slate-500 mb-6">{t.sentMsg || "A confirmation email has been sent."}</p>

                        {/* Booking Details Card */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6 text-left rtl:text-right">
                            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-200">
                                <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                                    <CalendarIcon size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase">{t.bookingDate || "Date & Time"}</p>
                                    <p className="text-sm font-bold text-slate-800">
                                        {submitted.date} <span className="text-slate-300">|</span> {submitted.time}
                                    </p>
                                </div>
                            </div>

                            {submitted.zoomLink && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold">Z</div>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Zoom Meeting</p>
                                        <a
                                            href={submitted.zoomLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-bold text-blue-600 underline truncate block hover:text-blue-800"
                                        >
                                            {t.joinMeeting || "Join Meeting Link"}
                                        </a>
                                        {submitted.zoomPassword && (
                                            <p className="text-[10px] text-slate-500 mt-1">Passcode: <span className="font-mono bg-slate-200 px-1 rounded">{submitted.zoomPassword}</span></p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm w-full hover:bg-slate-800 transition-colors"
                        >
                            {t.close || "Close"}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                        <div className="text-center mb-6 shrink-0">
                            <div className="inline-flex p-3 bg-indigo-50 rounded-2xl mb-3 text-indigo-600">
                                <CalendarIcon size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">{t.bookingTitle}</h3>
                        </div>

                        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold"
                                placeholder={t.leadName}
                            />

                            <input
                                type="tel"
                                required
                                dir="ltr"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold text-right"
                                placeholder={t.leadPhone}
                            />

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">{t.bookingDate}</label>
                                <div className="relative">
                                    <CalendarIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-[11px] font-bold appearance-none"
                                    />
                                </div>
                            </div>

                            {/* Time Slots Grid */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">{t.bookingTime}</label>

                                {!date ? (
                                    <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                        <p className="text-xs text-slate-400">{t.bookingDate || "Select a date first"}</p>
                                    </div>
                                ) : loadingSlots ? (
                                    <div className="flex justify-center py-4">
                                        <span className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                    </div>
                                ) : availableSlots.length === 0 ? (
                                    <div className="text-center py-4 bg-red-50 rounded-xl border border-red-100 text-red-500 flex flex-col items-center gap-2">
                                        <AlertCircle size={18} />
                                        <p className="text-xs font-bold">{t.noSlots}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {availableSlots.map(slot => (
                                            <button
                                                key={slot}
                                                type="button"
                                                onClick={() => setSelectedTime(slot)}
                                                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all border ${selectedTime === slot ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !selectedTime}
                            className="w-full text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-sm mt-4 hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none mt-auto shrink-0"
                            style={{ backgroundColor: themeColor }}
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : t.bookingAction}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
