import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { useSettings } from '../../context/SettingsContext';

export default function MonthlyTrendChart({ data }) {
  const { formatMoney } = useSettings();

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No hay datos de tendencia disponibles</p>
        <p className="text-gray-500 text-sm mt-2">Agrega transacciones para ver tu resumen</p>
      </div>
    );
  }

  // Formatear datos para el gráfico
  const chartData = data.map(month => ({
    name: month.monthName ? month.monthName.substring(0, 3) : 'N/A',
    fullName: month.monthName || 'Mes',
    year: month.year || new Date().getFullYear(),
    ingresos: parseFloat(month.income || 0),
    gastos: parseFloat(month.expense || 0),
    balance: parseFloat((month.income || 0) - (month.expense || 0)),
    transacciones: month.transactionCount || 0
  }));

  // Calcular totales
  const totals = {
    ingresos: chartData.reduce((sum, m) => sum + m.ingresos, 0),
    gastos: chartData.reduce((sum, m) => sum + m.gastos, 0),
    balance: chartData.reduce((sum, m) => sum + m.balance, 0)
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 shadow-2xl">
          <p className="text-sm font-bold text-white mb-3 border-b border-slate-700 pb-2">
            {data.fullName} {data.year}
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-green-400">↑ Ingresos:</span>
              <span className="text-white font-semibold">{formatMoney(data.ingresos)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-red-400">↓ Gastos:</span>
              <span className="text-white font-semibold">{formatMoney(data.gastos)}</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-700 pt-2">
              <span className="text-blue-400">= Balance:</span>
              <span className={`font-bold ${data.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatMoney(data.balance)}
              </span>
            </div>
            {data.transacciones > 0 && (
              <div className="flex justify-between gap-4 text-gray-400 pt-1">
                <span>Transacciones:</span>
                <span>{data.transacciones}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Formatear eje Y
  const formatYAxis = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
    return value;
  };

  return (
    <div className="space-y-4">
      {/* Indicadores de totales */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-500 bg-opacity-10 border border-green-500 border-opacity-20 rounded-lg p-3">
          <p className="text-xs text-green-400 mb-1">Ingresos Totales</p>
          <p className="text-lg font-bold text-green-400">
            {formatMoney(totals.ingresos)}
          </p>
        </div>
        <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-20 rounded-lg p-3">
          <p className="text-xs text-red-400 mb-1">Gastos Totales</p>
          <p className="text-lg font-bold text-red-400">
            {formatMoney(totals.gastos)}
          </p>
        </div>
        <div className="bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-20 rounded-lg p-3">
          <p className="text-xs text-blue-400 mb-1">Balance</p>
          <p className={`text-lg font-bold ${totals.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {formatMoney(totals.balance)}
          </p>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="bg-slate-800 bg-opacity-40 rounded-lg p-6 border border-slate-600">
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => (
                <span className="text-gray-300 text-sm capitalize">{value}</span>
              )}
            />
            <Bar
              dataKey="ingresos"
              fill="#10b981"
              radius={[8, 8, 0, 0]}
              name="Ingresos"
            />
            <Bar
              dataKey="gastos"
              fill="#ef4444"
              radius={[8, 8, 0, 0]}
              name="Gastos"
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              name="Balance"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
