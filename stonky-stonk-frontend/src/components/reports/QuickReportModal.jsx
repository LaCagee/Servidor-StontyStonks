import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useSettings } from '../../context/SettingsContext';
import Button from '../ui/Button';
import { Download, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function QuickReportModal({ reportType, data, onClose }) {
  const { formatMoney, currency } = useSettings();

  if (!data) return null;

  // Función para exportar a PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();

      // Título
      doc.setFontSize(20);
      doc.text(data.title, 14, 20);

      doc.setFontSize(10);
      doc.text(data.description, 14, 30);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 14, 35);
      doc.text(`Moneda: ${currency}`, 14, 40);

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(14, 45, 196, 45);

      let yPos = 55;

      // Agregar cada sección
      data.sections.forEach((section, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.text(section.title, 14, yPos);
        yPos += 5;

        doc.setFontSize(10);
        doc.text(`${section.value}`, 14, yPos + 5);
        yPos += 12;

        // Tabla de items
        const tableData = section.items.map(item => [item.label, item.value]);
        autoTable(doc, {
          startY: yPos,
          head: [['Concepto', 'Valor']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [52, 211, 153] },
          styles: { fontSize: 9 },
          margin: { left: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 15;
      });

      doc.save(`${data.title.toLowerCase().replace(/\\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
      alert('✅ Reporte exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      alert('❌ Error al exportar el reporte');
    }
  };

  // Renderizar gráfico según el tipo de reporte
  const renderChart = () => {
    switch (reportType) {
      case 'cashflow':
        return renderCashflowChart();
      case 'spending-habits':
        return renderSpendingHabitsChart();
      case 'savings-projection':
        return renderSavingsProjectionChart();
      case 'annual-comparison':
        return renderAnnualComparisonChart();
      default:
        return null;
    }
  };

  const renderCashflowChart = () => {
    const chartData = data.sections.map(section => ({
      name: section.title,
      value: parseFloat(section.value.replace(/[^0-9.-]/g, '')) || 0
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
            formatter={(value) => formatMoney(value)}
          />
          <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderSpendingHabitsChart = () => {
    // Obtener los datos de distribución de gastos
    const distributionSection = data.sections.find(s => s.title === 'Distribución de Gastos');
    if (!distributionSection) return null;

    const chartData = distributionSection.items.map((item, index) => ({
      name: item.label,
      value: parseFloat(item.value.replace(/[^0-9.-]/g, '')) || 0,
      color: COLORS[index % COLORS.length]
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: ${formatMoney(entry.value)}`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
            formatter={(value) => formatMoney(value)}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderSavingsProjectionChart = () => {
    // Obtener proyecciones
    const projectionsSection = data.sections.find(s => s.title === 'Proyecciones');
    const optimizationSection = data.sections.find(s => s.title === 'Optimización Posible');

    if (!projectionsSection) return null;

    const chartData = projectionsSection.items.map((item, index) => {
      const optimizationValue = optimizationSection?.items[index]?.value || item.value;
      return {
        name: item.label,
        conservador: parseFloat(item.value.replace(/[^0-9.-]/g, '')) || 0,
        optimizado: parseFloat(optimizationValue.replace(/[^0-9.-]/g, '')) || 0
      };
    });

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
            formatter={(value) => formatMoney(value)}
          />
          <Legend />
          <Line type="monotone" dataKey="conservador" stroke="#3b82f6" strokeWidth={2} name="Conservador" />
          <Line type="monotone" dataKey="optimizado" stroke="#10b981" strokeWidth={2} name="Optimizado (+15%)" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderAnnualComparisonChart = () => {
    const currentSection = data.sections.find(s => s.title === 'Período Actual');
    if (!currentSection) return null;

    const chartData = currentSection.items.map(item => ({
      name: item.label,
      value: parseFloat(item.value.replace(/[^0-9.-]/g, '')) || 0
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
            formatter={(value) => formatMoney(value)}
          />
          <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container large" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{data.title}</h2>
            <p className="text-gray-400 text-sm">{data.description}</p>
          </div>
          <button onClick={onClose} className="modal-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Gráfico */}
          <div className="bg-slate-800 bg-opacity-40 rounded-lg p-6 border border-slate-600 mb-6">
            {renderChart()}
          </div>

          {/* Secciones de datos */}
          {data.sections.map((section, idx) => (
            <div key={idx} className="report-section mb-4">
              <div className="section-header">
                <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                <p className="text-green-400 font-bold">{section.value}</p>
              </div>
              <div className="section-items">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex justify-between py-2 border-b border-slate-700">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-white font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="primary" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
