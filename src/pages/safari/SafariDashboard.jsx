import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDriver } from '../../context/DriverContext';
import { useLocation } from '../../context/LocationContext';
import { 
  Compass, MapPin, Users, Calendar, Clock, ChevronRight, 
  ShieldCheck, AlertTriangle, Package, Radio, Trees,
  Tent, Phone, ArrowUpRight, CheckCircle2, Car, ShieldAlert
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import SOSButton from '../../components/ui/SOSButton';
import { NetworkStatusBadge } from '../../components/NetworkStatusBadge';
import { format, isValid } from 'date-fns';

const SafariDashboard = () => {
  const navigate = useNavigate();
  const { driverProfile, currentUser } = useAuth();
  const { activeBookings } = useDriver();
  const { currentLocation, isTracking } = useLocation();

  const today = useMemo(() => new Date(), []);

  // Today's active safari expedition
  const todaysSafari = useMemo(() => {
    return activeBookings.find(b => {
      if (!b.date) return false;
      const bookingDate = new Date(b.date);
      if (!isValid(bookingDate)) return false;
      return format(bookingDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    });
  }, [activeBookings, today]);

  // Upcoming confirmed expeditions
  const upcomingSafaris = useMemo(() => {
    return activeBookings.filter(b => b.id !== todaysSafari?.id);
  }, [activeBookings, todaysSafari]);

  const firstName = driverProfile?.name?.split(' ')[0] || 'Guide';

  return (
    <div className="min-h-screen bg-[#070E0A] text-text-primary pb-28 pt-8 px-4 sm:px-6 space-y-6 select-none font-body">
      
      {/* ── EXPEDITION COMMAND HEADER ── */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 pt-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent-green/30 to-surface border border-accent-green/50 flex items-center justify-center font-black text-emerald-400 shadow-xl">
              {driverProfile?.faceImageUrl ? (
                <img 
                  src={driverProfile.faceImageUrl} 
                  alt={firstName} 
                  className="w-full h-full object-cover rounded-2xl" 
                />
              ) : (
                <span className="text-base tracking-tighter">{firstName.charAt(0)}</span>
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#070E0A] ${isTracking ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider uppercase text-white font-mono">
                {driverProfile?.name || 'Wilderness Scout'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-accent-green/20 text-emerald-400 border border-emerald-500/30">
                Lead Scout
              </span>
            </div>
            <p className="text-[10px] text-text-muted font-mono tracking-widest mt-0.5">
              ID: {currentUser?.uid ? `${currentUser.uid.slice(0, 8).toUpperCase()}` : 'SAF-UNIT'} • Safari Expeditions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/safari/sos')}
            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-2xl text-red-400 active:scale-95 transition-all shadow-lg"
            title="Emergency SOS Dispatch"
          >
            <ShieldAlert size={18} className="animate-pulse" />
          </button>
          <button 
            onClick={() => navigate('/safari/map')}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface hover:bg-card border border-white/10 hover:border-accent-green/40 rounded-2xl text-emerald-400 text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md"
            title="Wilderness Vector Radar"
          >
            <Compass size={16} className="animate-[spin_16s_linear_infinite]" />
            <span className="hidden sm:inline">Radar</span>
          </button>
        </div>
      </div>

      {/* ── WILDERNESS TELEMETRY & COMPASS HUD ── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0F1F15] via-[#0B1710] to-[#070E0A] border border-accent-green/20 p-5 shadow-2xl overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.04] pointer-events-none transition-transform duration-1000" style={{ transform: `rotate(${currentLocation?.heading || 0}deg)` }}>
          <Compass size={160} className="text-emerald-400" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isTracking ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isTracking ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              </span>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 font-mono">
                {isTracking ? 'EXPEDITION TELEMETRY STREAMING' : 'OFF-GRID • ACQUIRING SATELLITE FIX'}
              </p>
            </div>

            {currentUser?.uid && (
              <NetworkStatusBadge driverId={currentUser.uid} />
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3 border border-white/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-text-muted/70 block">Wilderness GPS</span>
              <span className="text-xs font-mono font-bold text-white tracking-tight mt-1 block truncate">
                {currentLocation ? `${currentLocation.latitude?.toFixed(4)}, ${currentLocation.longitude?.toFixed(4)}` : '-1.2921, 36.8219'}
              </span>
            </div>

            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3 border border-white/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-text-muted/70 block">Compass Azimuth</span>
              <span className="text-xs font-mono font-bold text-emerald-400 tracking-tight mt-1 block">
                {currentLocation?.heading ? `${Math.round(currentLocation.heading)}° SCOUT` : '184° TSAVO'}
              </span>
            </div>

            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-3 border border-white/5">
              <span className="text-[8px] font-black uppercase tracking-widest text-text-muted/70 block">Cruiser Speed</span>
              <span className="text-xs font-mono font-bold text-white tracking-tight mt-1 block">
                {Math.round(currentLocation?.speed || 0)} km/h • {currentLocation?.batteryLevel || 100}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTIVE SAFARI EXPEDITION DOSSIER ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-text-muted flex items-center gap-2">
            <Trees size={13} className="text-emerald-400" />
            Active Safari Itinerary
          </h2>
          {todaysSafari && (
            <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              GAME DRIVE ACTIVE
            </span>
          )}
        </div>

        {todaysSafari ? (
          <div className="rounded-3xl bg-surface border border-accent-green/25 shadow-xl overflow-hidden relative">
            <div className="p-5 border-b border-white/5 bg-gradient-to-r from-accent-green/10 via-transparent to-transparent">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                    EXPEDITION #{todaysSafari.id?.slice(0, 8).toUpperCase()}
                  </span>
                  <h3 className="text-xl font-heading font-black text-white tracking-tight mt-1">
                    {todaysSafari.clientName || 'VIP Safari Party'}
                  </h3>
                  <p className="text-[11px] text-text-muted font-medium mt-0.5 flex items-center gap-1.5">
                    <Package size={12} className="text-emerald-400" />
                    {todaysSafari.packageName || 'Luxury Wilderness Safari'}
                  </p>
                </div>
                <StatusBadge status={todaysSafari.status || 'Confirmed'} />
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 bg-black/25 rounded-2xl p-3.5 border border-white/5">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1">
                    <Clock size={10} className="text-emerald-400" /> Departs / Game Drive
                  </span>
                  <span className="text-base font-mono font-black text-white mt-1 block">
                    {todaysSafari.timeOfPickup || '06:00 AM'}
                  </span>
                </div>

                <div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1">
                    <Users size={10} className="text-emerald-400" /> Expedition Party
                  </span>
                  <span className="text-base font-mono font-black text-white mt-1 block">
                    {todaysSafari.guestsCount || todaysSafari.numberOfClients || '4'} Guests
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-3 text-text-muted bg-white/5 p-3 rounded-2xl">
                  <MapPin size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[8px] font-black uppercase tracking-widest text-text-muted/60 block">Parks & Reserves</span>
                    <span className="text-white font-medium text-xs truncate block mt-0.5">
                      {todaysSafari.destinations || todaysSafari.location || 'Tsavo East National Park • Aruba Dam Circuit'}
                    </span>
                  </div>
                </div>

                {todaysSafari.lodges && (
                  <div className="flex items-center gap-3 text-text-muted bg-white/5 p-3 rounded-2xl">
                    <Tent size={16} className="text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[8px] font-black uppercase tracking-widest text-text-muted/60 block">Overnight Lodge</span>
                      <span className="text-white font-medium text-xs truncate block mt-0.5">
                        {todaysSafari.lodges}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate(`/safari/trip/${todaysSafari.id}`)}
                  className="flex-1 py-4 bg-accent-green hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-accent-green/20 active:scale-95 transition-all"
                >
                  <span>Launch Expedition Manifest & Map</span>
                  <ArrowUpRight size={16} />
                </button>

                {todaysSafari.clientPhone && (
                  <a
                    href={`tel:${todaysSafari.clientPhone}`}
                    className="px-5 py-4 bg-surface hover:bg-card border border-white/15 rounded-2xl flex items-center justify-center text-white active:scale-95 transition-all"
                    title="Call Party Leader"
                  >
                    <Phone size={18} className="text-emerald-400" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-surface/60 border border-dashed border-white/10 p-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-accent-green/10 border border-accent-green/20 flex items-center justify-center text-emerald-400">
                <Trees size={28} className="animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">No Active Game Drive Today</h3>
              <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto leading-relaxed">
                Unit telemetry is active. Park clearances and safari dispatches appear here immediately.
              </p>
            </div>
            <button
              onClick={() => navigate('/safari/trips')}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-black uppercase tracking-wider text-emerald-400 transition-all"
            >
              Browse Safari Queue
            </button>
          </div>
        )}
      </div>

      {/* ── UPCOMING EXPEDITIONS QUEUE ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-text-muted flex items-center gap-2">
            <Calendar size={13} className="text-emerald-400" />
            Upcoming Safari Expeditions
          </h2>
          <span className="text-[10px] font-mono text-text-muted">
            {upcomingSafaris.length} Scheduled
          </span>
        </div>

        {upcomingSafaris.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingSafaris.slice(0, 4).map((trip) => (
              <div
                key={trip.id}
                onClick={() => navigate(`/safari/trip/${trip.id}`)}
                className="p-4 rounded-2xl bg-surface border border-white/5 hover:border-accent-green/40 transition-all cursor-pointer group active:scale-[0.99] space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase">
                      {trip.date ? format(new Date(trip.date), 'EEE, MMM dd') : 'Upcoming'} • {trip.timeOfPickup || 'TBD'}
                    </span>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight mt-0.5 group-hover:text-emerald-400 transition-colors">
                      {trip.clientName}
                    </h4>
                  </div>
                  <StatusBadge status={trip.status || 'Confirmed'} />
                </div>

                <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-white/5">
                  <span className="text-[10px] font-medium truncate max-w-[200px]">
                    {trip.destinations || trip.location || 'National Park Route'}
                  </span>
                  <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Inspect <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-surface/40 border border-white/5 text-center text-xs text-text-muted font-mono">
            No upcoming expeditions scheduled in immediate queue.
          </div>
        )}
      </div>

    </div>
  );
};

export default SafariDashboard;
