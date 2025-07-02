import Booking from '../models/Booking.js';
import {
  startOfDay,
  endOfDay,
  parseISO,
  eachDayOfInterval,
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  differenceInDays,
  subDays
} from 'date-fns';

export const getAdminMetrics = async (req, res) => {
  try {
    const now = new Date();

    // 🔽 Parse custom date range from query
    const fromDate = req.query.from ? parseISO(req.query.from) : null;
    const toDate = req.query.to ? parseISO(req.query.to) : null;

    const dateRangeFilter = fromDate && toDate
      ? { startTime: { $gte: fromDate, $lte: toDate }, status: { $ne: 'cancelled' } }
      : { status: { $ne: 'cancelled' } };

    // 📊 Bookings Over Time (grouped by day within date range)
    const recentBookings = await Booking.aggregate([
      { $match: dateRangeFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$startTime" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const bookingsMap = Object.fromEntries(
      recentBookings.map(item => [item._id, item.count])
    );

    let bookingsOverTime = [];

    // 🧩 Fill in missing dates with count: 0
    if (fromDate && toDate) {
      const allDates = eachDayOfInterval({ start: fromDate, end: toDate });
      bookingsOverTime = allDates.map(date => {
        const formatted = format(date, 'yyyy-MM-dd');
        return {
          date: formatted,
          count: bookingsMap[formatted] || 0
        };
      });
    } else {
      // fallback if no date range selected: use what Mongo returned
      bookingsOverTime = recentBookings.map(item => ({
        date: item._id,
        count: item.count
      }));
    }

    // 💰 Revenue and Avg. per Booking (within selected range)
    const filteredBookings = await Booking.find(dateRangeFilter);
    const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const avgRevenue = filteredBookings.length > 0 ? totalRevenue / filteredBookings.length : 0;

    // 📊 FAIR PERFORMANCE CALCULATION
    // 
    // ✅ WHAT THIS DOES:
    // This calculates performance by comparing DAILY AVERAGES between equivalent time periods
    // - 100% = Same daily performance as comparison period
    // - >100% = Better daily performance 
    // - <100% = Worse daily performance
    //
    // 🎯 WHY IT'S FAIR:
    // - Compares apples-to-apples (same duration periods)
    // - Uses daily averages (normalizes for different period lengths)
    // - No misleading results from comparing 1 week to 1 month
    //
    // 📋 HOW IT WORKS:
    // Scenario 1: Custom date range selected (e.g., Jan 15-21)
    //   → Compares to equivalent previous period (Jan 8-14)
    // Scenario 2: No date range (default view)
    //   → Compares current month's daily avg to last month's daily avg
    //
    let performancePercent = null;
    let performanceComparison = null;

    if (fromDate && toDate) {
      // 🔄 CUSTOM DATE RANGE COMPARISON
      // Example: User selects Jan 15-21 (7 days)
      // We compare it to Jan 8-14 (previous 7 days)

      const selectedDays = differenceInDays(toDate, fromDate) + 1; // +1 to include both start and end dates
      const dailyRevenueSelected = totalRevenue / selectedDays;

      // 📅 Calculate comparison period (same duration, immediately before selected range)
      const comparisonEndDate = subDays(fromDate, 1); // Day before selected range starts
      const comparisonStartDate = subDays(comparisonEndDate, selectedDays - 1);
      // Example: If selected is Jan 15-21, comparison is Jan 8-14

      const comparisonRevenueAgg = await Booking.aggregate([
        {
          $match: {
            startTime: { $gte: comparisonStartDate, $lte: comparisonEndDate },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPrice" }
          }
        }
      ]);

      const comparisonRevenue = comparisonRevenueAgg[0]?.total || 0;
      const dailyRevenueComparison = comparisonRevenue / selectedDays;

      // 🧮 Calculate performance percentage
      // Formula: (Selected Period Daily Avg / Comparison Period Daily Avg) × 100
      if (comparisonRevenue > 0) {
        performancePercent = Math.round((dailyRevenueSelected / dailyRevenueComparison) * 100);
        performanceComparison = {
          type: 'period_comparison',
          selectedPeriodDays: selectedDays,
          selectedDailyAvg: Math.round(dailyRevenueSelected),
          comparisonDailyAvg: Math.round(dailyRevenueComparison),
          comparisonPeriod: `${format(comparisonStartDate, 'yyyy-MM-dd')} to ${format(comparisonEndDate, 'yyyy-MM-dd')}`
        };
      }
    } else {
      // 🔄 MONTHLY COMPARISON (DEFAULT VIEW)
      // When no custom range is selected, compare this month vs last month
      // using daily averages to account for different month lengths

      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      // 📊 Calculate days in each month (accounts for Feb, leap years, etc.)
      const currentMonthDays = differenceInDays(currentMonthEnd, currentMonthStart) + 1;
      const lastMonthDays = differenceInDays(lastMonthEnd, lastMonthStart) + 1;

      const currentMonthRevenueAgg = await Booking.aggregate([
        {
          $match: {
            startTime: { $gte: currentMonthStart, $lte: currentMonthEnd },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPrice" }
          }
        }
      ]);

      const lastMonthRevenueAgg = await Booking.aggregate([
        {
          $match: {
            startTime: { $gte: lastMonthStart, $lte: lastMonthEnd },
            status: { $ne: 'cancelled' }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPrice" }
          }
        }
      ]);

      const currentMonthRevenue = currentMonthRevenueAgg[0]?.total || 0;
      const lastMonthRevenue = lastMonthRevenueAgg[0]?.total || 0;

      // 📈 Calculate daily averages for fair comparison
      const currentMonthDailyAvg = currentMonthRevenue / currentMonthDays;
      const lastMonthDailyAvg = lastMonthRevenue / lastMonthDays;

      // 🧮 Calculate performance percentage
      // Formula: (Current Month Daily Avg / Last Month Daily Avg) × 100
      if (lastMonthRevenue > 0) {
        performancePercent = Math.round((currentMonthDailyAvg / lastMonthDailyAvg) * 100);
        performanceComparison = {
          type: 'monthly_comparison',
          currentMonthDailyAvg: Math.round(currentMonthDailyAvg),
          lastMonthDailyAvg: Math.round(lastMonthDailyAvg),
          comparisonPeriod: `${format(lastMonthStart, 'yyyy-MM-dd')} to ${format(lastMonthEnd, 'yyyy-MM-dd')}`
        };
      }
    }

    // 💸 Today's Revenue
    const todayRevenue = await Booking.aggregate([
      {
        $match: {
          startTime: { $gte: startOfDay(now), $lte: endOfDay(now) },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: { _id: null, total: { $sum: "$totalPrice" } }
      }
    ]);

    // 🙋‍♂️ Today's Booking Count (non-cancelled bookings today)
    const todayBookingCount = await Booking.countDocuments({
      startTime: { $gte: startOfDay(now), $lte: endOfDay(now) },
      status: { $ne: 'cancelled' }
    });

    // 📅 Today's Bookings (with amount + payment method)
    const todayBookings = await Booking.find({
      startTime: { $gte: startOfDay(now), $lte: endOfDay(now) }
    })
      .populate('user', 'username')
      .populate('table', 'tableNumber');

    const formattedBookings = todayBookings.map(b => ({
      _id: b._id,
      userName: b.user.username,
      tableName: b.table.tableNumber,
      startTime: b.startTime,
      endTime: b.endTime,
      amountPaid: b.totalPrice,
      paymentMethod: b.payment?.status === 'CASH' ? 'CASH' : 'ONLINE',
      status: b.status,
      refundAmount: b.refundAmount || 0,
      manualUsername: b.manualBookedUser?.username || null,
      manualPhone: b.manualBookedUser?.phone || null,
    }));

    // 🧾 Final payload
    res.json({
      bookingsOverTime,
      revenueSummary: {
        today: todayRevenue[0]?.total || 0,
        period: totalRevenue, // Renamed from "month" to "period" for clarity
        avg: Math.round(avgRevenue)
      },
      performance: performancePercent,
      performanceDetails: performanceComparison, // Additional context for frontend
      todayBookingCount,
      todayBookings: formattedBookings
    });

  } catch (err) {
    console.error("❌ Error in admin metrics:", err);
    res.status(500).json({ message: "Failed to load admin metrics." });
  }
};