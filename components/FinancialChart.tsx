import React, { useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MOCK_CHART_DATA, MOCK_CHART_DATA_YEAR } from '../constants';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white text-xs py-1 px-2 rounded shadow-lg">
        <p className="font-bold">{label}</p>
        <p>Rec: R$ {payload[0].value.toLocaleString()}</p>
        <p>Desp: R$ {payload[1].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const FinancialChart: React.FC = () => {
  const [period, setPeriod] = useState<'6m' | '1y'>('6m');
  const data = period === '6m' ? MOCK_CHART_DATA : MOCK_CHART_DATA_YEAR;

  const handleDownload = () => {
    // Simulação de download
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Mes,Receita,Despesa\n"
      + data.map(row => `${row.name},${row.revenue},${row.expense}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financeiro_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="lg:col-span-2 bg-white dark:bg-[#1A2234] rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col h-[460px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Desempenho Financeiro</h3>
          <p className="text-sm text-slate-500">Receitas vs. Despesas</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value as '6m' | '1y')}
            className="text-xs border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded px-2 py-1 text-slate-600 dark:text-slate-300 focus:ring-primary focus:border-primary cursor-pointer outline-none"
          >
            <option value="6m">Últimos 6 Meses</option>
            <option value="1y">Último Ano</option>
          </select>
          <button 
            onClick={handleDownload}
            className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
            title="Baixar CSV"
          >
            <span className="material-icons text-[18px]">download</span>
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#94a3b8' }} 
              dy={10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
            <Bar 
              dataKey="revenue" 
              fill="#195de6" 
              radius={[4, 4, 0, 0]} 
              barSize={period === '6m' ? 32 : 16}
              stackId="a"
              animationDuration={500}
            />
            <Bar 
              dataKey="expense" 
              fill="#cbd5e1" 
              radius={[0, 0, 4, 4]} 
              barSize={period === '6m' ? 32 : 16}
              stackId="a"
              animationDuration={500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-xs text-slate-500">Receitas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
          <span className="text-xs text-slate-500">Despesas</span>
        </div>
      </div>
    </div>
  );
};

export default FinancialChart;