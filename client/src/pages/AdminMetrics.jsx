import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import socket from '../socket/socket.js';


const AdminMetrics = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user]);

  useEffect(() => {
    if (from && to && !isValidRange()) {
      toast.error('Choose a valid date range');
      return;
    }
    fetchMetrics();
  }, [from, to]);

  // Listen for real-time metrics update via WebSocket
  useEffect(() => {
    socket.on('metrics:update', () => {
      console.log('📡 Real-time update received: metrics:update');
      fetchMetrics(); // Re-fetch data live
    });

    return () => {
      socket.off('metrics:update');
    };
  }, []);


  // ✅ Check if selected date range is valid
  const isValidRange = () => {
    return !(from && to && parseISO(from) >= parseISO(to));
  };

  // ✅ Fetch metrics from backend API
  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (from && to && isValidRange()) {
        params.from = from;
        params.to = to;
      }

      const res = await axios.get('/api/auth/admin-metrics', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setMetrics(res.data);
    } catch (err) {
      console.error('❌ Failed to load metrics:', err);
    }
  };

  if (!metrics || !metrics.revenueSummary) {
    return <p className="p-6 text-gray-600">Loading admin metrics...</p>;
  }

  const bookingsOverTime = metrics.bookingsOverTime || [];
  const revenueSummary = metrics.revenueSummary || { today: 0, period: 0, avg: 0 };
  const todayBookings = metrics.todayBookings || [];
  const todayBookingCount = metrics.todayBookingCount || 0;
  const performance = metrics.performance || 0;
  const performanceDetails = metrics.performanceDetails || null;

  // ✅ Format selected date range for card label
  const formattedRange = from && to
    ? (
      <>
        <span>Revenue from</span><br />
        <span>{format(parseISO(from), 'dd/MM/yyyy')} - {format(parseISO(to), 'dd/MM/yyyy')}</span>
      </>
    )
    : 'Revenue (all months)';

  // ✅ Determine color based on performance %
  const getPerformanceColor = (percent) => {
    if (percent >= 110) return '#10b981'; // green for great performance
    if (percent >= 90) return '#f59e0b';  // yellow for ok performance
    return '#ef4444'; // red for poor performance
  };

  return (
    <div className="p-6 space-y-8 bg-[var(--bg)] text-[var(--text)]">
      <h1 className="text-2xl font-bold">Admin Metrics Dashboard</h1>

      {/* 🔽 Date Range Picker */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div>
          <label className="text-sm text-[var(--text-muted)]">From:</label>
          <input
            type="date"
            className="ml-2 border border-[var(--border)] px-2 py-1 rounded bg-[var(--bg-light)] text-[var(--text)]"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-[var(--text-muted)]">To:</label>
          <input
            type="date"
            className="ml-2 border border-[var(--border)] px-2 py-1 rounded bg-[var(--bg-light)] text-[var(--text)]"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {isValidRange() && (
        <>
          {/* 💳 Revenue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card title={`Today's Revenue`} value={`₹${revenueSummary.today}`} />
            <Card title={`Today's Bookings`} value={`${todayBookingCount}`} />
            <Card title={formattedRange} value={`₹${revenueSummary.period}`} />
            <Card title="Avg. Per Booking" value={`₹${revenueSummary.avg}`} />
            <Card
              title="Performance"
              customContent={
                <div
                  className="w-20 h-20 mx-auto"
                  title={
                    performanceDetails?.comparisonPeriod
                      ? `Compared to: ${performanceDetails.comparisonPeriod}`
                      : ''
                  }
                >
                  <CircularProgressbar
                    value={Math.min(performance, 200)} // cap visual display
                    text={`${performance}%`}
                    styles={buildStyles({
                      pathColor: getPerformanceColor(performance),
                      textColor: 'var(--text)',
                      trailColor: 'var(--border-muted)',
                      textSize: '18px',
                    })}
                  />
                </div>
              }
            />

          </div>

          {/* ℹ️ Performance Comparison Detail */}
          {performanceDetails && (
            <div className="bg-[var(--bg-light)] p-4 rounded-xl shadow border border-[var(--border)]">
              <h3 className="text-sm font-medium text-[var(--text-muted)] mb-2">
                Performance Comparison Details
              </h3>
              <p className="text-sm text-[var(--text-muted)]">
                {performanceDetails.type === 'period_comparison' ? (
                  <>
                    Daily average: ₹{performanceDetails.selectedDailyAvg} vs ₹{performanceDetails.comparisonDailyAvg} (
                    <span
                      className="underline decoration-dotted cursor-help"
                      title={`Compared to: ${performanceDetails.comparisonPeriod}`}
                    >
                      previous {performanceDetails.selectedPeriodDays} days
                    </span>)
                  </>
                ) : (
                  <>
                    Daily average: ₹{performanceDetails.currentMonthDailyAvg} vs ₹{performanceDetails.lastMonthDailyAvg} (
                    <span
                      className="underline decoration-dotted cursor-help"
                      title={`Compared to: ${performanceDetails.comparisonPeriod}`}
                    >
                      last month
                    </span>)
                  </>
                )}
              </p>
            </div>
          )}

          {/* 📈 Line Chart of Bookings Over Time */}
          <div className="bg-[var(--bg-light)] p-4 rounded-xl shadow border border-[var(--border)]">
            <h2 className="text-lg font-semibold mb-2">📊 Bookings Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={bookingsOverTime}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-muted)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: `var(--bg-light)`,
                    borderColor: `var(--primary)`,
                    borderRadius: '4px',
                    color: `var(--text)`
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fill="url(#colorCount)"
                  activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--primary)', fill: 'white' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* 📅 Today's Bookings List */}
      <div className="bg-[var(--bg-light)] p-4 rounded-xl shadow border border-[var(--border)]">
        <h2 className="text-lg font-semibold mb-2">📅 Today's Bookings</h2>
        {todayBookings.length > 0 ? (
          <div className="max-h-72 overflow-y-auto pr-2">
            <ul className="divide-y divide-[var(--border)]">
              {todayBookings.map(b => (
                <li key={b._id} className="py-2">
                  {b.status === 'cancelled' ? (
                    <>
                      <strong>{b.userName} ({b.manualUsername ? 'admin' : 'user'})</strong> cancelled table <strong>{b.tableName}</strong> from{" "}
                      {new Date(b.startTime).toLocaleTimeString()} to{" "}
                      {new Date(b.endTime).toLocaleTimeString()} | Refund Amount: ₹{b.refundAmount} | Payment: {b.paymentMethod}
                      {b.manualUsername && (
                        <>
                          {" "} | Customer: <strong>{b.manualUsername}</strong> | Customer Phone: {b.manualPhone}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <strong>{b.userName} ({b.manualUsername ? 'admin' : 'user'})</strong> booked table <strong>{b.tableName}</strong> from{" "}
                      {new Date(b.startTime).toLocaleTimeString()} to{" "}
                      {new Date(b.endTime).toLocaleTimeString()} | Paid Amount: ₹{b.amountPaid} | Payment: {b.paymentMethod}
                      {b.manualUsername && (
                        <>
                          {" "} | Customer: <strong>{b.manualUsername}</strong> | Customer Phone: {b.manualPhone}
                        </>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-[var(--text-muted)]">No bookings for today.</p>
        )}
      </div>
    </div>
  );
};

// ✅ Reusable card component
const Card = ({ title, value, customContent }) => (
  <div className="bg-[var(--bg-light)] p-4 rounded-xl shadow border border-[var(--border)] text-center">
    <p className="text-sm text-[var(--text-muted)] mb-1">{title}</p>
    {customContent ? (
      customContent
    ) : (
      <p className="text-xl font-semibold">{value}</p>
    )}
  </div>
);

export default AdminMetrics;
