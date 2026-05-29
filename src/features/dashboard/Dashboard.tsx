import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { calculateBalances, simplifyDebts } from '../../utils/settlementUtils';
import { DollarSign, UserCheck, TrendingUp, Sparkles, PieChartIcon, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardProps {
  spaceId: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#a78bfa',      // Violet-400
  Lodging: '#6366f1',   // Indigo-500
  Transport: '#3b82f6', // Blue-500
  Activities: '#f43f5e',// Rose-500
  Others: '#94a3b8',    // Slate-400
};

export function Dashboard({ spaceId }: DashboardProps) {
  const { profile } = useAuth();

  const { data: members = [] } = useQuery({
    queryKey: ['members', spaceId],
    queryFn: () => api.getMembers(spaceId),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', spaceId],
    queryFn: () => api.getExpenses(spaceId),
  });

  // 1. Calculations
  const balances = calculateBalances(expenses, members);
  const simplifiedDebts = simplifyDebts(balances);

  const totalExpense = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);
  
  const myBalanceRec = balances.find((b) => b.userId === profile?.id);
  const myBalance = myBalanceRec?.netBalance || 0;

  // Find Top Spender
  let topSpenderName = 'No Spender';
  let maxSpend = 0;
  balances.forEach((b) => {
    if (b.totalPaid > maxSpend) {
      maxSpend = b.totalPaid;
      topSpenderName = b.name;
    }
  });

  // Outstanding Debt (total this user owes to others)
  const myOwedDebt = simplifiedDebts
    .filter((d) => d.debtorId === profile?.id)
    .reduce((acc, d) => acc + d.amount, 0);

  // 2. Chart Datasets
  // Category Pie Chart data
  const categoryDataMap: Record<string, number> = {
    Food: 0,
    Lodging: 0,
    Transport: 0,
    Activities: 0,
    Others: 0,
  };
  expenses.forEach((e) => {
    const cat = e.category || 'Others';
    if (categoryDataMap[cat] !== undefined) {
      categoryDataMap[cat] += Number(e.amount);
    } else {
      categoryDataMap.Others += Number(e.amount);
    }
  });
  const pieChartData = Object.entries(categoryDataMap)
    .filter(([_, val]) => val > 0)
    .map(([key, val]) => ({ name: key, value: val }));

  // Member Bar Chart data
  const barChartData = balances.map((b) => ({
    name: b.name,
    paid: Number(b.totalPaid.toFixed(0)),
    owed: Number(b.totalOwed.toFixed(0)),
  })).sort((a, b) => b.paid - a.paid);

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Overview Dashboard</h2>
          <p className="text-xs text-slate-400">Realtime spending insights for your group.</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expense */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between h-[100px] relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Spent</span>
            <DollarSign className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h4 className="text-white text-lg font-extrabold">
              ₱{totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h4>
            <p className="text-[9px] text-slate-500 mt-1">For entire trip space</p>
          </div>
        </div>

        {/* My Balance */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between h-[100px] relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">My Balance</span>
            <UserCheck className={`w-4 h-4 ${myBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div>
            <h4 className={`text-lg font-extrabold ${myBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {myBalance >= 0 ? '+' : ''}₱{myBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h4>
            <p className="text-[9px] text-slate-500 mt-1">
              {myBalance >= 0 ? 'To receive overall' : 'To settle overall'}
            </p>
          </div>
        </div>

        {/* Top Spender */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between h-[100px] relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Top Spender</span>
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h4 className="text-white text-base font-extrabold truncate max-w-[130px]">
              {topSpenderName}
            </h4>
            <p className="text-[9px] text-slate-500 mt-1">
              Spent ₱{maxSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Remaining Debt */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between h-[100px] relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">My Active Debt</span>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h4 className="text-white text-lg font-extrabold">
              ₱{myOwedDebt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </h4>
            <p className="text-[9px] text-slate-500 mt-1">Amount you owe friends</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Pie Chart */}
          {pieChartData.length > 0 && (
            <div className="glass-panel rounded-2xl p-5 space-y-3 flex flex-col justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-primary" /> Spending by Category
              </h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center flex-1">
                <div className="w-[140px] h-[140px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#ccc'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₱${Number(value).toFixed(0)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-col gap-y-2 text-[10px] max-w-xs justify-center">
                  {pieChartData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 font-medium text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[entry.name] }} />
                      <span className="truncate">{entry.name}: ₱{entry.value.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contributions Bar Chart */}
          <div className="glass-panel rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-primary" /> Spenders Comparison
            </h3>

            <div className="w-full h-[160px] pr-4 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => `₱${value}`} />
                  <Bar dataKey="paid" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Total Paid" />
                  <Bar dataKey="owed" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Total Share" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
