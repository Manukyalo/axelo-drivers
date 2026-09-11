import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriver } from '../../context/DriverContext';
import { Briefcase, Calendar, ChevronRight, Search, MapPin } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { format, isValid } from 'date-fns';

const DriverTrips = () => {
  const navigate = useNavigate();
  const { activeBookings } = useDriver();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return activeBookings;
    return activeBookings.filter(t =>
      t.clientName?.toLowerCase().includes(q) ||
      t.id?.toLowerCase().includes(q) ||
      t.destinations?.toLowerCase().includes(q)
    );
  }, [activeBookings, query]);

  return (
    <div className="min-h-screen bg-primary-dark text-text-primary pb-28">

      {/* Header */}
      <div className="px-5 pt-8 pb-5">
        <h1 className="font-display text-3xl text-text-primary">Trips</h1>
        <p className="text-sm text-text-muted mt-1">
          {activeBookings.length} assignment{activeBookings.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {/* Search */}
      <div className="px-5 mb-5">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
          <input
            id="trips-search"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by client, ID, or destination"
            className="w-full h-12 bg-card border border-border-subtle rounded-2xl pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-gold/40 outline-none transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="px-5 space-y-3">
        {filtered.length > 0 ? (
          filtered.map((trip, i) => {
            const date = trip.date && isValid(new Date(trip.date))
              ? format(new Date(trip.date), 'EEE d MMM')
              : null;

            return (
              <button
                key={trip.id}
                id={`trip-row-${trip.id}`}
                onClick={() => navigate(`/driver/trip/${trip.id}`)}
                className="w-full bg-card border border-border-subtle hover:border-accent-gold/30 rounded-2xl p-4 text-left press-scale transition-colors group animate-fade-up"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-surface border border-border-subtle flex items-center justify-center shrink-0">
                      <Briefcase size={15} className="text-accent-gold" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-text-primary truncate leading-tight">
                        {trip.clientName}
                      </p>
                      {date && (
                        <p className="text-sm text-text-muted mt-0.5 flex items-center gap-1.5">
                          <Calendar size={11} />
                          {date}{trip.timeOfPickup ? ` · ${trip.timeOfPickup}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={trip.status} />
                </div>

                {trip.destinations && (
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin size={13} className="text-text-muted shrink-0 mt-0.5" />
                    <p className="text-sm text-text-muted truncate">
                      {trip.destinations}
                    </p>
                  </div>
                )}

                <div className="flex justify-end mt-3">
                  <span className="flex items-center gap-1 text-xs text-text-muted group-hover:text-accent-gold transition-colors font-medium">
                    View details
                    <ChevronRight size={14} />
                  </span>
                </div>
              </button>
            );
          })
        ) : (
          <div className="py-16 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-card border border-border-subtle flex items-center justify-center">
              <Briefcase size={22} className="text-text-muted" />
            </div>
            <div>
              <p className="text-base font-semibold text-text-primary">
                {query ? 'No matching trips' : 'No trips yet'}
              </p>
              <p className="text-sm text-text-muted mt-1">
                {query ? 'Try a different search term.' : 'Assignments will appear here.'}
              </p>
            </div>
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-sm text-accent-gold hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverTrips;
