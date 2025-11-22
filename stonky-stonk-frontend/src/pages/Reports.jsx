import { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Download, Filter, Calendar, BarChart3, TrendingUp, PieChart, ArrowUpRight, ArrowDownLeft, X, DollarSign } from 'lucide-react';
import { formatCLP } from '../utils/currency'; // mantener pa retrocompatibilidad
import { useSettings } from '../context/SettingsContext'; // pa usar moneda del usuario
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://stonky-backend.blackdune-587dd75b.westus3.azurecontainerapps.io'}/api`;

export default function Reports() {
  // usar el contexto de configuraciones pa formatear con la moneda correcta
  const { formatMoney, currency } = useSettings();

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [filters, setFilters] = useState({
    period: 'month',
    startDate: '',
    endDate: ''
  });
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [reportModalData, setReportModalData] = useState(null);

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
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [filters]);

  // EXPORTAR A PDF (ahora usa la moneda del usuario)
  const handleExportReport = async (format) => {
    try {
      if (!reportData) {
        alert('No hay datos de reporte disponibles para exportar');
        return;
      }

      if (format === 'pdf') {
        console.log('📄 Generando PDF...');
        const doc = new jsPDF();

        // Título del reporte
        doc.setFontSize(20);
        doc.text('Stonky Stonks - Reporte Financiero', 14, 20);

        doc.setFontSize(10);
        doc.text(`Período: ${reportData.period?.startDate || 'N/A'} - ${reportData.period?.endDate || 'N/A'}`, 14, 30);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 14, 35);
        doc.text(`Moneda: ${currency}`, 14, 40); // mostrar la moneda usada

        // Línea separadora
        doc.setLineWidth(0.5);
        doc.line(14, 45, 196, 45);

        // Resumen Ejecutivo
        doc.setFontSize(14);
        doc.text('Resumen Ejecutivo', 14, 55);

        doc.setFontSize(10);
        let yPos = 65;
        doc.text(`Ingresos Totales: ${formatMoney(reportData.summary?.totalIncome || 0)}`, 14, yPos);
        yPos += 7;
        doc.text(`Gastos Totales: ${formatMoney(reportData.summary?.totalExpenses || 0)}`, 14, yPos);
        yPos += 7;
        doc.text(`Ahorro Neto: ${formatMoney(reportData.summary?.netSavings || 0)}`, 14, yPos);
        yPos += 7;
        doc.text(`Tasa de Ahorro: ${reportData.summary?.savingsRate || 0}%`, 14, yPos);
        yPos += 7;
        doc.text(`Crecimiento Ingresos: ${reportData.summary?.incomeGrowth || 0}%`, 14, yPos);
        yPos += 7;
        doc.text(`Crecimiento Gastos: ${reportData.summary?.expenseGrowth || 0}%`, 14, yPos);

        // Gastos por Categoría (Tabla)
        yPos += 15;
        doc.setFontSize(14);
        doc.text('Distribución de Gastos por Categoría', 14, yPos);
        yPos += 5;

        const categoryData = reportData.expensesByCategory?.map(cat => [
          cat.category,
          formatMoney(cat.amount),
          `${cat.percentage}%`
        ]) || [];

        doc.autoTable({
          startY: yPos,
          head: [['Categoría', 'Monto', 'Porcentaje']],
          body: categoryData,
          theme: 'grid',
          headStyles: { fillColor: [52, 211, 153] },
          styles: { fontSize: 9 }
        });

        // Tendencia Mensual
        yPos = doc.lastAutoTable.finalY + 15;

        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.text('Tendencia Mensual', 14, yPos);
        yPos += 5;

        const trendData = reportData.monthlyTrend?.map(month => [
          month.month,
          formatMoney(month.income),
          formatMoney(month.expenses),
          formatMoney(month.savings)
        ]) || [];

        doc.autoTable({
          startY: yPos,
          head: [['Mes', 'Ingresos', 'Gastos', 'Ahorro']],
          body: trendData,
          theme: 'grid',
          headStyles: { fillColor: [52, 211, 153] },
          styles: { fontSize: 9 }
        });

        // Guardar PDF
        console.log('💾 Guardando PDF...');
        doc.save(`reporte-stonky-${new Date().toISOString().split('T')[0]}.pdf`);

        alert(`✅ Reporte PDF generado exitosamente en ${currency}`);
      }
    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
      alert(`❌ Error al generar el PDF: ${error.message}\n\nRevisa la consola para más detalles.`);
    }
  };

  // FILTROS AVANZADOS
  const handleApplyAdvancedFilters = () => {
    setShowAdvancedFilters(false);
    // Los filtros ya se aplican automáticamente con el useEffect
  };

  // REPORTES RÁPIDOS
  const handleQuickReport = async (reportType) => {
    setLoading(true);
    try {
      let data = null;

      switch (reportType) {
        case 'cashflow':
          // Estado de Flujo de Caja
          data = {
            title: 'Estado de Flujo de Caja',
            description: 'Análisis detallado del flujo de efectivo',
            sections: [
              {
                title: 'Entradas de Efectivo',
                value: formatMoney(reportData?.summary?.totalIncome || 0),
                items: [
                  { label: 'Ingresos del período', value: formatMoney(reportData?.summary?.totalIncome || 0) },
                  { label: 'Crecimiento vs período anterior', value: `${reportData?.summary?.incomeGrowth || 0}%` }
                ]
              },
              {
                title: 'Salidas de Efectivo',
                value: formatMoney(reportData?.summary?.totalExpenses || 0),
                items: [
                  { label: 'Gastos del período', value: formatMoney(reportData?.summary?.totalExpenses || 0) },
                  { label: 'Crecimiento vs período anterior', value: `${reportData?.summary?.expenseGrowth || 0}%` }
                ]
              },
              {
                title: 'Flujo Neto',
                value: formatMoney(reportData?.summary?.netSavings || 0),
                items: [
                  { label: 'Saldo final del período', value: formatMoney(reportData?.summary?.netSavings || 0) },
                  { label: 'Tasa de ahorro', value: `${reportData?.summary?.savingsRate || 0}%` }
                ]
              }
            ]
          };
          break;

        case 'spending-habits':
          // Análisis de Hábitos de Gasto
          const topCategory = reportData?.expensesByCategory?.[0] || {};
          data = {
            title: 'Análisis de Hábitos de Gasto',
            description: 'Patrones identificados en tus gastos',
            sections: [
              {
                title: 'Categoría Principal',
                value: topCategory.category || 'N/A',
                items: [
                  { label: 'Monto gastado', value: formatMoney(topCategory.amount || 0) },
                  { label: 'Porcentaje del total', value: `${topCategory.percentage || 0}%` }
                ]
              },
              {
                title: 'Distribución de Gastos',
                value: `${reportData?.expensesByCategory?.length || 0} categorías`,
                items: reportData?.expensesByCategory?.slice(0, 5).map(cat => ({
                  label: cat.category,
                  value: formatMoney(cat.amount)
                })) || []
              },
              {
                title: 'Recomendaciones',
                value: 'Optimización sugerida',
                items: [
                  { label: 'Reducir gastos en categoría principal', value: 'Ahorro potencial: 15%' },
                  { label: 'Revisar gastos recurrentes', value: 'Identificar suscripciones innecesarias' }
                ]
              }
            ]
          };
          break;

        case 'savings-projection':
          // Proyección de Ahorros
          const monthlySavings = reportData?.summary?.netSavings || 0;
          const projectedSavings3m = monthlySavings * 3;
          const projectedSavings6m = monthlySavings * 6;
          const projectedSavings12m = monthlySavings * 12;

          data = {
            title: 'Proyección de Ahorros',
            description: 'Estimación basada en tus hábitos actuales',
            sections: [
              {
                title: 'Ahorro Mensual Actual',
                value: formatMoney(monthlySavings),
                items: [
                  { label: 'Tasa de ahorro', value: `${reportData?.summary?.savingsRate || 0}%` },
                  { label: 'Base para proyección', value: 'Últimos 30 días' }
                ]
              },
              {
                title: 'Proyecciones',
                value: 'Escenario conservador',
                items: [
                  { label: '3 meses', value: formatMoney(projectedSavings3m) },
                  { label: '6 meses', value: formatMoney(projectedSavings6m) },
                  { label: '12 meses', value: formatMoney(projectedSavings12m) }
                ]
              },
              {
                title: 'Optimización Posible',
                value: 'Con ajustes sugeridos',
                items: [
                  { label: '3 meses (+15%)', value: formatMoney(projectedSavings3m * 1.15) },
                  { label: '6 meses (+15%)', value: formatMoney(projectedSavings6m * 1.15) },
                  { label: '12 meses (+15%)', value: formatMoney(projectedSavings12m * 1.15) }
                ]
              }
            ]
          };
          break;

        case 'annual-comparison':
          // Comparativa Anual
          data = {
            title: 'Comparativa Anual',
            description: 'Análisis del rendimiento año a año',
            sections: [
              {
                title: 'Período Actual',
                value: `${reportData?.period?.startDate || ''} - ${reportData?.period?.endDate || ''}`,
                items: [
                  { label: 'Ingresos', value: formatMoney(reportData?.summary?.totalIncome || 0) },
                  { label: 'Gastos', value: formatMoney(reportData?.summary?.totalExpenses || 0) },
                  { label: 'Ahorro', value: formatMoney(reportData?.summary?.netSavings || 0) }
                ]
              },
              {
                title: 'Crecimiento',
                value: 'Variación vs período anterior',
                items: [
                  { label: 'Crecimiento en ingresos', value: `${reportData?.summary?.incomeGrowth || 0}%` },
                  { label: 'Variación en gastos', value: `${reportData?.summary?.expenseGrowth || 0}%` },
                  { label: 'Mejora en tasa de ahorro', value: `${((reportData?.summary?.savingsRate || 0) - 10).toFixed(1)}%` }
                ]
              },
              {
                title: 'Tendencia',
                value: reportData?.monthlyTrend?.length > 0 ? 'Positiva' : 'Estable',
                items: [
                  { label: 'Meses analizados', value: `${reportData?.monthlyTrend?.length || 0}` },
                  { label: 'Promedio mensual ingresos', value: formatMoney((reportData?.summary?.totalIncome || 0) / (reportData?.monthlyTrend?.length || 1)) },
                  { label: 'Promedio mensual gastos', value: formatMoney((reportData?.summary?.totalExpenses || 0) / (reportData?.monthlyTrend?.length || 1)) }
                ]
              }
            ]
          };
          break;
      }

      setReportModalData(data);
      setActiveReport(reportType);
    } catch (error) {
      console.error('Error generating quick report:', error);
      alert('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !reportData) {
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

            <Button variant="secondary" onClick={() => setShowAdvancedFilters(true)}>
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
        {reportData && (
          <>
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
                    <span className="value income">{formatMoney(reportData.summary.totalIncome)}</span>
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
                    <span className="value expense">{formatMoney(reportData.summary.totalExpenses)}</span>
                    <span className="sublabel">vs periodo anterior</span>
                  </div>

                  <div className="summary-item summary-item-savings">
                    <div className="summary-header">
                      <span className="label">Ahorro Neto</span>
                      <TrendingUp className="header-icon" />
                    </div>
                    <span className="value savings">{formatMoney(reportData.summary.netSavings)}</span>
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
                        <span className="category-amount">{formatMoney(item.amount)}</span>
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
                  <span className="footer-text">Gasto total: {formatMoney(reportData.summary.totalExpenses)}</span>
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
                          title={`Ingresos: ${formatMoney(month.income)}`}
                        ></div>
                        <div
                          className="trend-bar expense"
                          style={{ height: `${(month.expenses / 500000) * 100}%` }}
                          title={`Gastos: ${formatMoney(month.expenses)}`}
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
                    <span className="info-value">{reportData.expensesByCategory[0]?.category || 'N/A'}</span>
                    <span className="info-sublabel">{reportData.expensesByCategory[0]?.percentage || 0}% del total</span>
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
                    <span className="info-value">{formatMoney(reportData.summary.netSavings)}</span>
                    <span className="info-sublabel">En este periodo</span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Reportes Rápidos Mejorados */}
        <div className="additional-reports">
          <Card title="Reportes Rápidos">
            <div className="reports-list">
              <Button
                variant="ghost"
                full
                className="report-button"
                onClick={() => handleQuickReport('cashflow')}
              >
                <BarChart3 className="report-icon" />
                Estado de Flujo de Caja
              </Button>
              <Button
                variant="ghost"
                full
                className="report-button"
                onClick={() => handleQuickReport('spending-habits')}
              >
                <TrendingUp className="report-icon" />
                Análisis de Hábitos de Gasto
              </Button>
              <Button
                variant="ghost"
                full
                className="report-button"
                onClick={() => handleQuickReport('savings-projection')}
              >
                <Filter className="report-icon" />
                Proyección de Ahorros
              </Button>
              <Button
                variant="ghost"
                full
                className="report-button"
                onClick={() => handleQuickReport('annual-comparison')}
              >
                <Calendar className="report-icon" />
                Comparativa Anual
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de Filtros Avanzados */}
      {showAdvancedFilters && (
        <Modal
          title="Filtros Avanzados"
          onClose={() => setShowAdvancedFilters(false)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Período
              </label>
              <select
                value={filters.period}
                onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="quarter">Este trimestre</option>
                <option value="year">Este año</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {filters.period === 'custom' && (
              <>
                <Input
                  label="Fecha de inicio"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
                <Input
                  label="Fecha de fin"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                variant="primary"
                full
                onClick={handleApplyAdvancedFilters}
              >
                Aplicar Filtros
              </Button>
              <Button
                variant="secondary"
                full
                onClick={() => setShowAdvancedFilters(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Reportes Rápidos */}
      {activeReport && reportModalData && (
        <Modal
          title={reportModalData.title}
          onClose={() => {
            setActiveReport(null);
            setReportModalData(null);
          }}
        >
          <div className="space-y-6">
            <p className="text-gray-400">{reportModalData.description}</p>

            {reportModalData.sections.map((section, idx) => (
              <div key={idx} className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-white">{section.title}</h4>
                  <span className="text-xl font-bold text-green-400">{section.value}</span>
                </div>
                <div className="space-y-2">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex justify-between text-sm">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-white font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Button
              variant="primary"
              full
              onClick={() => {
                setActiveReport(null);
                setReportModalData(null);
              }}
            >
              Cerrar
            </Button>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}
