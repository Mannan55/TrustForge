import React, { useState } from 'react';
import { MOCK_COMPLIANCE_RULES, ComplianceRule } from '../../data/adminMockData';
import { SeverityBadge, Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { Sliders, CheckCircle2, Ban } from 'lucide-react';

export const ComplianceRulesPage: React.FC = () => {
  const { addToast } = useToast();
  const [rules, setRules] = useState<ComplianceRule[]>(MOCK_COMPLIANCE_RULES);

  const toggleRuleStatus = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId) {
          const nextStatus = r.status === 'Active' ? 'Inactive' : 'Active';
          addToast(`Rule ${nextStatus}`, `Compliance rule ${r.ruleCode} marked ${nextStatus}.`, 'info');
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD0] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#7A8981] uppercase tracking-wider">
            FRAMEWORK ENGINE
          </span>
          <h2 className="text-2xl font-bold text-[#0F2E22] mt-1">Compliance Rules Engine</h2>
          <p className="text-xs text-[#4A5750] mt-0.5">
            Manage Indian DPDP Act 2023 legal requirement rules and severity weights.
          </p>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-[#E3DDD0] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E3DDD0] text-[#7A8981] uppercase tracking-wider font-bold">
                <th className="p-4">Rule Code & Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">DPDP Section</th>
                <th className="p-4">Severity Weight</th>
                <th className="p-4">Rule Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DDD0]">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-[#0F2E22] text-sm block">{rule.title}</span>
                    <span className="text-[11px] text-[#7A8981] font-mono">{rule.ruleCode}</span>
                  </td>
                  <td className="p-4 text-[#0F2E22] font-medium">{rule.category}</td>
                  <td className="p-4 font-semibold text-[#0F2E22]">{rule.dpdpSection}</td>
                  <td className="p-4">
                    <SeverityBadge severity={rule.severityWeight} size="sm" />
                  </td>
                  <td className="p-4">
                    <Badge variant={rule.status === 'Active' ? 'success' : 'danger'}>
                      {rule.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant={rule.status === 'Active' ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => toggleRuleStatus(rule.id)}
                    >
                      {rule.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
