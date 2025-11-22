import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useSettings } from '../../context/SettingsContext';

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function ExpensesPieChart({ data }) {
  const { formatMoney } = useSettings();

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No hay datos de gastos para mostrar</p>
      </div>
    );
  }

  // Formatear datos para el gráfico
  const chartData = data.map((item, index) => ({
    name: item.categoryName,
    value: parseFloat(item.total),
    percentage: item.percentage,
    color: COLORS[index % COLORS.length]
  }));

  // Custom label para mostrar porcentaje
  const renderLabel = (entry) => {
    return `${entry.percentage.toFixed(1)}%`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-1">{payload[0].name}</p>
          <p className="text-green-400">{formatMoney(payload[0].value)}</p>
          <p className="text-gray-400 text-sm">{payload[0].payload.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => (
              <span className="text-gray-300 text-sm">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
