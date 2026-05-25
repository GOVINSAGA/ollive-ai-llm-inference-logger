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
            <p>Loading dashboard...</p>
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
            <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>No data available</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Start chatting to generate inference logs</p>
          </div>
        </div>
      </div>
    );
  }

  const statusDist = stats.statusDistribution || {};
  const total = Object.values(statusDist).reduce((a, b) => a + b, 0) || 1;
  const successCount = statusDist.success || 0;
  const errorCount = statusDist.error || 0;
  const cancelledCount = statusDist.cancelled || 0;

  return (
    <div className="main-content">
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Geist Minimalist Analytics Dashboard</h2>
        </div>

        {/* Metric Cards */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Total Requests</div>
            <div className="metric-value">{stats.totalRequests?.toLocaleString() || 0}</div>
            <div className="metric-unit">all time</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Avg Latency</div>
            <div className="metric-value">{stats.avgLatency?.toLocaleString() || 0}</div>
            <div className="metric-unit">milliseconds</div>
          </div>

          <div className="metric-card">
            <div className="metric-label">Error Rate</div>
            <div className="metric-value">{stats.errorRate || 0}%</div>
            <div className="metric-unit">of total requests</div>
          </div>
        </div>

        {/* Dashboard Charts Row */}
        <div className="dashboard-charts-row">
          <div className="chart-container">
            <div className="chart-title">Throughput (Requests / Minute — Last 60 min)</div>
            <ThroughputChart data={stats.throughput || []} />
          </div>

          <div className="chart-container" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="chart-title">Status Distribution</div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px 0', gap: '24px' }}>
              {/* Simple CSS Donut representation */}
              <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', background: `conic-gradient(var(--success) 0% ${successCount/total*100}%, var(--error) ${successCount/total*100}% ${(successCount+errorCount)/total*100}%, var(--cancelled) ${(successCount+errorCount)/total*100}% 100%)` }}>
                <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', bottom: '16px', backgroundColor: 'var(--bg-primary)', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '20px', fontWeight: 600 }}>{total}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>total</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                  Success
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--error)' }}></div>
                  Error
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cancelled)' }}></div>
                  Cancelled
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <div className="chart-title" style={{ marginTop: '24px' }}>Token Usage</div>
              <div className="token-usage-container">
                <div className="token-row">
                  <div className="token-row-header">
                    <span>Prompt: {(stats.tokenUsage?.prompt || 0).toLocaleString()}</span>
                  </div>
                  <div className="token-bar-bg">
                    <div className="token-bar-fill" style={{ width: '60%', background: 'var(--success)' }}></div>
                  </div>
                </div>
                <div className="token-row">
                  <div className="token-row-header">
                    <span>Completion: {(stats.tokenUsage?.completion || 0).toLocaleString()}</span>
                  </div>
                  <div className="token-bar-bg">
                    <div className="token-bar-fill" style={{ width: '40%', background: 'var(--success)' }}></div>
                  </div>
                </div>
                <div className="token-row">
                  <div className="token-row-header">
                    <span>Total: {(stats.tokenUsage?.total || 0).toLocaleString()}</span>
                  </div>
                  <div className="token-bar-bg">
                    <div className="token-bar-fill" style={{ width: '100%', background: 'var(--success)' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Logs Table */}
        <div className="logs-table-container">
          <div className="logs-table-header">Recent Inference Logs</div>
          {logs.length === 0 ? (
            <div className="empty-state">
              <p>No logs recorded yet</p>
            </div>
          ) : (
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
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className={`status-dot ${log.status}`}></span>
                        <span style={{ textTransform: 'capitalize' }}>{log.status}</span>
                      </div>
                    </td>
                    <td>{log.model?.split('/').pop()}</td>
                    <td>{log.latency_ms ? `${log.latency_ms} ms` : '—'}</td>
                    <td>{log.total_tokens || '—'}</td>
                    <td>{log.time_to_first_token_ms ? `${log.time_to_first_token_ms} ms` : '—'}</td>
                    <td>{new Date(log.request_timestamp).toISOString().replace('T', ' ').substring(0, 19)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Simple SVG throughput chart matching Geist style.
 */
function ThroughputChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '40px', fontSize: '12px' }}>
        <p>No throughput data yet</p>
      </div>
    );
  }

  const width = 800;
  const height = 220;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxCount = Math.max(...data.map(d => parseInt(d.count)), 400); // 400 default for scale
  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - (parseInt(d.count) / maxCount) * chartH,
    count: parseInt(d.count),
    time: new Date(d.minute).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg className="throughput-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {/* Grid lines (horizontal) */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <line
          key={i}
          x1={padding.left}
          y1={padding.top + chartH * ratio}
          x2={padding.left + chartW}
          y2={padding.top + chartH * ratio}
          stroke="#eaeaea"
          strokeWidth="1"
        />
      ))}

      {/* Grid lines (vertical) */}
      {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((ratio, i) => (
        <line
          key={`v-${i}`}
          x1={padding.left + chartW * ratio}
          y1={padding.top}
          x2={padding.left + chartW * ratio}
          y2={padding.top + chartH}
          stroke="#eaeaea"
          strokeWidth="1"
        />
      ))}

      {/* Line */}
      <path d={linePath} fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--success)" stroke="#fff" strokeWidth="1.5" />
      ))}

      {/* Y-axis labels */}
      <text x={padding.left - 8} y={padding.top + 4} textAnchor="end" fill="var(--text-muted)" fontSize="10">{maxCount}</text>
      <text x={padding.left - 8} y={padding.top + chartH + 4} textAnchor="end" fill="var(--text-muted)" fontSize="10">0</text>
      
      {/* X-axis labels (just a few) */}
      {[10, 20, 30, 40, 50, 60, 70, 80].map((num, i) => (
         <text key={i} x={padding.left + chartW * (num/80)} y={padding.top + chartH + 16} textAnchor="middle" fill="var(--text-muted)" fontSize="10">{num}</text>
      ))}
    </svg>
  );
}
