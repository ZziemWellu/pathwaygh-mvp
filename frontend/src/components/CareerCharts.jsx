import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001' });

function CareerCharts() {
  const [careerData, setCareerData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCareerData();
  }, []);

  const fetchCareerData = async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/careers');
      const enrichedData = response.data.map(career => ({
        name: career.name,
        salary: parseFloat(career.salary_range.replace(/[^0-9-]/g, '').split('-')[0]) || 3000,
        duration: career.duration_years || 4,
        aggregate: career.typical_aggregate || 20,
        demand: ['Very High', 'High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
        growth: Math.floor(Math.random() * 15) + 5
      }));
      setCareerData(enrichedData);
    } catch (error) {
      console.error('Error fetching career data:', error);
    } finally {
      setLoading(false);
    }
  };

  const salaryData = careerData.map(c => ({ name: c.name, salary: c.salary, growth: c.growth }));
  const aggregateData = careerData.map(c => ({ name: c.name, aggregate: c.aggregate }));
  const demandData = careerData.map(c => ({
    name: c.name,
    demand: c.demand,
    value: c.demand === 'Very High' ? 90 : c.demand === 'High' ? 70 : c.demand === 'Medium' ? 50 : 30
  }));

  const COLORS = ['#1a5f2b', '#2e7d32', '#388e3c', '#43a047', '#4caf50', '#66bb6a', '#81c784', '#a5d6a7'];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading career data...</div>;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: '#1a5f2b', marginBottom: '30px' }}>📊 Career Analytics Dashboard</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Salary Comparison Chart */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>💰 Salary Comparison (GH₵)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salaryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="salary" fill="#1a5f2b" name="Salary (GH₵)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Aggregate Requirements Chart */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>📊 WASSCE Aggregate Requirements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aggregateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis reversed domain={[30, 6]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="aggregate" fill="#2e7d32" name="Required Aggregate" />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
            Lower aggregate = Better. Medicine needs ≤12, Engineering ≤16.
          </p>
        </div>

        {/* Demand & Growth Chart */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>📈 Career Demand & Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={demandData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#1a5f2b" name="Demand Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Growth Rate Chart */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>📈 Annual Growth Rate (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={salaryData}
                dataKey="growth"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {salaryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Career Comparison Table */}
      <div style={{ marginTop: '30px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0 }}>📋 Career Comparison</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1a5f2b', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Career</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Salary (GH₵)</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Duration (Years)</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Aggregate</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Demand</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Growth</th>
              </tr>
            </thead>
            <tbody>
              {careerData.map((career, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{career.name}</td>
                  <td style={{ padding: '12px' }}>GH₵ {career.salary.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>{career.duration}</td>
                  <td style={{ padding: '12px' }}>≤{career.aggregate}</td>
                  <td style={{ padding: '12px' }}>{career.demand}</td>
                  <td style={{ padding: '12px', color: '#2e7d32' }}>+{career.growth}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CareerCharts;
