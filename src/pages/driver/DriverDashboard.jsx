/*
  THESIS: The dashboard is the cockpit — show the mission, not the machinery.
  One glance = client name, pickup time, status. One thumb = launch action.
  OWN-WORLD: #070C09 obsidian base, structural gold #C9A84C, Syne display.
    No decorative chrome. Elevation through space, not border density.
  STORY: Driver opens app → sees today's client in 0.3s → presses one button.
  FIRST VIEWPORT: Identity row (avatar + name + tracking pulse) at top, then
    Mission Card full-bleed with client name at 2rem display, pickup time at
    1.5rem, and a 60px CTA gold bar pinned to natural thumb position.
  FORM: Logistics operations interface. Scale contrast replaces label density.
  FINISH: unreviewed and undocumented is unfinished; this build ends with the
    finish review, the verdict, and DESIGN.md
*/
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDriver } from '../../context/DriverContext';
import { useLocation } from '../../context/LocationContext';
import { db } from '../../firebase';
import {
  collection, query, where, getDocs, updateDoc, doc, increment, serverTimestamp
} from 'firebase/firestore';
import {
  MapPin, Clock, Calendar, ChevronRight, User, Phone,
  Users, Car, Radio, ArrowRight, Map
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/ui/StatusBadge';
import { NetworkStatusBadge } from '../../components/NetworkStatusBadge';

/* ── Sub-components ─────────────────────────────────────────────── */

/** Tracking indicator — single authored animation, no scattered effects */
const TrackingPulse = ({ isActive }) => (
  <span className="relative flex items-center justify-center w-3 h-3 shrink-0">
    {isActive && (
      <span
        className="absolute inline-flex w-full h-full rounded-full bg-success opacity-60"
        style={{ animation: 'pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite' }}
      />
    )}
    <span
      className={`relative inline-flex w-2.5 h-2.5 rounded-full ${
        isActive ? 'bg-success' : 'bg-warning-orange'
      }`}
    />
  </span>
);

/** Small data chip for telemetry row */
const DataChip = ({ label, value, accent = false }) => (
  <div className="flex flex-col gap-0.5 min-w-0">
    <span className="text-xs text-text-muted font-medium">{label}</span>
    <span className={`text-sm font-mono font-semibold truncate ${accent ? 'text-accent-gold' : 'text-text-primary'}`}>
      {value}
    </span>
  </div>
);

/** Upcoming trip row card */
const QueueCard = ({ trip, onClick }) => (
  <button
    onClick={onClick}
    className="w-full bg-surface border border-border-subtle hover:border-accent-gold/30 rounded-2xl p-4 flex items-center gap-4 press-scale transition-colors text-left group"
  >
    <div className="w-10 h-10 rounded-xl bg-card-raised flex items-center justify-center shrink-0">
      <Car size={18} className="text-accent-gold" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-base font-semibold text-text-primary truncate leading-tight">
        {trip.clientName}
      </p>
      <p className="text-sm text-text-muted mt-0.5 truncate">
        {trip.date ? format(new Date(trip.date), 'EEE d MMM') : '—'} · {trip.timeOfPickup || 'TBD'}
      </p>
    </div>
    <div className="flex flex-col items-end gap-2 shrink-0">
      <StatusBadge status={trip.status || 'Confirmed'} />
      <ChevronRight size={16} className="text-text-muted group-hover:text-accent-gold transition-colors" />
    </div>
  </button>
);

/* ── Main component ─────────────────────────────────────────────── */

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { driverProfile, role, currentUser } = useAuth();
  const { activeBookings } = useDriver();
  const { currentLocation, isTracking } = useLocation();

  const [showPorterModal, setShowPorterModal] = useState(false);
  const [availablePorters, setAvailablePorters] = useState([]);
  const [loadingPorters, setLoadingPorters] = useState(false);

  const today = useMemo(() => new Date(), []);

  const todaysTrip = useMemo(() => {
    return activeBookings.find(b => {
      if (!b.date) return false;
      const d = new Date(b.date);
      return isValid(d) && format(d, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    });
  }, [activeBookings, today]);

  const upcomingQueue = useMemo(() => {
    return activeBookings.filter(b => b.id !== todaysTrip?.id);
  }, [activeBookings, todaysTrip]);

  const firstName = driverProfile?.name?.split(' ')[0] || 'Driver';

  const roleLabel =
    role === 'tour_guide' ? 'Tour Guide'
    : role === 'porter' ? 'Ground Logistics'
    : 'City Driver';

  const fetchPorters = async () => {
    setLoadingPorters(true);
    try {
      const q = query(collection(db, 'porters'), where('status', '==', 'Active'));
      const snap = await getDocs(q);
      setAvailablePorters(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      toast.error('Unable to load ground team');
    } finally {
      setLoadingPorters(false);
    }
  };

  const handleCommenceTrip = async (porter) => {
    if (!todaysTrip) return;
    const toastId = toast.loading('Starting trip…');
    try {
      await updateDoc(doc(db, 'bookings', todaysTrip.id), {
        status: 'Client Picked Up',
        porterId: porter?.id || null,
        porterName: porter?.name || 'Assigned Porter',
        commencedAt: serverTimestamp(),
      });
      if (porter?.id) {
        await updateDoc(doc(db, 'porters', porter.id), {
          totalTrips: increment(1),
          currentDriver: driverProfile?.name || 'Driver',
          currentTripType: todaysTrip.type || 'Transfer',
          lastTripAt: serverTimestamp(),
          assignedDriverId: currentUser.uid,
          assignedDriverName: driverProfile?.name || 'Driver',
          deploymentTime: serverTimestamp(),
        });
      }
      toast.success('Trip started', { id: toastId });
      setShowPorterModal(false);
      navigate(`/driver/trip/${todaysTrip.id}`);
    } catch (e) {
      toast.error(e.message || 'Failed to start trip', { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-primary-dark text-text-primary pb-28 select-none">

      {/* ── Identity header ── */}
      <div className="px-5 pt-6 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-card border border-border overflow-hidden flex items-center justify-center">
              {driverProfile?.faceImageUrl ? (
                <img
                  src={driverProfile.faceImageUrl}
                  alt={firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-display text-lg text-accent-gold">
                  {firstName.charAt(0)}
                </span>
              )}
            </div>
            {/* Live tracking dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary-dark flex items-center justify-center">
              <TrackingPulse isActive={isTracking} />
            </div>
          </div>

          {/* Name + role */}
          <div>
            <p className="text-base font-semibold text-text-primary leading-tight">
              {driverProfile?.name || 'Driver'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-text-muted">{roleLabel}</span>
              <span className="w-1 h-1 rounded-full bg-text-muted/40" />
              <span className="text-sm text-text-muted font-mono">
                {isTracking ? 'Live' : 'Standby'}
              </span>
            </div>
          </div>
        </div>

        {/* Network + map shortcut */}
        <div className="flex items-center gap-2">
          {currentUser?.uid && <NetworkStatusBadge driverId={currentUser.uid} />}
          <button
            onClick={() => navigate('/driver/map')}
            className="w-10 h-10 rounded-xl bg-surface border border-border-subtle hover:border-accent-gold/30 flex items-center justify-center text-text-muted hover:text-accent-gold transition-colors press-scale"
            aria-label="Open live map"
          >
            <Map size={18} />
          </button>
        </div>
      </div>

      {/* ── Telemetry strip ── */}
      {isTracking && currentLocation && (
        <div className="mx-5 mb-5 bg-card border border-border-subtle rounded-2xl px-4 py-3 flex items-center gap-6 animate-fade-up">
          <DataChip
            label="Coordinates"
            value={`${currentLocation.latitude?.toFixed(4)}, ${currentLocation.longitude?.toFixed(4)}`}
          />
          <div className="w-px h-8 bg-border-subtle shrink-0" />
          <DataChip
            label="Heading"
            value={currentLocation.heading != null ? `${Math.round(currentLocation.heading)}°` : '—'}
            accent
          />
          <div className="w-px h-8 bg-border-subtle shrink-0" />
          <DataChip
            label="Speed"
            value={`${Math.round(currentLocation.speed || 0)} km/h`}
          />
        </div>
      )}

      <div className="px-5 space-y-6">

        {/* ── Today's mission ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-text-primary">Today's assignment</h2>
            {todaysTrip && (
              <span className="text-xs font-medium text-success bg-success-dim px-2.5 py-1 rounded-full">
                Active
              </span>
            )}
          </div>

          {todaysTrip ? (
            <div
              className="bg-card border border-border rounded-3xl overflow-hidden animate-fade-up"
              style={{ animationDelay: '0.05s' }}
            >
              {/* Gold accent bar at top */}
              <div className="h-1 w-full bg-gradient-to-r from-accent-gold via-accent-gold/60 to-transparent" />

              <div className="p-5 space-y-5">
                {/* Client name — display scale */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-3xl text-text-primary leading-none">
                      {todaysTrip.clientName || 'VIP Guest'}
                    </h3>
                    <p className="text-text-muted text-sm mt-1.5">
                      {todaysTrip.packageName || 'City Transfer'}
                    </p>
                  </div>
                  <StatusBadge status={todaysTrip.status || 'Assigned'} />
                </div>

                {/* Key info — readable scale */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface rounded-2xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Clock size={14} className="text-accent-gold shrink-0" />
                      <span className="text-xs text-text-muted font-medium">Pickup time</span>
                    </div>
                    <span className="text-xl font-display text-text-primary">
                      {todaysTrip.timeOfPickup || '—'}
                    </span>
                  </div>

                  <div className="bg-surface rounded-2xl p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Users size={14} className="text-accent-gold shrink-0" />
                      <span className="text-xs text-text-muted font-medium">Passengers</span>
                    </div>
                    <span className="text-xl font-display text-text-primary">
                      {todaysTrip.guestsCount || todaysTrip.numberOfClients || '—'}
                    </span>
                  </div>
                </div>

                {/* Route */}
                <div className="flex items-start gap-3 bg-surface rounded-2xl p-3.5">
                  <MapPin size={16} className="text-accent-gold shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-text-muted mb-0.5 font-medium">Route</p>
                    <p className="text-sm text-text-primary font-medium leading-snug">
                      {todaysTrip.destinations || todaysTrip.destination || 'Route not set'}
                    </p>
                  </div>
                </div>

                {/* Vehicle */}
                {todaysTrip.vehiclePlate && (
                  <div className="flex items-center gap-3 bg-surface rounded-2xl p-3.5">
                    <Car size={16} className="text-accent-gold shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-text-muted mb-0.5 font-medium">Vehicle</p>
                      <p className="text-sm text-text-primary font-mono font-semibold">
                        {todaysTrip.vehiclePlate} · {todaysTrip.vehicleModel || 'Executive Van'}
                      </p>
                    </div>
                  </div>
                )}

                {/* CTAs */}
                <div className="flex gap-3 pt-1">
                  {todaysTrip.status === 'Assigned' ? (
                    <button
                      id="btn-start-trip"
                      onClick={() => { fetchPorters(); setShowPorterModal(true); }}
                      className="flex-1 h-14 bg-accent-gold hover:bg-yellow-500 active:bg-yellow-600 text-primary-dark font-display text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-accent-gold/20 press-scale transition-colors"
                    >
                      Start trip
                      <ArrowRight size={18} />
                    </button>
                  ) : (
                    <button
                      id="btn-resume-trip"
                      onClick={() => navigate(`/driver/trip/${todaysTrip.id}`)}
                      className="flex-1 h-14 bg-accent-gold hover:bg-yellow-500 active:bg-yellow-600 text-primary-dark font-display text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-accent-gold/20 press-scale transition-colors"
                    >
                      Continue trip
                      <ArrowRight size={18} />
                    </button>
                  )}

                  {todaysTrip.clientPhone && (
                    <a
                      href={`tel:${todaysTrip.clientPhone}`}
                      className="w-14 h-14 bg-surface border border-border-subtle hover:border-accent-gold/30 rounded-2xl flex items-center justify-center press-scale transition-colors"
                      aria-label={`Call ${todaysTrip.clientName}`}
                    >
                      <Phone size={20} className="text-accent-gold" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div
              className="bg-card border border-dashed border-border rounded-3xl p-10 flex flex-col items-center text-center gap-4 animate-fade-up"
            >
              <div className="w-14 h-14 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center">
                <Radio size={24} className="text-text-muted" />
              </div>
              <div>
                <p className="text-base font-semibold text-text-primary">No assignment today</p>
                <p className="text-sm text-text-muted mt-1 leading-relaxed max-w-[240px] mx-auto">
                  You're live and broadcasting. Assignments appear here in real time.
                </p>
              </div>
              <button
                id="btn-view-all-trips"
                onClick={() => navigate('/driver/trips')}
                className="px-5 py-2.5 bg-surface border border-border-subtle hover:border-accent-gold/30 rounded-xl text-sm font-medium text-text-secondary hover:text-accent-gold transition-colors press-scale"
              >
                View all trips
              </button>
            </div>
          )}
        </section>

        {/* ── Upcoming queue ── */}
        {upcomingQueue.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-text-primary">Coming up</h2>
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-text-muted" />
                <span className="text-sm text-text-muted">{upcomingQueue.length}</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {upcomingQueue.slice(0, 5).map((trip, i) => (
                <div
                  key={trip.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${0.08 + i * 0.04}s` }}
                >
                  <QueueCard
                    trip={trip}
                    onClick={() => navigate(`/driver/trip/${trip.id}`)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Porter assignment sheet ── */}
      {showPorterModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-up"
          onClick={(e) => e.target === e.currentTarget && setShowPorterModal(false)}
        >
          <div className="bg-card w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] border border-border p-6 space-y-5 animate-slide-up">
            {/* Handle bar (mobile sheet indicator) */}
            <div className="w-10 h-1 rounded-full bg-border mx-auto sm:hidden" />

            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display text-xl text-text-primary">
                  Assign ground team
                </h3>
                <p className="text-sm text-text-muted mt-0.5">
                  Select a porter for this trip
                </p>
              </div>
              <button
                id="btn-close-porter-modal"
                onClick={() => setShowPorterModal(false)}
                className="w-9 h-9 rounded-xl bg-surface border border-border-subtle flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto -mx-1 px-1">
              {loadingPorters ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 skeleton rounded-full" />
                  <div className="w-32 h-3 skeleton rounded" />
                </div>
              ) : availablePorters.length > 0 ? (
                availablePorters.map((porter) => (
                  <button
                    key={porter.id}
                    onClick={() => handleCommenceTrip(porter)}
                    className="w-full bg-surface border border-border-subtle hover:border-accent-gold/40 p-4 rounded-2xl flex items-center gap-3.5 press-scale transition-colors text-left group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-card-raised border border-border-subtle overflow-hidden flex items-center justify-center shrink-0 group-hover:border-accent-gold/30 transition-colors">
                      {porter.faceImageUrl ? (
                        <img src={porter.faceImageUrl} alt={porter.name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} className="text-text-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary group-hover:text-accent-gold transition-colors truncate">
                        {porter.name}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5 font-mono">
                        {porter.totalTrips || 0} trips completed
                      </p>
                    </div>
                    <span className="text-xs text-text-muted group-hover:text-accent-gold font-medium transition-colors shrink-0">
                      Select
                    </span>
                  </button>
                ))
              ) : (
                <div className="py-10 text-center space-y-3">
                  <p className="text-sm text-text-muted">No ground team available</p>
                  <button
                    onClick={() => handleCommenceTrip({ id: null, name: 'Solo' })}
                    className="px-5 py-2.5 bg-surface border border-border-subtle hover:border-accent-gold/30 text-sm text-text-secondary hover:text-accent-gold rounded-xl press-scale transition-colors"
                  >
                    Continue solo
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowPorterModal(false)}
              className="w-full py-3 text-sm text-text-muted hover:text-text-secondary font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
