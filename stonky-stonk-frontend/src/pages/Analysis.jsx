import { useState, useEffect } from 'react';
import axios from 'axios';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { TrendingUp, AlertTriangle, Lightbulb, Target, ChevronRight, CheckCircle, Clock, Zap } from 'lucide-react';
import { formatCLP } from '../utils/currency';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'https://stonky-backend.blackdune-587dd75b.westus3.azurecontainerapps.io'}/api`;

export default function Analysis() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [expandedInsight, setExpandedInsight] = useState(null);

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

    loadInsights();
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


  const totalActionable = insights.filter(i => i.actionable).length;
  const potentialSavings = insights.reduce((sum, i) => sum + i.amount, 0);

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
                <span className="metric-value">{insights.length}</span>
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
                <span className="metric-value">{formatCLP(potentialSavings)}</span>
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
                  {insights.filter(i => i.priority === 'critical').length}
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
          ) : insights.length === 0 ? (
            <div className="empty-state">
              <Target className="empty-icon" />
              <h3>No hay insights disponibles</h3>
              <p>Continúa usando la aplicación para generar análisis personalizados</p>
            </div>
          ) : (
            <div className="insights-list">
              {insights.map((insight, index) => {
                const isExpanded = expandedInsight === insight.id;
                const priorityBadge = getPriorityBadge(insight.priority);
                
                return (
                  <div 
                    key={insight.id} 
                    className={`insight-item ${getInsightColor(insight.type)} priority-${insight.priority}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="insight-header">
                      <div className="insight-icon-container">
                        <div className="icon-wrapper">
                          {getInsightIcon(insight.type)}
                        </div>
                      </div>
                      
                      <div className="insight-title">
                        <div className="title-row">
                          <h4>{insight.title}</h4>
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
                          <span className="amount-value">{formatCLP(insight.amount)}</span>
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
                    
                    {insight.actionable && (
                      <div className="insight-actions">
                        <Button variant="primary" size="sm">
                          <CheckCircle className="action-icon" />
                          Tomar Acción
                        </Button>
                        <Button variant="secondary" size="sm">
                          <Clock className="action-icon" />
                          Posponer
                        </Button>
                        <Button variant="ghost" size="sm">
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
                  <span className="value-amount">$525,000</span>
                  <span className="value-label">en ahorros proyectados</span>
                </div>
                <div className="prediction-bar">
                  <div className="prediction-fill success" style={{ width: '65%' }}></div>
                </div>
                <div className="prediction-details">
                  <span className="detail-item">
                    <span className="detail-label">Mes 1:</span>
                    <span className="detail-value">$175k</span>
                  </span>
                  <span className="detail-item">
                    <span className="detail-label">Mes 2:</span>
                    <span className="detail-value">$180k</span>
                  </span>
                  <span className="detail-item">
                    <span className="detail-label">Mes 3:</span>
                    <span className="detail-value">$170k</span>
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
                  <span className="value-amount">85%</span>
                  <span className="value-label">de meta completada</span>
                </div>
                <div className="prediction-bar">
                  <div className="prediction-fill info" style={{ width: '85%' }}></div>
                </div>
                <div className="prediction-milestone">
                  <div className="milestone-item">
                    <span className="milestone-status">Completado</span>
                    <span className="milestone-amount">$2.1M de $2.5M</span>
                  </div>
                  <div className="milestone-time">
                    <Clock className="milestone-icon" />
                    <span>4 meses restantes</span>
                  </div>
                </div>
              </div>
            </div>
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
    </MainLayout>
  );
}