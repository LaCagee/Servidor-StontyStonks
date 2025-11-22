import { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ProjectionsChart from '../components/charts/ProjectionsChart';
import { TrendingUp, AlertTriangle, Lightbulb, Target, ChevronRight, CheckCircle, Clock, Zap, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://stonky-backend.blackdune-587dd75b.westus3.azurecontainerapps.io'}/api`;

export default function Analysis() {
  const { formatMoney } = useSettings();
  const [insights, setInsights] = useState([]);
  const [projections, setProjections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [expandedInsight, setExpandedInsight] = useState(null);
  const [actionedInsights, setActionedInsights] = useState(new Set());
  const [postponedInsights, setPostponedInsights] = useState(new Set());
  const [dismissedInsights, setDismissedInsights] = useState(new Set());
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);

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
    const loadInsights = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/analysis/insights`, axiosConfig);
        if (response.data.insights) {
          setInsights(response.data.insights);
        }
      } catch (err) {
        console.error('Error al cargar insights:', err);
        // Mantener array vacío en caso de error
        setInsights([]);
      } finally {
        setLoading(false);
      }
    };

    const loadProjections = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/analysis/projections`, axiosConfig);
        if (response.data) {
          setProjections(response.data);
        }
      } catch (err) {
        console.error('Error al cargar proyecciones:', err);
        setProjections(null);
      }
    };

    loadInsights();
    loadProjections();

    // Cargar insights guardados en localStorage
    const savedActioned = localStorage.getItem('actionedInsights');
    const savedPostponed = localStorage.getItem('postponedInsights');
    const savedDismissed = localStorage.getItem('dismissedInsights');

    if (savedActioned) setActionedInsights(new Set(JSON.parse(savedActioned)));
    if (savedPostponed) setPostponedInsights(new Set(JSON.parse(savedPostponed)));
    if (savedDismissed) setDismissedInsights(new Set(JSON.parse(savedDismissed)));
  }, []);

  const getInsightIcon = (type) => {
    switch (type) {
      case 'savings_opportunity': return <Lightbulb className="insight-icon" />;
      case 'spending_alert': return <AlertTriangle className="insight-icon" />;
      case 'trend_analysis': return <TrendingUp className="insight-icon" />;
      default: return <Target className="insight-icon" />;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'savings_opportunity': return 'success';
      case 'spending_alert': return 'warning';
      case 'trend_analysis': return 'info';
      default: return 'default';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical': return { label: 'Crítico', color: 'critical' };
      case 'high': return { label: 'Alto', color: 'high' };
      case 'medium': return { label: 'Medio', color: 'medium' };
      default: return { label: 'Bajo', color: 'low' };
    }
  };

  // FUNCIONALIDADES DE BOTONES
  const handleTakeAction = (insight) => {
    setSelectedInsight(insight);
    setShowActionModal(true);
  };

  const confirmTakeAction = () => {
    if (selectedInsight) {
      const newActioned = new Set(actionedInsights);
      newActioned.add(selectedInsight.id);
      setActionedInsights(newActioned);
      localStorage.setItem('actionedInsights', JSON.stringify([...newActioned]));

      // Remover de postponed si estaba ahí
      const newPostponed = new Set(postponedInsights);
      newPostponed.delete(selectedInsight.id);
      setPostponedInsights(newPostponed);
      localStorage.setItem('postponedInsights', JSON.stringify([...newPostponed]));

      setShowActionModal(false);
      setSelectedInsight(null);
    }
  };

  const handlePostpone = (insightId) => {
    const newPostponed = new Set(postponedInsights);
    newPostponed.add(insightId);
    setPostponedInsights(newPostponed);
    localStorage.setItem('postponedInsights', JSON.stringify([...newPostponed]));

    // Mostrar feedback al usuario
    const insight = insights.find(i => i.id === insightId);
    if (insight) {
      alert(`Insight "${insight.title}" pospuesto. Lo verás nuevamente mañana.`);
    }
  };

  const handleDismiss = (insightId) => {
    if (window.confirm('¿Estás seguro de que quieres descartar este insight? No lo volverás a ver.')) {
      const newDismissed = new Set(dismissedInsights);
      newDismissed.add(insightId);
      setDismissedInsights(newDismissed);
      localStorage.setItem('dismissedInsights', JSON.stringify([...newDismissed]));
    }
  };

  // Filtrar insights descartados
  const visibleInsights = insights.filter(i => !dismissedInsights.has(i.id));

  const totalActionable = visibleInsights.filter(i => i.actionable && !actionedInsights.has(i.id)).length;
  const potentialSavings = visibleInsights
    .filter(i => !actionedInsights.has(i.id))
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <MainLayout title="Análisis" balance={balance}>
      <div className="analysis-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-info">
            <h1 className="page-title">Análisis Inteligente</h1>
            <p className="page-subtitle">Insights y recomendaciones basadas en tus datos</p>
          </div>
        </div>

        {/* Métricas Principales Mejoradas */}
        <div className="analysis-metrics">
          <Card variant="stonky-primary" className="metric-card metric-card-primary">
            <div className="metric-content">
              <div className="metric-icon-container">
                <TrendingUp className="metric-icon" />
              </div>
              <div className="metric-info">
                <span className="metric-label">Insights Activos</span>
                <span className="metric-value">{visibleInsights.length}</span>
                <span className="metric-description">Recomendaciones para mejorar</span>
              </div>
              <div className="metric-badge">{totalActionable} accionables</div>
            </div>
          </Card>

          <Card variant="stonky-success" className="metric-card metric-card-success">
            <div className="metric-content">
              <div className="metric-icon-container">
                <Lightbulb className="metric-icon" />
              </div>
              <div className="metric-info">
                <span className="metric-label">Ahorro Potencial</span>
                <span className="metric-value">{formatMoney(potentialSavings)}</span>
                <span className="metric-description">Oportunidades identificadas</span>
              </div>
              <div className="metric-badge">Este mes</div>
            </div>
          </Card>

          <Card variant="stonky-warning" className="metric-card metric-card-warning">
            <div className="metric-content">
              <div className="metric-icon-container">
                <AlertTriangle className="metric-icon" />
              </div>
              <div className="metric-info">
                <span className="metric-label">Alertas Críticas</span>
                <span className="metric-value">
                  {visibleInsights.filter(i => i.priority === 'critical' && !actionedInsights.has(i.id)).length}
                </span>
                <span className="metric-description">Que requieren atención</span>
              </div>
              <div className="metric-badge">Urgente</div>
            </div>
          </Card>
        </div>

        {/* Insights y Recomendaciones */}
        <Card title="Insights Destacados" className="insights-section">
          {loading ? (
            <div className="loading-state">
              <Zap className="loading-icon" />
              <p>Analizando tus datos financieros...</p>
            </div>
          ) : visibleInsights.length === 0 ? (
            <div className="empty-state">
              <Target className="empty-icon" />
              <h3>No hay insights disponibles</h3>
              <p>Continúa usando la aplicación para generar análisis personalizados</p>
            </div>
          ) : (
            <div className="insights-list">
              {visibleInsights.map((insight, index) => {
                const isExpanded = expandedInsight === insight.id;
                const priorityBadge = getPriorityBadge(insight.priority);
                const isActioned = actionedInsights.has(insight.id);
                const isPostponed = postponedInsights.has(insight.id);

                return (
                  <div
                    key={insight.id}
                    className={`insight-item ${getInsightColor(insight.type)} priority-${insight.priority} ${isActioned ? 'actioned' : ''} ${isPostponed ? 'postponed' : ''}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="insight-header">
                      <div className="insight-icon-container">
                        <div className="icon-wrapper">
                          {isActioned ? <CheckCircle className="insight-icon text-green-500" /> : getInsightIcon(insight.type)}
                        </div>
                      </div>

                      <div className="insight-title">
                        <div className="title-row">
                          <h4>{insight.title}</h4>
                          {isActioned && (
                            <span className="text-xs bg-green-500 bg-opacity-20 text-green-400 px-2 py-1 rounded">
                              Completado
                            </span>
                          )}
                          {isPostponed && (
                            <span className="text-xs bg-yellow-500 bg-opacity-20 text-yellow-400 px-2 py-1 rounded">
                              Pospuesto
                            </span>
                          )}
                          <div className="priority-badge" data-priority={priorityBadge.color}>
                            {priorityBadge.label}
                          </div>
                        </div>
                        <span className="confidence">
                          Confianza: {(insight.confidence * 100).toFixed(0)}%
                        </span>
                      </div>

                      {insight.amount > 0 && (
                        <div className="insight-amount">
                          <span className="amount-label">Impacto</span>
                          <span className="amount-value">{formatMoney(insight.amount)}</span>
                        </div>
                      )}

                      <button
                        className="expand-button"
                        onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                      >
                        <ChevronRight className={`expand-icon ${isExpanded ? 'expanded' : ''}`} />
                      </button>
                    </div>

                    <div className="insight-content">
                      <p className="insight-message">{insight.message}</p>

                      <div className="insight-meta">
                        <span className="meta-item">
                          <span className="meta-label">Categoría:</span>
                          {insight.category}
                        </span>
                        <span className="meta-item">
                          <span className="meta-label">Plazo:</span>
                          {insight.timeframe}
                        </span>
                        <span className="meta-item">
                          <span className="meta-label">Impacto:</span>
                          {insight.impact}
                        </span>
                      </div>
                    </div>

                    {/* Contenido Expandido */}
                    {isExpanded && (
                      <div className="insight-expanded">
                        <div className="expanded-section">
                          <h5>Recomendación</h5>
                          <p>{insight.recommendation}</p>
                        </div>

                        <div className="expanded-section">
                          <h5>Análisis Detallado</h5>
                          <div className="analysis-grid">
                            <div className="analysis-item">
                              <span className="analysis-label">Confianza</span>
                              <div className="confidence-bar">
                                <div
                                  className="confidence-fill"
                                  style={{ width: `${insight.confidence * 100}%` }}
                                ></div>
                              </div>
                              <span className="analysis-value">{(insight.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div className="analysis-item">
                              <span className="analysis-label">Impacto Potencial</span>
                              <span className="impact-value">{insight.impact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {insight.actionable && !isActioned && (
                      <div className="insight-actions">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleTakeAction(insight)}
                        >
                          <CheckCircle className="action-icon" />
                          Tomar Acción
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePostpone(insight.id)}
                          disabled={isPostponed}
                        >
                          <Clock className="action-icon" />
                          {isPostponed ? 'Pospuesto' : 'Posponer'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(insight.id)}
                        >
                          <X className="action-icon" />
                          Descartar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Análisis Predictivo Mejorado */}
        <div className="predictive-analysis">
          <Card title="Proyecciones Futuras" className="predictive-card">
            {projections ? (
              <>
                {/* Gráfico de Proyecciones */}
                <div className="mb-6">
                  <ProjectionsChart data={projections.projections.chartData} />
                </div>

                <div className="predictive-content">
                  <div className="prediction-item">
                    <div className="prediction-header">
                      <div>
                        <h4>Próximos 3 Meses</h4>
                        <p className="prediction-description">Basado en tus patrones actuales</p>
                      </div>
                      <div className="prediction-icon success">
                        <TrendingUp />
                      </div>
                    </div>
                    <div className="prediction-value">
                      <span className="value-amount">{formatMoney(projections.projections.threeMonths.total)}</span>
                      <span className="value-label">en ahorros proyectados</span>
                    </div>
                    <div className="prediction-bar">
                      <div className="prediction-fill success" style={{ width: '65%' }}></div>
                    </div>
                    <div className="prediction-details">
                      <span className="detail-item">
                        <span className="detail-label">Mes 1:</span>
                        <span className="detail-value">{formatMoney(projections.projections.threeMonths.month1)}</span>
                      </span>
                      <span className="detail-item">
                        <span className="detail-label">Mes 2:</span>
                        <span className="detail-value">{formatMoney(projections.projections.threeMonths.month2)}</span>
                      </span>
                      <span className="detail-item">
                        <span className="detail-label">Mes 3:</span>
                        <span className="detail-value">{formatMoney(projections.projections.threeMonths.month3)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="prediction-item">
                    <div className="prediction-header">
                      <div>
                        <h4>Meta Anual</h4>
                        <p className="prediction-description">Progreso hacia tu objetivo</p>
                      </div>
                      <div className="prediction-icon info">
                        <Target />
                      </div>
                    </div>
                    <div className="prediction-value">
                      <span className="value-amount">{projections.annualGoal.percentage.toFixed(1)}%</span>
                      <span className="value-label">de meta completada</span>
                    </div>
                    <div className="prediction-bar">
                      <div className="prediction-fill info" style={{ width: `${Math.min(100, projections.annualGoal.percentage)}%` }}></div>
                    </div>
                    <div className="prediction-milestone">
                      <div className="milestone-item">
                        <span className="milestone-status">Completado</span>
                        <span className="milestone-amount">{formatMoney(projections.annualGoal.current)} de {formatMoney(projections.annualGoal.target)}</span>
                      </div>
                      <div className="milestone-time">
                        <Clock className="milestone-icon" />
                        <span>{projections.annualGoal.monthsRemaining} meses restantes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="loading-state">
                <Zap className="loading-icon" />
                <p>Calculando proyecciones...</p>
              </div>
            )}
          </Card>

          {/* Recomendaciones Finales */}
          <Card title="Próximos Pasos" className="recommendations-card">
            <div className="recommendations-list">
              <div className="recommendation-item">
                <div className="recommendation-number">1</div>
                <div className="recommendation-content">
                  <h5>Implementa los cambios inmediatos</h5>
                  <p>Comienza con las alertas críticas para evitar sobregiros</p>
                </div>
                <ChevronRight className="recommendation-icon" />
              </div>
              <div className="recommendation-item">
                <div className="recommendation-number">2</div>
                <div className="recommendation-content">
                  <h5>Monitorea tus gastos semanalmente</h5>
                  <p>Revisa el progreso para mantener el enfoque en tus metas</p>
                </div>
                <ChevronRight className="recommendation-icon" />
              </div>
              <div className="recommendation-item">
                <div className="recommendation-number">3</div>
                <div className="recommendation-content">
                  <h5>Aprovecha las oportunidades de ahorro</h5>
                  <p>Pequeños cambios pueden tener un gran impacto acumulativo</p>
                </div>
                <ChevronRight className="recommendation-icon" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de Confirmación de Acción */}
      {showActionModal && selectedInsight && (
        <Modal
          title="Tomar Acción"
          onClose={() => {
            setShowActionModal(false);
            setSelectedInsight(null);
          }}
        >
          <div className="space-y-4">
            <div className="bg-green-500 bg-opacity-10 border border-green-500 border-opacity-20 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-green-400 mb-2">
                {selectedInsight.title}
              </h4>
              <p className="text-gray-300 text-sm mb-3">
                {selectedInsight.message}
              </p>
              <div className="bg-gray-800 bg-opacity-50 rounded-lg p-3 mt-3">
                <p className="text-sm text-gray-400 mb-2">
                  <strong className="text-white">Recomendación:</strong>
                </p>
                <p className="text-sm text-gray-300">
                  {selectedInsight.recommendation}
                </p>
              </div>
            </div>

            <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
              <h5 className="text-sm font-semibold text-white mb-2">Detalles</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Impacto estimado:</span>
                  <span className="text-green-400 font-medium">
                    {selectedInsight.amount > 0 ? formatMoney(selectedInsight.amount) : 'Positivo'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Plazo:</span>
                  <span className="text-white">{selectedInsight.timeframe}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Categoría:</span>
                  <span className="text-white">{selectedInsight.category}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-400">
              Al confirmar, marcarás este insight como completado y se moverá a tu historial de acciones tomadas.
            </p>

            <div className="flex gap-3 mt-6">
              <Button
                variant="primary"
                full
                onClick={confirmTakeAction}
              >
                <CheckCircle className="icon-sm mr-2" />
                Confirmar Acción
              </Button>
              <Button
                variant="secondary"
                full
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedInsight(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}
