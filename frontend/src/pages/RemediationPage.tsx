import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { MOCK_REMEDIATION_TASKS } from '../data/mockData';
import { RemediationTask } from '../types';
import { SeverityBadge, Badge } from '../components/ui/Badge';
import { Drawer } from '../components/ui/Drawer';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { CheckSquare, Clock, ArrowRight, UserCheck, CheckCircle2, Shield } from 'lucide-react';

export const RemediationPage: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedTask, setSelectedTask] = useState<RemediationTask | null>(null);

  const filteredTasks = MOCK_REMEDIATION_TASKS.filter((task) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'HIGH') return task.priority === 'HIGH';
    return task.status === activeTab;
  });

  const handleStartAction = (taskId: string) => {
    addToast('Remediation Started', 'Action task marked as In Progress.', 'info');
    setSelectedTask(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            IMPROVE
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">Actionable Remediation Roadmap</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Prioritized DPDP compliance fixes sorted by regulatory impact & effort.
          </p>
        </div>

        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'ALL', label: 'All Actions', count: MOCK_REMEDIATION_TASKS.length },
            { id: 'HIGH', label: 'High Priority', count: MOCK_REMEDIATION_TASKS.filter((t) => t.priority === 'HIGH').length },
            { id: 'In Progress', label: 'In Progress', count: MOCK_REMEDIATION_TASKS.filter((t) => t.status === 'In Progress').length }
          ]}
        />
      </div>

      {/* Remediation Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task, index) => (
          <div
            key={task.id}
            onClick={() => setSelectedTask(task)}
            className="p-6 rounded-2xl border border-[#E3DDD0] bg-white hover:border-[#0F2E22] hover:shadow-sm transition-all cursor-pointer space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#7A8981]">#{index + 1}</span>
                <SeverityBadge severity={task.priority} />
                <Badge variant="beige">{task.effort} Effort</Badge>
              </div>
              <Badge variant={task.status === 'Completed' ? 'success' : task.status === 'In Progress' ? 'info' : 'warning'}>
                {task.status}
              </Badge>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#0F2E22]">{task.title}</h3>
              <p className="text-xs text-[#4A5750] mt-1"><strong className="text-[#0F2E22]">Problem:</strong> {task.problem}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#FAF8F5] text-xs text-[#7A8981]">
              <div className="flex items-center gap-3">
                {task.assignedTo && <span>Assigned to: {task.assignedTo}</span>}
                {task.dueDate && <span>Target: {task.dueDate}</span>}
              </div>
              <span className="font-semibold text-[#0F2E22] flex items-center gap-1">
                View Action Protocol →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* TASK DETAIL DRAWER */}
      <Drawer
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.title || 'Remediation Task'}
        subtitle="Step-by-step resolution protocol"
      >
        {selectedTask && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-[#E3DDD0]">
              <SeverityBadge severity={selectedTask.priority} />
              <Badge variant="beige">{selectedTask.effort} Implementation Effort</Badge>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider">Identified Problem</h4>
              <div className="p-4 rounded-xl bg-white border border-[#E3DDD0] text-xs text-[#4A5750]">
                {selectedTask.problem}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider">Why It Matters</h4>
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E3DDD0] text-xs text-[#4A5750]">
                {selectedTask.why}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider">Recommended Fix</h4>
              <div className="p-4 rounded-xl bg-white border border-[#E3DDD0] text-xs text-[#0F2E22] font-medium leading-relaxed">
                {selectedTask.recommendedFix}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#0F2E22] uppercase tracking-wider">Required Evidence</h4>
              <div className="p-4 rounded-xl bg-[#E3CFAE]/30 border border-[#D5BD97] text-xs text-[#0F2E22]">
                {selectedTask.evidenceNeeded}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E3DDD0] flex justify-end gap-3">
              <Button variant="primary" onClick={() => handleStartAction(selectedTask.id)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Start Action Implementation
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
