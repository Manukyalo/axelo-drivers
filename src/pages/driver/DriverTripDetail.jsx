import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, onSnapshot, updateDoc, collection, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  MapPin, Phone, MessageSquare, Fuel, Clipboard, ChevronLeft,
  Clock, Users, Car, BadgeAlert, CheckCircle2, Loader2,
} from 'lucide-react';
import TripStatusBar from '../../components/trips/TripStatusBar';
import toast from 'react-hot-toast';

/** Maps each current status to the action label for advancing */
const NEXT_ACTION = {
  'Assigned':        'Acknowledge trip',
  'Acknowledged':    'Start driving',
  'En Route':        'Confirm pickup',
  'Client Picked Up': 'Begin transit',
  'In Transit':      'Complete trip',
  'Trip Complete':   null,
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3.5">
    <div className="w-10 h-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center shrink-0">
      <Icon size={16} className="text-accent-gold" />
    </div>
    <div className="min-w-0 py-1">
      <p className="text-xs text-text-muted font-medium mb-0.5">{label}</p>
      <p className="text-sm text-text-primary font-medium leading-snug">{value || '—'}</p>
    </div>
  </div>
);

const ActionButton = ({ icon: Icon, label, onClick, id }) => (
  <button
    id={id}
    onClick={onClick}
    className="flex flex-col items-center gap-2 bg-card border border-border-subtle hover:border-accent-gold/30 rounded-2xl p-4 press-scale transition-colors group"
  >
    <Icon size={22} className="text-accent-gold" />
    <span className="text-xs text-text-muted group-hover:text-text-secondary font-medium text-center leading-tight transition-colors">
      {label}
    </span>
  </button>
);

const DriverTripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, 'bookings', id), (snap) => {
      if (snap.exists()) setTrip({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [id]);

  const advanceStatus = async () => {
    const steps = ['Assigned', 'Acknowledged', 'En Route', 'Client Picked Up', 'In Transit', 'Trip Complete'];
    const idx = steps.indexOf(trip.status || 'Assigned');
    if (idx === steps.length - 1 || idx === -1) return;

    const nextStatus = steps[idx + 1];
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'bookings', trip.id), { status: nextStatus });

      await addDoc(collection(db, `tripUpdates/${trip.id}/updates`), {
        status: nextStatus,
        timestamp: serverTimestamp(),
        driverId: trip.driverId,
        note: `Status advanced to ${nextStatus}`,
      });

      await addDoc(collection(db, 'notifications'), {
        title: `Trip: ${nextStatus}`,
        message: `${trip.driverName || 'Driver'} updated status for ${trip.clientName}`,
        type: 'INFO',
        targetRole: 'both',
        date: serverTimestamp(),
      });

      toast.success(nextStatus);
    } catch {
      toast.error('Status update failed. Try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  /* Loading state */
  if (!trip) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-muted">
          <Loader2 size={24} className="animate-spin text-accent-gold" />
          <p className="text-sm">Loading trip…</p>
        </div>
      </div>
    );
  }

  const nextAction = NEXT_ACTION[trip.status] ?? null;

  return (
    <div className="min-h-screen bg-primary-dark text-text-primary pb-36 animate-fade-up">

      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <button
          id="btn-back"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors press-scale"
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <span className="text-xs font-mono text-text-muted">
          BKG-{trip.id?.slice(-6).toUpperCase()}
        </span>
      </div>

      {/* Status stepper */}
      <div className="mx-5 mb-5 bg-card border border-border-subtle rounded-2xl px-4">
        <TripStatusBar currentStatus={trip.status || 'Assigned'} />
      </div>

      <div className="px-5 space-y-5">
        {/* Client card */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-accent-gold via-accent-gold/60 to-transparent" />
          <div className="p-5">
            <div className="flex items-start gap-3 mb-1">
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-3xl text-text-primary leading-none">
                  {trip.clientName}
                </h2>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <span className="bg-accent-gold/10 text-accent-gold py-1 px-3 rounded-full text-xs font-semibold">
                {trip.type || 'Transfer'}
              </span>
              {trip.pax && (
                <span className="bg-surface text-text-secondary py-1 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <Users size={11} />
                  {trip.pax} pax
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Trip details */}
        <div className="bg-card border border-border-subtle rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-secondary">Trip details</h3>
          <InfoRow icon={Clock} label="Pickup time" value={trip.timeOfPickup} />
          <InfoRow icon={MapPin} label="Route" value={trip.destinations} />
          <InfoRow icon={Car} label="Vehicle" value={trip.vehicleId || 'Not assigned'} />
          {trip.vehiclePlate && (
            <InfoRow icon={BadgeAlert} label="Plate number" value={trip.vehiclePlate} />
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <ActionButton
            id="btn-call-dispatch"
            icon={Phone}
            label="Call dispatch"
          />
          <ActionButton
            id="btn-field-chat"
            icon={MessageSquare}
            label="Field chat"
          />
          <ActionButton
            id="btn-inspection"
            icon={Clipboard}
            label="Vehicle log"
            onClick={() => navigate(`/driver/inspection/${trip.id}`)}
          />
          <ActionButton
            id="btn-expense"
            icon={Fuel}
            label="Log expense"
            onClick={() => navigate(`/driver/expense/${trip.id}`)}
          />
        </div>

        {/* Completed state feedback */}
        {trip.status === 'Trip Complete' && (
          <div className="bg-success-dim border border-success/20 rounded-2xl p-5 flex items-center gap-3">
            <CheckCircle2 size={22} className="text-success shrink-0" />
            <div>
              <p className="text-sm font-semibold text-success">Trip complete</p>
              <p className="text-xs text-text-muted mt-0.5">This trip has been archived.</p>
            </div>
          </div>
        )}
      </div>

      {/* Primary CTA — fixed to thumb zone */}
      {nextAction && (
        <div className="fixed bottom-20 left-0 right-0 px-5 z-40">
          <button
            id="btn-advance-status"
            onClick={advanceStatus}
            disabled={isUpdating}
            className="w-full h-16 bg-accent-gold hover:bg-yellow-500 active:bg-yellow-600 text-primary-dark font-display text-base rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-accent-gold/25 press-scale transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Updating…
              </>
            ) : (
              nextAction
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DriverTripDetail;
