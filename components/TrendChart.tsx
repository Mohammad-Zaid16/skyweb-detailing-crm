'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export type TrendPoint = { date: string; leads: number; revenue: number };

export default function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e5b8" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#00e5b8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3d8bff" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#3d8bff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#232330" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#5c5c70', fontSize: 11 }}
          axisLine={{ stroke: '#232330' }}
          tickLine={false}
        />
        <YAxis tick={{ fill: '#5c5c70', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          contentStyle={{
            background: '#14141b',
            border: '1px solid #2a2a38',
            borderRadius: 10,
            fontSize: 12.5,
            color: '#f4f4f8',
          }}
          labelStyle={{ color: '#9a9ab0', marginBottom: 4 }}
        />
        <Area
          type="monotone"
          dataKey="leads"
          stroke="#00e5b8"
          strokeWidth={2}
          fill="url(#leadsGradient)"
          name="Leads"
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#3d8bff"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          name="Revenue (£)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
