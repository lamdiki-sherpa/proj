import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [dailyAnalysis, setDailyAnalysis] = useState([]);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState([]);
  const [engagement, setEngagement] = useState({});

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, dailyRes, weeklyRes, engagementRes] = await Promise.all([
          fetch('http://localhost:5000/api/superadmin/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/superadmin/analysis/dailypost', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/superadmin/analysis/weeklypost', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/superadmin/engagement-stats', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const statsData = await statsRes.json();
        const dailyData = await dailyRes.json();
        const weeklyData = await weeklyRes.json();
        const engagementData = await engagementRes.json();

        setStats(statsData);
        setEngagement(engagementData);

        setDailyAnalysis(
          dailyData.map(item => ({
            day: item.date,
            posts: item.count,
          }))
        );

        setWeeklyAnalysis(
          weeklyData.map(item => ({
            week: item.week,
            posts: item.count,
          }))
        );
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      }
    };

    fetchData();
  }, [token]);

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-4">📊 Super Admin Dashboard</h1>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Users" value={stats.totalUsers} color="blue" />
        <SummaryCard label="Total Designers" value={stats.totalDesigners} color="green" />
        <SummaryCard label="Total Posts" value={stats.totalPosts} color="purple" />
        <SummaryCard label="Total Likes" value={engagement.totalLikes} color="red" />
        <SummaryCard label="Total Comments" value={engagement.totalComments} color="indigo" />
      </div>

      {/* Daily Posts Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">📅 Daily Post Trends (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyAnalysis} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="posts" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Posts Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">📈 Weekly Post Activity (Last 4 Weeks)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyAnalysis} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="posts" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SummaryCard({ label, value = 0, color = 'gray' }) {
  const bgColor = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    orange: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    red: 'bg-red-100 text-red-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    gray: 'bg-gray-100 text-gray-800',
  }[color];

  return (
    <div className={`p-4 rounded shadow ${bgColor}`}>
      <p className="text-sm font-medium uppercase">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
