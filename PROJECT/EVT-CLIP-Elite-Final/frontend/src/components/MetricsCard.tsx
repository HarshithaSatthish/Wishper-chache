import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  trend: string;
  color: 'cyan' | 'blue' | 'green' | 'orange';
}

const colorMap = {
  cyan: 'from-cyan-500 to-blue-500 shadow-cyan-500/20',
  blue: 'from-blue-500 to-indigo-500 shadow-blue-500/20',
  green: 'from-green-500 to-emerald-500 shadow-green-500/20',
  orange: 'from-orange-500 to-red-500 shadow-orange-500/20'
};

const MetricsCard: React.FC<Props> = ({ label, value, trend, color }) => {
  const isPositive = !trend.startsWith('-');

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-panel rounded-2xl p-6 border border-gray-800 relative overflow-hidden group"
    >
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${colorMap[color]}`} />

      <div className="flex justify-between items-start mb-2">
        <span className="text-gray-400 text-xs font-mono uppercase tracking-wider">{label}</span>
        <span className={`flex items-center text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {trend}
        </span>
      </div>

      <div className={`text-3xl font-bold font-mono bg-gradient-to-r ${colorMap[color]} bg-clip-text text-transparent`}>
        {value}
      </div>

      <div className={`absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-r ${colorMap[color]} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
    </motion.div>
  );
};

export default MetricsCard;
