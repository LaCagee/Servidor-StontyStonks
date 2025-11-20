import { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Download, Filter, Calendar, BarChart3, TrendingUp, PieChart, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatCLP } from '../utils/currency';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://stonky-backend.blackdune-587dd75b.westus3.azurecontainerapps.io'}/api`;

export default function Reports() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [filters, setFilters] = useState({
    period: 'month',
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  });
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const token = localStorage.getItem('token');
  const axiosConfig = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  // Cargar el balance desde el dashboard
  const loadBalance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/overview`, axiosConfig);
      if (response.data.overview?.balance) {
        setBalance(response.data.overview.balance.currentBalance || 0);
      }
    } catch (err) {
      console.error('Error al cargar balance:', err);
    }
  };

  useEffect(() => {
    loadBalance();
    const loadReportData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          period: filters.period,
          ...(filters.period === 'custom' && {
            startDate: filters.startDate,
            endDate: filters.endDate
          })
        });

        const response = await axios.get(`${API_BASE_URL}/reports/summary?${params}`, axiosConfig);

        if (response.data) {
          setReportData(response.data);
        }
      } catch (err) {
        console.error('Error al cargar reportes:', err);
        // En caso de error, mantener datos vacíos
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [filters]);

  const handleExportReport = (format) => {
    // TODO: Implementar exportación de reportes
    console.log(`Exportando reporte en formato: ${format}`);
  };


  if (loading) {
    return (
      <MainLayout title="Reportes" balance={balance}>
        <div className="loading-screen">
          <BarChart3 className="loading-icon" />
          <p>Generando reportes...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Reportes y Análisis" balance={balance}>
      <div className="reports-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-info">
            <h1 className="page-title">Reportes Financieros</h1>
            <p className="page-subtitle">Análisis detallado de tus finanzas</p>
          </div>
          
          <div className="header-actions">
            <div className="filters">
              <Calendar className="filter-icon" />
              <select 
                value={filters.period}
                onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              >
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="quarter">Este trimestre</option>
                <option value="year">Este año</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            
            <Button variant="secondary">
              <Filter className="icon-sm" />
              Filtros Avanzados
            </Button>
            
            <Button variant="primary" onClick={() => handleExportReport('pdf')}>
              <Download className="icon-sm" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Resumen Ejecutivo Mejorado */}
        <div className="executive-summary">
          <Card className="summary-card">
            <h3>Resumen Ejecutivo del Periodo</h3>
            <div className="summary-grid">
              <div className="summary-item summary-item-income">
                <div className="summary-header">
                  <span className="label">Ingresos Totales</span>
                  <div className="trend-badge positive">
                    <ArrowUpRight className="trend-icon" />
                    <span>{reportData.summary.incomeGrowth}%</span>
                  </div>
                </div>
                <span className="value income">{formatCLP(reportData.summary.totalIncome)}</span>
                <span className="sublabel">vs periodo anterior</span>
              </div>
              
              <div className="summary-item summary-item-expense">
                <div className="summary-header">
                  <span className="label">Gastos Totales</span>
                  <div className="trend-badge negative">
                    <ArrowDownLeft className="trend-icon" />
                    <span>{Math.abs(reportData.summary.expenseGrowth)}%</span>
                  </div>
                </div>
                <span className="value expense">{formatCLP(reportData.summary.totalExpenses)}</span>
                <span className="sublabel">vs periodo anterior</span>
              </div>
              
              <div className="summary-item summary-item-savings">
                <div className="summary-header">
                  <span className="label">Ahorro Neto</span>
                  <TrendingUp className="header-icon" />
                </div>
                <span className="value savings">{formatCLP(reportData.summary.netSavings)}</span>
                <span className="sublabel">disponible para invertir</span>
              </div>
              
              <div className="summary-item summary-item-rate">
                <div className="summary-header">
                  <span className="label">Tasa de Ahorro</span>
                  <PieChart className="header-icon" />
                </div>
                <span className="value rate">{reportData.summary.savingsRate}%</span>
                <span className="sublabel">del ingreso total</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Sección de Gráficos Principal */}
        <div className="reports-grid">
          {/* Distribución de Gastos */}
          <Card title="Distribución de Gastos por Categoría" className="chart-card">
            <div className="categories-list">
              {reportData.expensesByCategory.map((item, index) => (
                <div 
                  key={index} 
                  className="category-item"
                  onMouseEnter={() => setHoveredCategory(index)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div className="category-info">
                    <div className="category-header">
                      <span className="category-name">{item.category}</span>
                      <div className={`category-trend ${item.trend > 0 ? 'up' : 'down'}`}>
                        {item.trend > 0 ? <ArrowUpRight className="mini-icon" /> : <ArrowDownLeft className="mini-icon" />}
                        <span>{Math.abs(item.trend)}%</span>
                      </div>
                    </div>
                    <span className="category-amount">{formatCLP(item.amount)}</span>
                  </div>
                  <div className="category-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${item.percentage}%`,
                          opacity: hoveredCategory === null || hoveredCategory === index ? 1 : 0.3,
                          transition: 'opacity 0.2s ease'
                        }}
                      ></div>
                    </div>
                    <span className="percentage">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="chart-footer">
              <span className="footer-text">Gasto total: {formatCLP(reportData.summary.totalExpenses)}</span>
            </div>
          </Card>

          {/* Tendencia Mensual Mejorada */}
          <Card title="Tendencia de Ingresos vs Gastos" className="chart-card">
            <div className="trend-chart">
              {reportData.monthlyTrend.map((month, index) => (
                <div key={index} className="trend-item">
                  <span className="month-label">{month.month}</span>
                  <div className="trend-bars">
                    <div 
                      className="trend-bar income"
                      style={{ height: `${(month.income / 500000) * 100}%` }}
                      title={`Ingresos: ${formatCLP(month.income)}`}
                    ></div>
                    <div 
                      className="trend-bar expense"
                      style={{ height: `${(month.expenses / 500000) * 100}%` }}
                      title={`Gastos: ${formatCLP(month.expenses)}`}
                    ></div>
                  </div>
                  <div className="month-details">
                    <span className="savings-badge">${(month.savings / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color income"></div>
                <span>Ingresos</span>
              </div>
              <div className="legend-item">
                <div className="legend-color expense"></div>
                <span>Gastos</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Tarjetas de Información Adicional */}
        <div className="info-cards-grid">
          <Card className="info-card">
            <div className="info-card-content">
              <div className="info-icon income">
                <ArrowUpRight />
              </div>
              <div className="info-text">
                <span className="info-label">Categoría con Mayor Gasto</span>
                <span className="info-value">{reportData.expensesByCategory[0].category}</span>
                <span className="info-sublabel">{reportData.expensesByCategory[0].percentage}% del total</span>
              </div>
            </div>
          </Card>

          <Card className="info-card">
            <div className="info-card-content">
              <div className="info-icon savings">
                <TrendingUp />
              </div>
              <div className="info-text">
                <span className="info-label">Eficiencia Financiera</span>
                <span className="info-value">{reportData.summary.savingsRate}%</span>
                <span className="info-sublabel">Excelente desempeño</span>
              </div>
            </div>
          </Card>

          <Card className="info-card">
            <div className="info-card-content">
              <div className="info-icon expense">
                <ArrowDownLeft />
              </div>
              <div className="info-text">
                <span className="info-label">Ahorro Acumulado</span>
                <span className="info-value">{formatCLP(reportData.summary.netSavings)}</span>
                <span className="info-sublabel">En este periodo</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Reportes Rápidos Mejorados */}
        <div className="additional-reports">
          <Card title="Reportes Rápidos">
            <div className="reports-list">
              <Button variant="ghost" full className="report-button">
                <BarChart3 className="report-icon" />
                Estado de Flujo de Caja
              </Button>
              <Button variant="ghost" full className="report-button">
                <TrendingUp className="report-icon" />
                Análisis de Hábitos de Gasto
              </Button>
              <Button variant="ghost" full className="report-button">
                <Filter className="report-icon" />
                Proyección de Ahorros
              </Button>
              <Button variant="ghost" full className="report-button">
                <Calendar className="report-icon" />
                Comparativa Anual
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}