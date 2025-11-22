import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useSettings } from '../../context/SettingsContext';

export default function IncomeTrendChart({ data }) {
  const { formatMoney } = useSettings();

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No hay datos de tendencia disponibles</p>
        <p className="text-gray-500 text-sm mt-2">Los datos aparecerán cuando tengas transacciones en el período seleccionado</p>
      </div>
    );
  }

  // Formatear datos para el gráfico
  const chartData = data.map(item => ({
    name: item.month || 'Mes',
    ingresos: parseFloat(item.income || 0),
    gastos: parseFloat(item.expenses || 0),
    ahorro: parseFloat(item.savings || 0)
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 shadow-2xl">
          <p className="text-sm font-bold text-white mb-3 border-b border-slate-700 pb-2">
            {data.name}
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-6">
              <span className="text-green-400">Ingresos:</span>
              <span className="text-white font-semibold">{formatMoney(data.ingresos)}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-red-400">Gastos:</span>
              <span className="text-white font-semibold">{formatMoney(data.gastos)}</span>
            </div>
            <div className="flex justify-between gap-6 border-t border-slate-700 pt-2">
              <span className="text-blue-400">Ahorro:</span>
              <span className={`font-bold ${data.ahorro >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatMoney(data.ahorro)}
              </span>
            </div>
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
    <div className="bg-slate-800 bg-opacity-40 rounded-lg p-6 border border-slate-600">
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="ingresos"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorIngresos)"
            name="Ingresos"
          />
          <Area
            type="monotone"
            dataKey="gastos"
            stroke="#ef4444"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorGastos)"
            name="Gastos"
          />
          <Line
            type="monotone"
            dataKey="ahorro"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', r: 5 }}
            name="Ahorro"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
