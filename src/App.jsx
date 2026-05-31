// C:\projects\intern\src\App.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  Box,
  AlertTriangle,
  Sparkles,
  Users,
  Download,
  Settings,
  Sun,
  Moon,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  X,
  ChevronRight,
  Clock,
  Lock,
  Mail,
  HelpCircle,
  FileText,
  Trash2
} from 'lucide-react';
import { initialReviews, competitorData, aiInsightsList, keywordsData, alertsList } from './mockData';

function App() {
  // --- Global States ---
  const [reviews, setReviews] = useState(initialReviews);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, reviews, sentiment, products, issues, ai-insights, customers, reports, settings
  const [theme, setTheme] = useState('light');
  const [toasts, setToasts] = useState([]);

  // --- Filter States ---
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState(null);

  // --- UI Interactions ---
  const [selectedReviewForReply, setSelectedReviewForReply] = useState(null);
  const [replyInput, setReplyInput] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSegment, setActiveSegment] = useState(null); // Sentiment Donut segment hover
  const [selectedProductIdDetail, setSelectedProductIdDetail] = useState(null); // Clicked product details
  const [activeAlerts, setActiveAlerts] = useState(alertsList);
  const [exportLoading, setExportLoading] = useState({ pdf: false, csv: false, schedule: false });
  const [settingsForm, setSettingsForm] = useState({
    brandName: 'ReviewPulse Apparel',
    alertEmail: 'operations@reviewpulse.com',
    integrations: { amazon: true, flipkart: true, myntra: true, google: true, instagram: false }
  });

  // --- Theme Toggle ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // --- Toast Trigger Helper ---
  const triggerToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- Date Preset Actions ---
  const handleDatePreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    triggerToast(`Set filters to last ${days} days`, 'info');
  };

  const handleClearAllFilters = () => {
    setSelectedPlatform('All');
    setSelectedCategory('All');
    setSelectedProduct('All');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setSelectedKeyword(null);
    triggerToast('All dashboard filters cleared!', 'info');
  };

  // --- Dynamic Filtering Logic ---
  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      // 1. Platform Filter
      const platformMatch = selectedPlatform === 'All' || review.platform === selectedPlatform;
      
      // 2. Category Filter
      const categoryMatch = selectedCategory === 'All' || review.category === selectedCategory;

      // 3. Product Filter
      const productMatch = selectedProduct === 'All' || review.product === selectedProduct;

      // 4. Keyword Tag Filter
      const keywordMatch = !selectedKeyword || review.text.toLowerCase().includes(selectedKeyword.toLowerCase());

      // 5. Search Text Query Match
      const searchMatch = searchQuery === '' || 
        review.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.text.toLowerCase().includes(searchQuery.toLowerCase());

      // 6. Date Range Filters
      let dateMatch = true;
      if (startDate || endDate) {
        const reviewDate = new Date(review.date);
        if (startDate) {
          dateMatch = dateMatch && reviewDate >= new Date(startDate);
        }
        if (endDate) {
          dateMatch = dateMatch && reviewDate <= new Date(endDate);
        }
      }

      return platformMatch && categoryMatch && productMatch && keywordMatch && searchMatch && dateMatch;
    });
  }, [reviews, selectedPlatform, selectedCategory, selectedProduct, selectedKeyword, searchQuery, startDate, endDate]);

  // --- Dynamic KPI Metrics (Recalculate dynamically on filter changes) ---
  const kpis = useMemo(() => {
    const total = filteredReviews.length;
    if (total === 0) {
      return { total: 0, avgRating: '0.0', positivePct: 0, negativePct: 0, criticalAlerts: 0, responseRate: 0, unanswered: 0 };
    }

    const sumRatings = filteredReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = (sumRatings / total).toFixed(1);

    const positiveCount = filteredReviews.filter(r => r.rating >= 4).length;
    const negativeCount = filteredReviews.filter(r => r.rating <= 2).length;
    const neutralCount = filteredReviews.filter(r => r.rating === 3).length;

    const positivePct = Math.round((positiveCount / total) * 100);
    const negativePct = Math.round((negativeCount / total) * 100);

    const repliedCount = filteredReviews.filter(r => r.status === 'Replied').length;
    const responseRate = Math.round((repliedCount / total) * 100);

    const criticalAlerts = filteredReviews.filter(r => r.rating <= 2 && r.status === 'Unanswered').length;
    const unanswered = total - repliedCount;

    return {
      total,
      avgRating,
      positivePct,
      negativePct,
      criticalAlerts,
      responseRate,
      unanswered,
      positiveCount,
      neutralCount,
      negativeCount
    };
  }, [filteredReviews]);

  // --- SVG Curved Line Chart Coordinates ---
  // Calculates dynamic curve data based on the active filtered reviews count scale
  const lineChartData = useMemo(() => {
    const scale = 514; // Multiplier to simulate 10,000+ total reviews (25 * 514 = 12,850 reviews)
    const activeCount = filteredReviews.length * scale;
    
    // Dec, Jan, Feb, Mar, Apr, May projections
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
    const baseProjections = [0.65, 0.78, 0.72, 0.85, 0.95]; // seasonal curves

    return months.map((month, idx) => {
      const multiplier = baseProjections[idx];
      const scaledVal = Math.round(activeCount * multiplier);
      return { month, value: Math.max(scaledVal, 150) };
    });
  }, [filteredReviews]);

  const svgLinePath = useMemo(() => {
    const width = 500;
    const height = 180;
    const padding = 20;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    const values = lineChartData.map(d => d.value);
    const maxVal = Math.max(...values, 1000);

    const getCoords = () => {
      return lineChartData.map((d, i) => {
        const x = padding + (i * chartWidth) / (lineChartData.length - 1);
        const y = height - padding - (d.value * chartHeight) / maxVal;
        return { x, y, value: d.value, month: d.month };
      });
    };

    const coords = getCoords();

    // Curved Path Generator using Bezier control anchors
    const buildPath = () => {
      if (coords.length === 0) return '';
      return coords.reduce((acc, c, i) => {
        if (i === 0) return `M ${c.x} ${c.y}`;
        const prev = coords[i - 1];
        const controlX = (prev.x + c.x) / 2;
        return `${acc} C ${controlX} ${prev.y}, ${controlX} ${c.y}, ${c.x} ${c.y}`;
      }, '');
    };

    const buildAreaPath = () => {
      const line = buildPath();
      if (!line) return '';
      return `${line} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;
    };

    return {
      linePath: buildPath(),
      areaPath: buildAreaPath(),
      coords,
      width,
      height,
      padding
    };
  }, [lineChartData]);

  // --- SVG Segmented Sentiment Donut Proportions ---
  const sentimentDonutCircumference = 2 * Math.PI * 70; // Radius = 70. Circumference = 439.8

  const segments = useMemo(() => {
    const c = sentimentDonutCircumference;
    const total = kpis.total;
    if (total === 0) return [];

    const posVal = kpis.positivePct;
    const negVal = kpis.negativePct;
    const neuVal = 100 - posVal - negVal;

    return [
      { label: 'Positive', value: posVal, color: '#4F46E5' },
      { label: 'Neutral', value: neuVal, color: '#A5B4FC' },
      { label: 'Negative', value: negVal, color: '#EF4444' }
    ];
  }, [kpis, sentimentDonutCircumference]);

  // --- Empathetic and Responsive AI Reply Generator ---
  const handleAIDraftResponse = () => {
    if (!selectedReviewForReply) return;
    const r = selectedReviewForReply;
    const customer = r.customerName;
    const rating = r.rating;
    const category = r.category;

    // 5 Star Reviews: Enthusiastic, thankful, celebratory
    if (rating === 5) {
      setReplyInput(`Hi ${customer},\n\nWow! Thank you so much for your wonderful review ⭐\n\nWe're absolutely thrilled to hear that you had such a great experience with our product. Feedback like yours motivates our entire team to continue delivering the best possible quality and service.\n\nWe truly appreciate your support and are grateful that you took the time to share your experience with us.\n\nWe can't wait to serve you again soon!\n\nWarm regards,\n${settingsForm.brandName} Team`);
    } 
    // 4 Star Reviews: Appreciative and positive
    else if (rating === 4) {
      setReplyInput(`Hi ${customer},\n\nThank you for your positive feedback and for rating us 4 stars ⭐\n\nWe're delighted to know that you had a good experience with our product. At the same time, we're always looking for ways to improve and provide an even better experience next time.\n\nYour support means a lot to us, and we appreciate you taking the time to leave a review.\n\nBest regards,\n${settingsForm.brandName} Team`);
    } 
    // 3 Star Reviews: Constructive and improvement-focused
    else if (rating === 3) {
      setReplyInput(`Hi ${customer},\n\nThank you for sharing your feedback with us.\n\nWe're glad you gave our product a try, but we're sorry to hear that your experience wasn't completely satisfactory. Your review helps us understand where we can improve.\n\nIf there's anything specific we can do to make your experience better, we'd love the opportunity to learn more.\n\nThank you for helping us improve.\n\nKind regards,\n${settingsForm.brandName} Team`);
    } 
    // 1-2 Star Reviews: Empathetic, apologetic, and issue-specific
    else {
      let issueMessage = "We're sorry that your experience did not meet expectations.";
      switch (category) {
        case 'Delivery':
          issueMessage = "We're truly sorry to hear about the delivery delays you experienced.";
          break;
        case 'Packaging':
          issueMessage = "We're very sorry that your order arrived with packaging issues.";
          break;
        case 'Wrong Product':
          issueMessage = "We're sorry that you received an incorrect item.";
          break;
        case 'Size':
          issueMessage = "We're sorry that the sizing did not meet your expectations.";
          break;
        case 'Product Quality':
          issueMessage = "We're sorry that the product quality did not meet the standards you expected.";
          break;
      }

      setReplyInput(`Hi ${customer},\n\nThank you for taking the time to share your feedback.\n\n${issueMessage}\n\nWe completely understand how frustrating this can be, and we'd like to sincerely apologize for the inconvenience caused.\n\nYour feedback has been shared with our team so that we can investigate the issue and take the necessary steps to improve.\n\nWe genuinely value every customer experience, and we're grateful that you brought this matter to our attention.\n\nSincerely,\n${settingsForm.brandName} Escalation Team`);
    }
    triggerToast('Empathetic AI Draft Response Generated!', 'info');
  };

  // --- Submit Reply Action ---
  const handleSubmitReply = () => {
    if (!replyInput.trim()) {
      triggerToast('Reply text cannot be empty!', 'error');
      return;
    }

    setReviews(prev => prev.map(r => {
      if (r.id === selectedReviewForReply.id) {
        return { ...r, status: 'Replied', replyText: replyInput };
      }
      return r;
    }));

    setIsDrawerOpen(false);
    setSelectedReviewForReply(null);
    setReplyInput('');
    triggerToast(`Response published to ${selectedReviewForReply.platform} API!`);
  };

  // --- Export Simulator ---
  const handleTriggerExport = (type) => {
    setExportLoading(prev => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setExportLoading(prev => ({ ...prev, [type]: false }));
      triggerToast(`Export complete: ReviewPulse_Report_${type.toUpperCase()}.xls`);
    }, 1500);
  };

  // --- Dynamic Platform Ratings calculations ---
  const platformRatingsData = useMemo(() => {
    const platforms = ['Amazon', 'Flipkart', 'Myntra', 'Google', 'Instagram'];
    return platforms.map(p => {
      const matches = reviews.filter(r => r.platform === p);
      const avg = matches.length > 0 ? (matches.reduce((sum, r) => sum + r.rating, 0) / matches.length).toFixed(1) : '0.0';
      return { name: p, score: parseFloat(avg) };
    });
  }, [reviews]);

  return (
    <div className="app-container">
      {/* Dynamic Toast Alert Notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === 'success' && <Check size={16} stroke="var(--color-positive)" />}
            {t.type === 'error' && <X size={16} stroke="var(--color-negative)" />}
            {t.type === 'info' && <Sparkles size={16} stroke="var(--color-brand)" />}
            <span className="toast-msg">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">RP</div>
          <span className="logo-text">ReviewPulse</span>
        </div>

        <nav className="sidebar-nav">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setSelectedKeyword(null); }}>
            <LayoutDashboard />
            <span>Dashboard</span>
          </div>
          <div className={`nav-item ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>
            <MessageSquare />
            <span>Reviews</span>
            {kpis.unanswered > 0 && (
              <span style={{ marginLeft: 'auto', backgroundColor: 'var(--color-negative-bg)', color: 'var(--color-negative)', fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>
                {kpis.unanswered}
              </span>
            )}
          </div>
          <div className={`nav-item ${activeTab === 'sentiment' ? 'active' : ''}`} onClick={() => setActiveTab('sentiment')}>
            <TrendingUp />
            <span>Sentiment</span>
          </div>
          <div className={`nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
            <Box />
            <span>Products</span>
          </div>
          <div className={`nav-item ${activeTab === 'issues' ? 'active' : ''}`} onClick={() => setActiveTab('issues')}>
            <AlertTriangle />
            <span>Issues</span>
            {kpis.criticalAlerts > 0 && (
              <span style={{ marginLeft: 'auto', backgroundColor: 'var(--color-negative-bg)', color: 'var(--color-negative)', fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: '10px' }}>
                {kpis.criticalAlerts}
              </span>
            )}
          </div>
          <div className={`nav-item ${activeTab === 'ai-insights' ? 'active' : ''}`} onClick={() => setActiveTab('ai-insights')}>
            <Sparkles />
            <span>AI Insights</span>
          </div>
          <div className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
            <Users />
            <span>Customers</span>
          </div>
          <div className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <Download />
            <span>Reports</span>
          </div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings />
            <span>Settings</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">MP</div>
            <div className="user-info">
              <span className="user-name">Monis Patel</span>
              <span className="user-role">Founder / Admin</span>
            </div>
          </div>

          <button 
            className="theme-toggle"
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Panel Wrapper */}
      <div className="main-wrapper">
        <header className="header-bar">
          <div className="header-search-bar">
            <Search size={16} stroke="var(--text-tertiary)" />
            <input 
              type="text" 
              placeholder="Search customers or keywords..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && <X size={14} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />}
          </div>

          {/* Preset Buttons Header */}
          <div className="header-actions">
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="nav-item active" style={{ height: '34px', padding: '0 12px', fontSize: '0.8rem', borderRadius: '6px' }} onClick={() => handleDatePreset(7)}>7 Days</button>
              <button className="nav-item active" style={{ height: '34px', padding: '0 12px', fontSize: '0.8rem', borderRadius: '6px' }} onClick={() => handleDatePreset(30)}>30 Days</button>
              <button className="nav-item active" style={{ height: '34px', padding: '0 12px', fontSize: '0.8rem', borderRadius: '6px' }} onClick={() => handleDatePreset(90)}>90 Days</button>
              {(startDate || endDate) && <button className="clear-filters-btn" onClick={() => { setStartDate(''); setEndDate(''); }}>Reset Date</button>}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {selectedPlatform !== 'All' && <span className="badge-platform">{selectedPlatform} <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedPlatform('All')} /></span>}
              {selectedCategory !== 'All' && <span className="badge-platform">{selectedCategory} <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedCategory('All')} /></span>}
              {selectedProduct !== 'All' && <span className="badge-platform">{selectedProduct} <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedProduct('All')} /></span>}
              {selectedKeyword && <span className="badge-platform" style={{ color: 'var(--color-brand)', borderColor: 'var(--color-brand)' }}>"{selectedKeyword}" <X size={10} style={{ cursor: 'pointer' }} onClick={() => setSelectedKeyword(null)} /></span>}
            </div>
          </div>
        </header>

        <main className="content-body">
          {/* VIEW CONTROLS CONTAINER */}

          {/* 1. EXECUTIVE DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="page-title-section">
                <div>
                  <h1>Executive Overview</h1>
                  <p className="title-caption">Real-time reviews and client analytics summary for {settingsForm.brandName}</p>
                </div>
                <button className="nav-item active" style={{ height: '38px', padding: '0 16px', borderRadius: '8px' }} onClick={() => handleTriggerExport('csv')}>
                  <Download size={16} style={{ marginRight: '6px' }} /> Export CSV Report
                </button>
              </div>

              {/* KPI Cards Row (6 Cards exactly as requested) */}
              <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                <div className="card kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-title">Total Reviews</span>
                    <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--bg-tertiary)' }}><MessageSquare size={14} /></div>
                  </div>
                  <span className="kpi-val">{kpis.total * 514}</span>
                  <span className="kpi-trend positive"><ArrowUpRight size={12} /> +18% vs last month</span>
                </div>

                <div className="card kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-title">Average Rating</span>
                    <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-neutral-bg)', color: 'var(--color-neutral)' }}>★</div>
                  </div>
                  <span className="kpi-val">{kpis.avgRating} <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>/ 5.0</span></span>
                  <span className="kpi-trend positive"><ArrowUpRight size={12} /> Brand health stable</span>
                </div>

                <div className="card kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-title">Positive Sentiment</span>
                    <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-positive-bg)', color: 'var(--color-positive)' }}>✔</div>
                  </div>
                  <span className="kpi-val">{kpis.positivePct}%</span>
                  <span className="kpi-trend positive">Customer satisfaction high</span>
                </div>

                <div className="card kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-title">Negative Reviews</span>
                    <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-negative-bg)', color: 'var(--color-negative)' }}>✘</div>
                  </div>
                  <span className="kpi-val">{kpis.negativePct}%</span>
                  <span className="kpi-trend negative"><ArrowUpRight size={12} /> Needs monitoring</span>
                </div>

                <div className="card kpi-card" style={{ borderColor: kpis.criticalAlerts > 0 ? 'var(--color-negative)' : 'var(--border-color)' }}>
                  <div className="kpi-card-header">
                    <span className="kpi-title">Critical Alerts</span>
                    <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-negative-bg)', color: 'var(--color-negative)' }}><AlertTriangle size={14} /></div>
                  </div>
                  <span className="kpi-val" style={{ color: kpis.criticalAlerts > 0 ? 'var(--color-negative)' : 'inherit' }}>{kpis.criticalAlerts}</span>
                  <span className="kpi-trend neutral">Requires immediate reply</span>
                </div>

                <div className="card kpi-card">
                  <div className="kpi-card-header">
                    <span className="kpi-title">Response Rate</span>
                    <div className="kpi-icon-wrap" style={{ backgroundColor: 'var(--color-brand-glow)', color: 'var(--color-brand)' }}>✉</div>
                  </div>
                  <span className="kpi-val">{kpis.responseRate}%</span>
                  <span className="kpi-trend positive">Excellent dispatch speed</span>
                </div>
              </div>

              {/* Review Trend Custom SVG line chart */}
              <div className="charts-grid-main">
                <div className="card">
                  <div className="chart-card-title">
                    <div>
                      <h3>Review Volume Trends</h3>
                      <span className="title-caption">Reviews scale projections over the last 5 months</span>
                    </div>
                  </div>
                  <div className="svg-chart-container">
                    <svg className="svg-chart-line" viewBox={`0 0 ${svgLinePath.width} ${svgLinePath.height}`} width="100%">
                      <defs>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="3" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <linearGradient id="gradient-line" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0.0"/>
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      {[0, 1, 2, 3].map(li => {
                        const y = svgLinePath.padding + (li * (svgLinePath.height - 2 * svgLinePath.padding)) / 3;
                        return <line key={li} x1={svgLinePath.padding} y1={y} x2={svgLinePath.width - svgLinePath.padding} y2={y} className="chart-grid-line" />;
                      })}

                      {/* Line Fills and curve */}
                      {svgLinePath.areaPath && <path d={svgLinePath.areaPath} fill="url(#gradient-line)" />}
                      {svgLinePath.linePath && <path d={svgLinePath.linePath} fill="none" stroke="var(--color-brand)" strokeWidth="4" strokeLinecap="round" filter="url(#glow)" />}

                      {/* Node circles */}
                      {svgLinePath.coords.map((c, i) => (
                        <circle 
                          key={i} 
                          cx={c.x} 
                          cy={c.y} 
                          className="chart-data-node" 
                          fill="var(--bg-secondary)" 
                          stroke="var(--color-brand)" 
                          strokeWidth="3.5" 
                          onMouseEnter={() => triggerToast(`Month: ${c.month} | Proj Reviews: ${c.value}`, 'info')}
                        />
                      ))}

                      {/* Month Text */}
                      {lineChartData.map((d, i) => {
                        const x = svgLinePath.padding + (i * (svgLinePath.width - 2 * svgLinePath.padding)) / (lineChartData.length - 1);
                        return <text key={i} x={x} y={svgLinePath.height - 2} fill="var(--text-tertiary)" fontSize="8" fontWeight="600" textAnchor="middle">{d.month}</text>;
                      })}
                    </svg>
                  </div>
                </div>

                {/* Sentiment Distribution Donut (With hover changes requested by ChatGPT) */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3>Sentiment Breakdown</h3>
                    <span className="title-caption">Aggregate client emotions index</span>
                  </div>

                  <div className="sentiment-donut-wrap">
                    <svg width="130" height="130" viewBox="0 0 220 220">
                      <circle cx="110" cy="110" r="70" stroke="var(--bg-tertiary)" strokeWidth="18" fill="transparent" />
                      {/* Segment Circles */}
                      {segments.map((seg, idx) => {
                        // Calculate accumulated offset values
                        let prevAccumulated = 0;
                        for (let j = 0; j < idx; j++) {
                          prevAccumulated += segments[j].value;
                        }
                        const offset = sentimentDonutCircumference - (prevAccumulated / 100) * sentimentDonutCircumference;
                        const strokeLength = (seg.value / 100) * sentimentDonutCircumference;
                        
                        return (
                          <circle 
                            key={seg.label}
                            cx="110"
                            cy="110"
                            r="70"
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="18"
                            strokeDasharray={`${strokeLength} ${sentimentDonutCircumference}`}
                            strokeDashoffset={offset}
                            transform="rotate(-90 110 110)"
                            style={{ cursor: 'pointer', transition: 'stroke-width 0.2s' }}
                            onMouseEnter={() => setActiveSegment(seg)}
                            onMouseLeave={() => setActiveSegment(null)}
                          />
                        );
                      })}
                    </svg>
                    
                    {/* Hover text replacement in center */}
                    <div className="donut-inner-text">
                      <span className="donut-pct" style={{ fontSize: '1.8rem' }}>
                        {activeSegment ? `${activeSegment.value}%` : `${kpis.positivePct}%`}
                      </span>
                      <span className="donut-lbl">
                        {activeSegment ? activeSegment.label : 'Positive'}
                      </span>
                    </div>
                  </div>

                  {/* Legend filter triggers */}
                  <div className="sentiment-legend" style={{ gap: '8px' }}>
                    {segments.map(seg => (
                      <div key={seg.label} className="legend-item" style={{ cursor: 'pointer' }} onClick={() => setSelectedCategory('All')}>
                        <span className="legend-color-dot" style={{ backgroundColor: seg.color }} />
                        <span>{seg.label} ({seg.value}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Platform Performance ratings & Top issues */}
              <div className="charts-grid-main" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="card">
                  <h3>Platform Performance</h3>
                  <span className="title-caption" style={{ marginBottom: '16px', display: 'block' }}>Average ratings mapped by retail seller channel</span>
                  
                  <div className="issues-list" style={{ gap: '12px' }}>
                    {platformRatingsData.map((plat, idx) => (
                      <div key={idx} className="issue-row" style={{ cursor: 'pointer' }} onClick={() => { setSelectedPlatform(plat.name); setActiveTab('reviews'); }}>
                        <div className="issue-label-row">
                          <span style={{ fontWeight: 600 }}>{plat.name} Rating</span>
                          <span style={{ color: 'var(--color-neutral)', fontWeight: 700 }}>{plat.score} ⭐</span>
                        </div>
                        <div className="bar-track" style={{ height: '6px' }}>
                          <div className="bar-fill" style={{ width: `${(plat.score / 5) * 100}%`, backgroundColor: plat.score >= 4.5 ? 'var(--color-positive)' : plat.score >= 4.0 ? 'var(--color-brand)' : 'var(--color-negative)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3>Top Complaint Topics</h3>
                  <span className="title-caption" style={{ marginBottom: '16px', display: 'block' }}>Mentions counts derived from issues categories</span>

                  <div className="issues-list" style={{ gap: '10px' }}>
                    {[
                      { name: 'Size Problem', count: 823, pct: 100 },
                      { name: 'Late Delivery', count: 712, pct: 86 },
                      { name: 'Product Quality', count: 605, pct: 73 },
                      { name: 'Packaging Damage', count: 381, pct: 46 },
                      { name: 'Wrong Product', count: 197, pct: 24 }
                    ].map((issue, idx) => (
                      <div key={idx} className="issue-row" style={{ cursor: 'pointer' }} onClick={() => { setSelectedCategory(issue.name.includes('Size') ? 'Size' : issue.name.includes('Delivery') ? 'Delivery' : issue.name.includes('Quality') ? 'Product Quality' : issue.name.includes('Packaging') ? 'Packaging' : 'Wrong Product'); setActiveTab('reviews'); }}>
                        <div className="issue-label-row">
                          <span>{issue.name}</span>
                          <span style={{ fontWeight: 600 }}>{issue.count} mentions</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${issue.pct}%`, backgroundColor: idx === 0 ? 'var(--color-negative)' : 'var(--color-brand)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Insights Summary & Recent critical reviews */}
              <div className="charts-grid-main" style={{ gridTemplateColumns: '1fr 1.2fr' }}>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={16} stroke="var(--color-brand)" /> AI Insights Summary</h3>
                    <span className="title-caption">Automated language model analysis indicators</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                    <div style={{ padding: '8px 12px', borderLeft: '3px solid var(--color-negative)', backgroundColor: 'var(--color-negative-bg)', borderRadius: '4px', fontSize: '0.8rem' }}>
                      <strong>Logistics Warning:</strong> Delivery complaints increased by 18% on Myntra Mumbai hubs.
                    </div>
                    <div style={{ padding: '8px 12px', borderLeft: '3px solid var(--color-brand)', backgroundColor: 'var(--color-brand-glow)', borderRadius: '4px', fontSize: '0.8rem' }}>
                      <strong>Product Trend:</strong> Oversized Hoodie has the highest rating (4.8 stars) with positive fabric tags.
                    </div>
                    <div style={{ padding: '8px 12px', borderLeft: '3px solid var(--color-neutral)', backgroundColor: 'var(--color-neutral-bg)', borderRadius: '4px', fontSize: '0.8rem' }}>
                      <strong>Social Score:</strong> Instagram sentiment is dropping; review replies response rate is currently under 80%.
                    </div>
                  </div>

                  <button className="export-btn" style={{ marginTop: '14px' }} onClick={() => setActiveTab('ai-insights')}>More Insights</button>
                </div>

                {/* Critical Reviews Feed */}
                <div className="card">
                  <h3>Recent Critical Reviews</h3>
                  <span className="title-caption" style={{ marginBottom: '14px', display: 'block' }}>1-2 star alerts requiring immediate support reply</span>

                  <div className="table-wrap">
                    <table className="review-table">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Platform</th>
                          <th>Rating</th>
                          <th>Comment</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviews.filter(r => r.rating <= 2 && r.status === 'Unanswered').slice(0, 3).map(rev => (
                          <tr key={rev.id}>
                            <td style={{ fontWeight: 600 }}>{rev.customerName}</td>
                            <td><span className="badge-platform">{rev.platform}</span></td>
                            <td style={{ color: 'var(--color-negative)', fontWeight: 700 }}>{rev.rating} ★</td>
                            <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rev.text}</td>
                            <td className="action-cell">
                              <button onClick={() => { setSelectedReviewForReply(rev); setReplyInput(''); setIsDrawerOpen(true); }}>Reply</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. REVIEWS PAGE COMMAND CENTER */}
          {activeTab === 'reviews' && (
            <div className="reviews-section">
              <div className="page-title-section">
                <div>
                  <h1>Reviews Command Center</h1>
                  <p className="title-caption">Manage feed, filter by date ranges, and compile replies with smart AI help</p>
                </div>
              </div>

              {/* Advanced Filter Header Grid */}
              <div className="filter-bar">
                <div className="filter-input-wrap" style={{ flex: '2 1 200px' }}>
                  <Search size={16} stroke="var(--text-tertiary)" />
                  <input 
                    type="text" 
                    placeholder="Search by customer name or comments..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select className="filter-select" value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)}>
                  <option value="All">All Platforms</option>
                  <option value="Amazon">Amazon</option>
                  <option value="Flipkart">Flipkart</option>
                  <option value="Myntra">Myntra</option>
                  <option value="Google">Google</option>
                  <option value="Instagram">Instagram</option>
                </select>

                <select className="filter-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="All">All Categories</option>
                  <option value="Product Quality">Product Quality</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Comfort">Comfort</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Size">Size</option>
                  <option value="Wrong Product">Wrong Product</option>
                </select>

                <select className="filter-select" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                  <option value="All">All Products</option>
                  <option value="Oversized Hoodie">Oversized Hoodie</option>
                  <option value="Cargo Pant">Cargo Pant</option>
                  <option value="Denim Jacket">Denim Jacket</option>
                </select>

                {/* Date Filters */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input type="date" className="filter-select" value={startDate} onChange={(e) => setStartDate(e.target.value)} title="Start Date" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>to</span>
                  <input type="date" className="filter-select" value={endDate} onChange={(e) => setEndDate(e.target.value)} title="End Date" />
                </div>

                {/* Reset Filters chip row */}
                {(selectedPlatform !== 'All' || selectedCategory !== 'All' || selectedProduct !== 'All' || searchQuery || startDate || endDate || selectedKeyword) && (
                  <div className="active-filters-chips">
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Active Filters:</span>
                    <button className="clear-filters-btn" onClick={handleClearAllFilters}>Reset Filters</button>
                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Found {filteredReviews.length} match reviews</span>
                  </div>
                )}
              </div>

              {/* Feed Table */}
              <div className="table-wrap">
                <table className="review-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Product</th>
                      <th>Platform</th>
                      <th>Rating</th>
                      <th style={{ width: '40%' }}>Review text</th>
                      <th>Sentiment</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                          <HelpCircle size={28} style={{ marginBottom: '8px' }} />
                          <p>No reviews match your filters.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredReviews.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span>{r.customerName}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>{r.date}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.8rem', fontWeight: 500 }}>{r.product}</td>
                          <td><span className="badge-platform">{r.platform}</span></td>
                          <td style={{ color: 'var(--color-neutral)', fontWeight: 700 }}>{r.rating} ⭐</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <p style={{ fontWeight: 500 }}>"{r.text}"</p>
                              {r.replyText && (
                                <div style={{ borderLeft: '3px solid var(--color-positive)', backgroundColor: 'var(--color-positive-bg)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.78rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                                  <strong>Team Reply:</strong> {r.replyText}
                                </div>
                              )}
                            </div>
                          </td>
                          <td><span className={`sentiment-badge ${r.sentiment}`}>{r.sentiment}</span></td>
                          <td>
                            <span className={`status-badge ${r.status.toLowerCase()}`}>
                              {r.status === 'Replied' ? <Check size={10} /> : <Clock size={10} />} {r.status}
                            </span>
                          </td>
                          <td className="action-cell">
                            <button onClick={() => { setSelectedReviewForReply(r); setReplyInput(r.replyText || ''); setIsDrawerOpen(true); }}>
                              {r.status === 'Replied' ? 'Edit Reply' : 'Reply'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. SENTIMENT ANALYTICS */}
          {activeTab === 'sentiment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="page-title-section">
                <div>
                  <h1>Sentiment Analytics</h1>
                  <p className="title-caption">Emotional breakdown and semantic keywords clouds</p>
                </div>
              </div>

              <div className="charts-grid-main" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
                {/* Donut and breakdown metrics */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                  <h3>Sentiment Distribution</h3>
                  
                  <div className="sentiment-donut-wrap" style={{ margin: '30px 0' }}>
                    <svg width="150" height="150" viewBox="0 0 220 220">
                      <circle cx="110" cy="110" r="70" stroke="var(--bg-tertiary)" strokeWidth="18" fill="transparent" />
                      {segments.map((seg, idx) => {
                        let prevAccumulated = 0;
                        for (let j = 0; j < idx; j++) {
                          prevAccumulated += segments[j].value;
                        }
                        const offset = sentimentDonutCircumference - (prevAccumulated / 100) * sentimentDonutCircumference;
                        const strokeLength = (seg.value / 100) * sentimentDonutCircumference;
                        
                        return (
                          <circle 
                            key={seg.label}
                            cx="110"
                            cy="110"
                            r="70"
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="18"
                            strokeDasharray={`${strokeLength} ${sentimentDonutCircumference}`}
                            strokeDashoffset={offset}
                            transform="rotate(-90 110 110)"
                            onMouseEnter={() => setActiveSegment(seg)}
                            onMouseLeave={() => setActiveSegment(null)}
                          />
                        );
                      })}
                    </svg>
                    <div className="donut-inner-text">
                      <span className="donut-pct" style={{ fontSize: '2rem' }}>
                        {activeSegment ? `${activeSegment.value}%` : `${kpis.positivePct}%`}
                      </span>
                      <span className="donut-lbl">
                        {activeSegment ? activeSegment.label : 'Positive'}
                      </span>
                    </div>
                  </div>

                  <div className="sentiment-legend">
                    <div className="legend-item"><span className="legend-color-dot" style={{ backgroundColor: '#4F46E5' }} /> Happy ({kpis.positiveCount} reviews)</div>
                    <div className="legend-item"><span className="legend-color-dot" style={{ backgroundColor: '#A5B4FC' }} /> Neutral ({kpis.neutralCount} reviews)</div>
                    <div className="legend-item"><span className="legend-color-dot" style={{ backgroundColor: '#EF4444' }} /> Frustrated ({kpis.negativeCount} reviews)</div>
                  </div>
                </div>

                {/* Emotion Breakdown list */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3>Emotion Breakdown</h3>
                    <span className="title-caption">Classifying customer emotions</span>
                  </div>

                  <div className="issues-list" style={{ gap: '14px', marginTop: '20px' }}>
                    {[
                      { icon: '😊', label: 'Happy', count: 185, color: '#4F46E5' },
                      { icon: '😐', label: 'Neutral', count: 74, color: '#A5B4FC' },
                      { icon: '😠', label: 'Angry', count: 92, color: '#EF4444' },
                      { icon: '😕', label: 'Frustrated', count: 45, color: '#FB923C' },
                      { icon: '😍', label: 'Loved', count: 120, color: '#ec4899' }
                    ].map((em, idx) => (
                      <div key={idx} className="issue-row">
                        <div className="issue-label-row">
                          <span>{em.icon} {em.label}</span>
                          <span style={{ fontWeight: 600 }}>{em.count} responses</span>
                        </div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${(em.count / 185) * 100}%`, backgroundColor: em.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Word Cloud Tag Lists */}
              <div className="card">
                <h3>Common Keywords cloud</h3>
                <span className="title-caption" style={{ marginBottom: '20px', display: 'block' }}>Click on any tags below to filter reviews in the command center.</span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h5 style={{ color: 'var(--color-positive)', marginBottom: '8px' }}>Positive Word Associations</h5>
                    <div className="keyword-tags-grid">
                      {keywordsData.positive.map((k, i) => (
                        <span 
                          key={i} 
                          className={`kw-tag pos ${selectedKeyword === k.text ? 'active' : ''}`}
                          onClick={() => { setSelectedKeyword(prev => prev === k.text ? null : k.text); setActiveTab('reviews'); }}
                          style={{ margin: '4px' }}
                        >
                          {k.text} <span className="kw-tag-count">{k.count}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 style={{ color: 'var(--color-negative)', marginBottom: '8px' }}>Negative Word Associations</h5>
                    <div className="keyword-tags-grid">
                      {keywordsData.negative.map((k, i) => (
                        <span 
                          key={i} 
                          className={`kw-tag neg ${selectedKeyword === k.text ? 'active' : ''}`}
                          onClick={() => { setSelectedKeyword(prev => prev === k.text ? null : k.text); setActiveTab('reviews'); }}
                          style={{ margin: '4px' }}
                        >
                          {k.text} <span className="kw-tag-count">{k.count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. PRODUCTS HEALTH PAGE */}
          {activeTab === 'products' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="page-title-section">
                <div>
                  <h1>Products Health Table</h1>
                  <p className="title-caption">Track which products are helping or hurting your brand health</p>
                </div>
              </div>

              <div className="charts-grid-main" style={{ gridTemplateColumns: '2fr 1.2fr' }}>
                {/* Product table */}
                <div className="card">
                  <h3>Product Catalog Performance</h3>
                  <div className="table-wrap" style={{ marginTop: '16px' }}>
                    <table className="review-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Total Reviews</th>
                          <th>Avg Rating</th>
                          <th>Primary Sentiment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { id: 'p1', name: 'Oversized Hoodie', volume: 2500, rating: 4.8, sentiment: 'Positive' },
                          { id: 'p2', name: 'Cargo Pant', volume: 1800, rating: 4.2, sentiment: 'Positive' },
                          { id: 'p3', name: 'Denim Jacket', volume: 900, rating: 3.7, sentiment: 'Negative' }
                        ].map((prod) => (
                          <tr 
                            key={prod.id} 
                            style={{ cursor: 'pointer', backgroundColor: selectedProductIdDetail === prod.id ? 'var(--color-brand-glow)' : 'transparent' }}
                            onClick={() => {
                              setSelectedProductIdDetail(prod.id);
                              triggerToast(`Selected ${prod.name} details!`, 'info');
                            }}
                          >
                            <td style={{ fontWeight: 600 }}>{prod.name}</td>
                            <td>{prod.volume} reviews</td>
                            <td style={{ color: 'var(--color-neutral)', fontWeight: 700 }}>{prod.rating} ⭐</td>
                            <td><span className={`sentiment-badge ${prod.sentiment.toLowerCase()}`}>{prod.sentiment}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Product Detail Sidebar widget */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3>Product Detail Overview</h3>
                    <p className="title-caption">Click a product in the table to display context trends.</p>
                  </div>

                  {selectedProductIdDetail ? (
                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <h4 style={{ color: 'var(--color-brand)' }}>
                        {selectedProductIdDetail === 'p1' ? 'Oversized Hoodie' : selectedProductIdDetail === 'p2' ? 'Cargo Pant' : 'Denim Jacket'}
                      </h4>
                      <div>
                        <strong>Rating Trend:</strong> Stable (Projections 4.5 ➔ 4.8)
                      </div>
                      <div>
                        <strong>Sentiment Index:</strong> {selectedProductIdDetail === 'p3' ? 'Negative complains' : 'High satisfaction'}
                      </div>
                      <div style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.8rem', backgroundColor: 'var(--bg-primary)' }}>
                        <strong>Top Complaint:</strong> {selectedProductIdDetail === 'p1' ? 'Sizing runs slightly large' : selectedProductIdDetail === 'p2' ? 'Size mismatch charts' : 'Sewing quality and loose threads'}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                      No product selected.
                    </div>
                  )}

                  <button className="export-btn" style={{ marginTop: '16px' }} onClick={() => { setSelectedProduct(selectedProductIdDetail === 'p1' ? 'Oversized Hoodie' : selectedProductIdDetail === 'p2' ? 'Cargo Pant' : selectedProductIdDetail === 'p3' ? 'Denim Jacket' : 'All'); setActiveTab('reviews'); }}>
                    Filter Reviews
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. ISSUES & ALERTS PAGE */}
          {activeTab === 'issues' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="page-title-section">
                <div>
                  <h1>Issues & Alerts Center</h1>
                  <p className="title-caption">Urgent operational alerts and complaints breakdown log</p>
                </div>
              </div>

              {/* Alert cards list */}
              <div className="issues-list" style={{ gap: '14px' }}>
                <div className="card" style={{ borderLeft: '5px solid var(--color-negative)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="alert-pill">CRITICAL</span>
                    <h4 style={{ marginTop: '6px' }}>🚨 Delivery complaints increased by 24% on Myntra seller portal</h4>
                    <p className="title-caption">Spike in late shipping codes flagged in Mumbai hub.</p>
                  </div>
                  <button className="export-btn" style={{ backgroundColor: 'var(--color-negative)' }} onClick={() => { setSelectedPlatform('Myntra'); setSelectedCategory('Delivery'); setActiveTab('reviews'); }}>Investigate</button>
                </div>

                <div className="card" style={{ borderLeft: '5px solid var(--color-neutral)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="alert-pill" style={{ backgroundColor: 'var(--color-neutral-bg)', color: 'var(--color-neutral)' }}>WARNING</span>
                    <h4 style={{ marginTop: '6px' }}>🚨 Packaging issues increased 18% on Amazon customer feedback</h4>
                    <p className="title-caption">Several reviews mention crushed cardboard shipping cartons.</p>
                  </div>
                  <button className="export-btn" style={{ backgroundColor: 'var(--color-neutral)' }} onClick={() => { setSelectedPlatform('Amazon'); setSelectedCategory('Packaging'); setActiveTab('reviews'); }}>Investigate</button>
                </div>

                <div className="card" style={{ borderLeft: '5px solid var(--color-brand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="alert-pill" style={{ backgroundColor: 'var(--color-brand-glow)', color: 'var(--color-brand)' }}>INFO</span>
                    <h4 style={{ marginTop: '6px' }}>🚨 Cargo Pant average rating dropped below 4.0 stars</h4>
                    <p className="title-caption">Customer reviews are flagging inaccurate size chart specifications.</p>
                  </div>
                  <button className="export-btn" onClick={() => { setSelectedProduct('Cargo Pant'); setSelectedCategory('Size'); setActiveTab('reviews'); }}>Investigate</button>
                </div>
              </div>

              {/* Priority Severity table */}
              <div className="card" style={{ marginTop: '20px' }}>
                <h3>Category Priority Index</h3>
                <div className="table-wrap" style={{ marginTop: '16px' }}>
                  <table className="review-table">
                    <thead>
                      <tr>
                        <th>Category Issue</th>
                        <th>Severity Level</th>
                        <th>Mentions Volume</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Delivery Delay', severity: 'High', volume: 524, status: 'Active' },
                        { name: 'Wrong Size Mismatch', severity: 'Medium', volume: 321, status: 'Active' },
                        { name: 'Packaging Damage', severity: 'High', volume: 184, status: 'Resolved' },
                        { name: 'Wrong Product Sent', severity: 'Low', volume: 120, status: 'Monitoring' }
                      ].map((item, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>
                            <span className="sentiment-badge negative" style={{ backgroundColor: item.severity === 'High' ? 'var(--color-negative-bg)' : item.severity === 'Medium' ? 'var(--color-neutral-bg)' : 'var(--bg-tertiary)', color: item.severity === 'High' ? 'var(--color-negative)' : item.severity === 'Medium' ? 'var(--color-neutral)' : 'var(--text-secondary)' }}>
                              {item.severity}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{item.volume} cases</td>
                          <td>
                            <span className="status-badge replied" style={{ backgroundColor: item.status === 'Resolved' ? 'var(--color-positive-bg)' : 'var(--bg-tertiary)', color: item.status === 'Resolved' ? 'var(--color-positive)' : 'inherit' }}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. AI INSIGHTS VIEW */}
          {activeTab === 'ai-insights' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="page-title-section">
                <div>
                  <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles stroke="var(--color-brand)" /> AI Insights & Executive Actions</h1>
                  <p className="title-caption">Automated brand diagnostic recommendations</p>
                </div>
              </div>

              {/* Large Monthly Summary Card */}
              <div className="card" style={{ borderLeft: '5px solid var(--color-brand)' }}>
                <h3>Monthly Brand Health Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                    <div>✔ Customer satisfaction is stable, maintaining a <strong>{kpis.positivePct}% Positive CSAT</strong>.</div>
                    <div>✔ Amazon remains the strongest platform channel with a <strong>4.6 rating</strong> average.</div>
                    <div>✘ Delivery-related complaints increased by 18% this month on Myntra.</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                    <div>✔ Opportunity: Customers strongly appreciate our <strong>Fabric Quality</strong> and <strong>Comfort</strong> keywords.</div>
                    <div>✘ Friction: Cardboard packaging boxes damage and loose sleeve seams have been flagged.</div>
                  </div>
                </div>
              </div>

              {/* Recommendations list */}
              <div className="charts-grid-main" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
                <div className="card">
                  <h3>SaaS Recommendations</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                    <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <strong style={{ display: 'block', marginBottom: '4px' }}>Recommendation #1: Audit Shipping Partners</strong>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Audit Mumbai-hub couriers to resolve Myntra delivery delay reviews.</p>
                      <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-positive)', fontWeight: 600, marginTop: '4px' }}>Expected Impact: +0.2 avg rating increase</span>
                    </div>

                    <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                      <strong style={{ display: 'block', marginBottom: '4px' }}>Recommendation #2: Update Sizing Catalogs</strong>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Include detailed dimensions for M & XL hoodies on the Myntra partner panel.</p>
                      <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-positive)', fontWeight: 600, marginTop: '4px' }}>Expected Impact: Reduce refund claims by 5.2%</span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3>Opportunity Detection</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    <div>
                      <h5 style={{ color: 'var(--color-positive)', marginBottom: '6px' }}>What customers like:</h5>
                      <ul style={{ paddingLeft: '20px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <li>Fabric stitch durability and soft textures.</li>
                        <li>Hoodie fit style and aesthetics.</li>
                      </ul>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                      <h5 style={{ color: 'var(--color-negative)', marginBottom: '6px' }}>What customers dislike:</h5>
                      <ul style={{ paddingLeft: '20px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <li>Crushed packing boxes during transit.</li>
                        <li>Express shipping timeline delays.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. CUSTOMERS LOYALTY VIEW */}
          {activeTab === 'customers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="page-title-section">
                <div>
                  <h1>Customer Loyalty Directory</h1>
                  <p className="title-caption">Track individual client sentiment patterns and repeat reviewers</p>
                </div>
              </div>

              {/* Customer loyalty cards */}
              <div className="kpi-grid">
                <div className="card kpi-card">
                  <span className="kpi-title">Happy Customers</span>
                  <span className="kpi-val" style={{ color: 'var(--color-positive)' }}>14</span>
                  <span className="kpi-trend neutral">4+ rating reviews</span>
                </div>
                <div className="card kpi-card">
                  <span className="kpi-title">Repeat Reviewers</span>
                  <span className="kpi-val">3</span>
                  <span className="kpi-trend neutral">Multi-platform posts</span>
                </div>
                <div className="card kpi-card">
                  <span className="kpi-title">High Influence</span>
                  <span className="kpi-val" style={{ color: 'var(--color-brand)' }}>5</span>
                  <span className="kpi-trend neutral">Social Media triggers</span>
                </div>
              </div>

              {/* Customer list table */}
              <div className="card">
                <h3>Customer Index</h3>
                <div className="table-wrap" style={{ marginTop: '16px' }}>
                  <table className="review-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Review Posts Count</th>
                        <th>Preferred Channel</th>
                        <th>Average Sentiment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Rahul Sharma', count: 3, platform: 'Amazon', sentiment: 'Positive' },
                        { name: 'Priya Nair', count: 2, platform: 'Flipkart', sentiment: 'Negative' },
                        { name: 'Arjun Kumar', count: 1, platform: 'Myntra', sentiment: 'Positive' },
                        { name: 'Sneha Patel', count: 1, platform: 'Amazon', sentiment: 'Negative' },
                        { name: 'Divya Menon', count: 1, platform: 'Instagram', sentiment: 'Neutral' }
                      ].map((cust, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{cust.name}</td>
                          <td>{cust.count} reviews</td>
                          <td><span className="badge-platform">{cust.platform}</span></td>
                          <td><span className={`sentiment-badge ${cust.sentiment.toLowerCase()}`}>{cust.sentiment}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 8. REPORTS EXPORT PAGE */}
          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="page-title-section">
                <div>
                  <h1>Data Reports & Exports</h1>
                  <p className="title-caption">Build, compile, and schedule review summaries</p>
                </div>
              </div>

              <div className="reports-layout">
                <div className="card">
                  <h3>Available Summary Packages</h3>
                  <div className="export-card-wrap" style={{ marginTop: '16px' }}>
                    <div className="export-tile">
                      <div className="export-tile-info">
                        <div className="export-icon-frame"><FileText size={20} /></div>
                        <div className="export-meta">
                          <h4>Spreadsheet Excel Report</h4>
                          <p>Full tabular rows containing reviews metadata and reply statuses.</p>
                        </div>
                      </div>
                      <button className="export-btn" disabled={exportLoading.csv} onClick={() => handleTriggerExport('csv')}>
                        {exportLoading.csv ? 'Compiling Excel...' : 'Export Excel'}
                      </button>
                    </div>

                    <div className="export-tile">
                      <div className="export-tile-info">
                        <div className="export-icon-frame" style={{ color: '#ef4444' }}><FileText size={20} /></div>
                        <div className="export-meta">
                          <h4>Formatted PDF Executive Summary</h4>
                          <p>Visual PDF layout charts of sentiment distribution and AI summaries.</p>
                        </div>
                      </div>
                      <button className="export-btn" style={{ backgroundColor: '#ef4444' }} disabled={exportLoading.pdf} onClick={() => handleTriggerExport('pdf')}>
                        {exportLoading.pdf ? 'Compiling PDF...' : 'Export PDF'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3>Schedule Reports</h3>
                  <p className="title-caption">Automate executive logs email weekly digest</p>
                  <button className="export-btn" style={{ width: 'fit-content', marginTop: '16px' }} onClick={() => triggerToast('Weekly email schedule configured!', 'info')}>Configure weekly digest</button>
                </div>
              </div>
            </div>
          )}

          {/* 9. SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="page-title-section">
                <div>
                  <h1>System Settings</h1>
                  <p className="title-caption">Manage connected sales portal credentials and sync timers</p>
                </div>
              </div>

              <div className="charts-grid-main" style={{ gridTemplateColumns: '2fr 1fr' }}>
                <div className="card">
                  <h3>Brand Configuration</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Brand Identity Name</label>
                      <input 
                        type="text" 
                        className="filter-select" 
                        value={settingsForm.brandName} 
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, brandName: e.target.value }))}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Alert Notification Email</label>
                      <input 
                        type="email" 
                        className="filter-select" 
                        value={settingsForm.alertEmail} 
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, alertEmail: e.target.value }))}
                      />
                    </div>
                    <button className="export-btn" style={{ width: 'fit-content' }} onClick={() => triggerToast('Profile saved successfully!')}>Save Changes</button>
                  </div>
                </div>

                <div className="card">
                  <h3>API Channel Connections</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    {Object.entries(settingsForm.integrations).map(([name, active]) => (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{name} API</span>
                        <button 
                          className="theme-toggle" 
                          style={{ width: '28px', height: '28px', borderRadius: '4px' }} 
                          onClick={() => {
                            setSettingsForm(prev => {
                              const updated = { ...prev.integrations, [name]: !active };
                              triggerToast(`${name} integration ${!active ? 'enabled' : 'disabled'}!`, 'info');
                              return { ...prev, integrations: updated };
                            });
                          }}
                        >
                          {active ? <Check size={14} stroke="var(--color-positive)" /> : <Lock size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Slide-over Drawer Panel for Review Details & AI Response (Requested by ChatGPT) */}
      <div className={`drawer-backdrop ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)} />
      <div className={`drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div>
            <h3>Review Details</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
              {selectedReviewForReply && `Managing via ${selectedReviewForReply.platform}`}
            </span>
          </div>
          <button className="drawer-close" onClick={() => setIsDrawerOpen(false)}><X size={20} /></button>
        </div>

        {selectedReviewForReply && (
          <div className="drawer-body">
            {/* Customer Details info box */}
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', backgroundColor: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.95rem' }}>{selectedReviewForReply.customerName}</strong>
                <span className={`sentiment-badge ${selectedReviewForReply.sentiment}`}>{selectedReviewForReply.sentiment}</span>
              </div>
              <div className="rating-stars" style={{ marginBottom: '8px', fontSize: '0.9rem' }}>
                {'★'.repeat(selectedReviewForReply.rating)}
                {'☆'.repeat(5 - selectedReviewForReply.rating)}
              </div>
              <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                "{selectedReviewForReply.text}"
              </p>
              <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                Product: <strong>{selectedReviewForReply.product}</strong> | Category: <strong>{selectedReviewForReply.category}</strong>
              </div>
            </div>

            {/* AI Analysis Reasoner box (Requested by ChatGPT) */}
            <div style={{ border: '1px dashed var(--color-brand)', borderRadius: '8px', padding: '14px', backgroundColor: 'var(--color-brand-glow)' }}>
              <h5 style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-brand)', marginBottom: '8px' }}>
                <Sparkles size={14} /> AI Analysis
              </h5>
              <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Sentiment: <strong>{selectedReviewForReply.rating >= 4 ? 'Positive' : selectedReviewForReply.rating === 3 ? 'Neutral' : 'Negative'}</strong></div>
                <div>Category Trigger: <strong>{selectedReviewForReply.category}</strong></div>
                <div>Tone Target: 
                  <span className={`sentiment-badge ${selectedReviewForReply.rating >= 4 ? 'positive' : 'negative'}`} style={{ marginLeft: '6px', fontSize: '0.7rem' }}>
                    {selectedReviewForReply.rating === 5 ? 'Grateful & Excited' : selectedReviewForReply.rating === 4 ? 'Appreciative & Positive' : selectedReviewForReply.rating === 3 ? 'Constructive' : 'Empathetic & Apologetic'}
                  </span>
                </div>
              </div>
            </div>

            {/* Draft button helper */}
            <button className="ai-helper-btn" onClick={handleAIDraftResponse}>
              ✨ Draft Response with Smart AI
            </button>

            {/* Reply inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Your Reply Message</label>
              <textarea 
                className="reply-textarea" 
                placeholder="Compose your reply draft..."
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="drawer-footer">
          <button className="theme-toggle" style={{ borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', width: 'auto', padding: '0 16px', fontSize: '0.85rem' }} onClick={() => setIsDrawerOpen(false)}>Cancel</button>
          <button className="export-btn" onClick={handleSubmitReply}>Send Reply</button>
        </div>
      </div>
    </div>
  );
}

export default App;
