import React, { useState, useEffect, useCallback } from 'react';
import { fetchStats, fetchLogs } from '../api/client';

/**
 * Dashboard — real-time analytics with metrics cards, throughput chart,
 * status distribution, token usage, and recent logs table.
 */
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [statsData, logsData] = await Promise.all([
        fetchStats(),
        fetchLogs({ limit: 15 }),
      ]);
      setStats(statsData);
      setLogs(logsData.logs || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) {
    return (
      <div className="main-content">
        <div className="dashboard">
          <div className="empty-state">
            <div className="loading-dots">
              <span></span><span></span><span></span>
            </div>
            <h3>Loading dashboard...</h3>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="main-content">
        <div className="dashboard">
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No data available</h3>
            <p>Start chatting to generate inference logs</p>
          </div>
        </div>
      </div>
    );
  }

  const statusDist = stats.statusDistribution || {};
  const total = Object.values(statusDist).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="main-content">
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Inference Analytics</h2>
          <p>Real-time monitoring of LLM API performance and usage</p>
        </div>

        {/* Metric Cards */}
        <div className="metrics-grid">
          <div className="metric-card accent">
            <div className="metric-label">Total Requests</div>
            <div className="metric-value">{stats.totalRequests?.toLocaleString() || 0}</div>
            <div className="metric-unit">all time</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Avg Latency</div>
            <div className="metric-value">{stats.avgLatency?.toLocaleString() || 0}</div>
            <div className="metric-unit">milliseconds</div>
          </div>

          <div className="metric-card warning">
            <div className="metric-label">P95 Latency</div>
            <div className="metric-value">{stats.p95Latency?.toLocaleString() || 0}</div>
            <div className="metric-unit">milliseconds</div>
          </div>

          <div className={`metric-card ${stats.errorRate > 5 ? 'error' : 'success'}`}>
            <div className="metric-label">Error Rate</div>
            <div className="metric-value">{stats.errorRate || 0}%</div>
            <div className="metric-unit">of total requests</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Avg TTFT</div>
            <div className="metric-value">{stats.avgTimeToFirstToken?.toLocaleString() || 0}</div>
            <div className="metric-unit">time to first token (ms)</div>
          </div>
        </div>

        {/* Throughput Chart */}
        <div className="chart-container">
          <div className="chart-title">Throughput (Requests / Minute — Last 60 min)</div>
          <ThroughputChart data={stats.throughput || []} />
        </div>

        {/* Status Distribution + Token Usage */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="chart-container">
            <div className="chart-title">Status Distribution</div>
            <div className="status-distribution">
              <div className="status-bar-container">
                <div className="status-bar">
                  <div
                    className="status-bar-segment success"
                    style={{ width: `${((statusDist.success || 0) / total) * 100}%` }}
                  />
                  <div
                    className="status-bar-segment error"
                    style={{ width: `${((statusDist.error || 0) / total) * 100}%` }}
                  />
                  <div
                    className="status-bar-segment cancelled"
                    style={{ width: `${((statusDist.cancelled || 0) / total) * 100}%` }}
                  />
                </div>
                <div className="status-legend">
                  <div className="status-legend-item">
                    <div className="status-legend-dot success" />
                    Success ({statusDist.success || 0})
                  </div>
                  <div className="status-legend-item">
                    <div className="status-legend-dot error" />
                    Errors ({statusDist.error || 0})
                  </div>
                  <div className="status-legend-item">
                    <div className="status-legend-dot cancelled" />
                    Cancelled ({statusDist.cancelled || 0})
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-title">Token Usage</div>
            <div className="token-grid">
              <div className="token-card">
                <div className="token-label">Prompt</div>
                <div className="token-value">{(stats.tokenUsage?.prompt || 0).toLocaleString()}</div>
              </div>
              <div className="token-card">
                <div className="token-label">Completion</div>
                <div className="token-value">{(stats.tokenUsage?.completion || 0).toLocaleString()}</div>
              </div>
              <div className="token-card">
                <div className="token-label">Total</div>
                <div className="token-value">{(stats.tokenUsage?.total || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Logs Table */}
        <div className="chart-container">
          <div className="chart-title">Recent Inference Logs</div>
          {logs.length === 0 ? (
            <div className="empty-state">
              <p>No logs recorded yet</p>
            </div>
          ) : (
            <div className="logs-table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Model</th>
                    <th>Latency</th>
                    <th>Tokens</th>
                    <th>TTFT</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className={`status-badge ${log.status}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="mono">{log.model?.split('/').pop()}</td>
                      <td className="mono">{log.latency_ms ? `${log.latency_ms}ms` : '—'}</td>
                      <td className="mono">{log.total_tokens || '—'}</td>
                      <td className="mono">{log.time_to_first_token_ms ? `${log.time_to_first_token_ms}ms` : '—'}</td>
                      <td>{new Date(log.request_timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Simple SVG throughput chart.
 */
function ThroughputChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '40px' }}>
        <p>No throughput data yet</p>
      </div>
    );
  }

  const width = 800;
  const height = 180;
  const padding = { top: 10, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxCount = Math.max(...data.map(d => parseInt(d.count)), 1);
  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - (parseInt(d.count) / maxCount) * chartH,
    count: parseInt(d.count),
    time: new Date(d.minute).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <svg className="throughput-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(99, 102, 241, 0.3)" />
          <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <line
          key={i}
          x1={padding.left}
          y1={padding.top + chartH * ratio}
          x2={padding.left + chartW}
          y2={padding.top + chartH * ratio}
          stroke="rgba(99, 115, 175, 0.08)"
          strokeWidth="1"
        />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGradient)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--accent-primary)" stroke="var(--bg-primary)" strokeWidth="1.5" />
      ))}

      {/* Y-axis labels */}
      <text x={padding.left - 8} y={padding.top + 4} textAnchor="end" fill="#64748b" fontSize="10">{maxCount}</text>
      <text x={padding.left - 8} y={padding.top + chartH + 4} textAnchor="end" fill="#64748b" fontSize="10">0</text>
    </svg>
  );
}
