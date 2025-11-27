import React, { useState } from 'react';
import { Users, Video, Clock, Search, Filter } from 'lucide-react';
import { Card, Badge, Button } from './ui';
import { Candidate, CandidateStatus } from '../types';

// Mock Data
const MOCK_CANDIDATES: Candidate[] = [
  { id: '1', name: 'Nguyen Van A', email: 'a.nguyen@example.com', roleApplied: 'Frontend Developer', status: CandidateStatus.IN_REVIEW, appliedDate: '2023-11-20', score: 85 },
  { id: '2', name: 'Tran Thi B', email: 'b.tran@example.com', roleApplied: 'Product Manager', status: CandidateStatus.PASSED, appliedDate: '2023-11-21', score: 92 },
  { id: '3', name: 'Le Van C', email: 'c.le@example.com', roleApplied: 'Backend Engineer', status: CandidateStatus.PENDING, appliedDate: '2023-11-22' },
  { id: '4', name: 'Pham Thi D', email: 'd.pham@example.com', roleApplied: 'Frontend Developer', status: CandidateStatus.REJECTED, appliedDate: '2023-11-19', score: 60 },
  { id: '5', name: 'Hoang Van E', email: 'e.hoang@example.com', roleApplied: 'Designer', status: CandidateStatus.COMPLETED, appliedDate: '2023-11-23' },
];

interface AdminDashboardProps {
  onSelectCandidate: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSelectCandidate }) => {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredCandidates = MOCK_CANDIDATES.filter(c => {
    const matchesFilter = filter === 'ALL' || c.status === filter;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.roleApplied.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = [
    { label: 'Total Candidates', value: MOCK_CANDIDATES.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Pending Review', value: MOCK_CANDIDATES.filter(c => c.status === CandidateStatus.COMPLETED || c.status === CandidateStatus.IN_REVIEW).length, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'Interviews Today', value: 2, icon: Video, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-full ${stat.bg}`}>
              <stat.icon className={stat.color} size={24} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800">Candidate Pipeline</h2>
          
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search candidates..." 
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative">
               <select 
                className="pl-4 pr-10 py-2 border border-slate-300 rounded-lg text-sm appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
               >
                 <option value="ALL">All Status</option>
                 <option value={CandidateStatus.COMPLETED}>Completed</option>
                 <option value={CandidateStatus.IN_REVIEW}>In Review</option>
                 <option value={CandidateStatus.PASSED}>Passed</option>
               </select>
               <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Applied Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCandidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{candidate.name}</td>
                  <td className="px-6 py-4 text-slate-600">{candidate.roleApplied}</td>
                  <td className="px-6 py-4 text-slate-600">{candidate.appliedDate}</td>
                  <td className="px-6 py-4">
                    <Badge status={candidate.status} />
                  </td>
                  <td className="px-6 py-4 font-mono font-medium">
                    {candidate.score ? <span className={candidate.score >= 70 ? 'text-green-600' : 'text-red-600'}>{candidate.score}/100</span> : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="outline" 
                      className="text-xs px-3 py-1"
                      onClick={() => onSelectCandidate(candidate.id)}
                    >
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCandidates.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No candidates found matching your criteria.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
