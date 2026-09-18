import Link from "next/link";
import { Bus, Ticket, ShieldCheck, CheckCircle2, ShieldAlert, ArrowRight, Zap, RefreshCw, Layers } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-16 py-6">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          CSX4107 Project 2 — Web Application Development
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Van and Bus <span className="text-emerald-600">Booking System</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          A full-stack web application designed to digitize transport trip management, live seat
          selection, and instant reservations.
        </p>

        {/* Member Ownership Banner */}
        <div className="bg-white border-2 border-emerald-500/20 rounded-2xl p-5 shadow-sm max-w-xl mx-auto text-left flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-md">
            YA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base">Ye Htet Aung</span>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase">
                Member 2
              </span>
            </div>
            <p className="text-xs font-semibold text-emerald-700 mt-0.5">
              Role: Booking & Seat Availability Lead
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Responsible for the reservation workflow, live seat layout, RESTful booking endpoints, duplicate-seat prevention, and cancellation logic.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/trips"
            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <span>Browse Trips & Reserve</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/my-bookings"
            className="px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
          >
            <Ticket className="w-4 h-4 text-slate-500" />
            <span>My Bookings</span>
          </Link>
          <Link
            href="/admin/bookings"
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin View</span>
          </Link>
        </div>
      </section>

      {/* Ye Htet Aung Deliverables Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900">Member 2 Core Deliverables</h2>
          <p className="text-slate-500 text-sm mt-1">
            All requirements assigned in the project task division guide have been implemented and verified.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Seat Availability API</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              <code>GET /api/trips/:id/availability</code> returns real-time booked seats, total capacity, available seats, and remaining vacancy for vans and buses.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Zero Duplicate-Booking Protection</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Enforces a compound partial unique MongoDB index <code>(tripId + seatNumbers)</code> excluding cancelled bookings, eliminating race condition double-bookings.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <Bus className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Interactive Seat Map UI</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Responsive vehicle cabin visualization with driver front, aisles, and color-coded seat states (Available, Selected, and Booked).
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Ticket className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Booking CRUD Operations</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Full RESTful endpoints: <code>GET/POST /api/bookings</code> and <code>GET/PATCH/DELETE /api/bookings/:id</code> adhering to the shared JSON response contract.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Cancellation & Seat Release</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Customers can review and cancel their reservations before departure time; cancelled bookings instantly release seats for new travelers.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-emerald-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Automated Test Suite</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Comprehensive test script (<code>npm run test:booking</code>) validating normal booking, concurrent duplicate seat rejection, capacity bounds, and seat release.
            </p>
          </div>
        </div>
      </section>

      {/* Shared Architecture Context */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <h3 className="font-bold text-slate-900 text-lg mb-4">Project 2 Team Work Division Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-800">Member 1 — Li Hout Van</div>
            <div className="text-xs text-slate-500 mt-1">Vehicle & Trip Management Lead</div>
            <p className="text-xs text-slate-600 mt-2">Vehicle CRUD, Trip CRUD, admin scheduling, capacity/status validation.</p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300">
            <div className="font-bold text-emerald-950">Member 2 — Ye Htet Aung (Your Part)</div>
            <div className="text-xs text-emerald-700 font-medium mt-1">Booking & Seat Availability Lead</div>
            <p className="text-xs text-emerald-800 mt-2">Booking CRUD, seat layout, availability API, duplicate-seat prevention, confirmation, cancellation.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-800">Member 3 — Zaw Zaw Naing</div>
            <div className="text-xs text-slate-500 mt-1">Authentication & Customer UI Lead</div>
            <p className="text-xs text-slate-600 mt-2">Registration/login, roles, protected routes, trip search, customer pages, responsive UI.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

