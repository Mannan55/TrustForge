import { TrendingUp, Building2, ScanLine, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { StatCard } from "@/components/common/StatCard";
import { BarChart, DonutChart, HBars } from "@/components/charts/Charts";
import {
  PLATFORM_KPIS,
  ASSESSMENT_TREND,
  TRUST_DISTRIBUTION,
  SCAN_STATUS_SPLIT,
  COMMON_GAPS,
} from "@/data/adminData";

export function AdminAnalyticsPage() {
  const avgTrust = 74; // representative fleet average
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Platform" title="Analytics" subtitle="Trends across assessments, posture, and scanning for the whole fleet." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assessments run" value={PLATFORM_KPIS.assessments} icon={<ShieldCheck className="h-4 w-4" />} hint="All time" />
        <StatCard label="Fleet avg Trust Score" value={avgTrust} icon={<TrendingUp className="h-4 w-4" />} hint="Weighted mean" />
        <StatCard label="Organizations" value={PLATFORM_KPIS.organizations} icon={<Building2 className="h-4 w-4" />} hint="Active tenants" />
        <StatCard label="Website scans" value={PLATFORM_KPIS.websiteScans.toLocaleString("en-IN")} icon={<ScanLine className="h-4 w-4" />} hint="All time" />
      </div>

      <Card>
        <CardHeader title="Assessments completed" eyebrow="Last 6 months" description="Cumulative assessments completed across all tenants." />
        <div className="mt-6">
          <BarChart data={ASSESSMENT_TREND} tone="brand" height={200} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Trust Score distribution" eyebrow="Fleet posture" />
          <div className="mt-5">
            <DonutChart segments={TRUST_DISTRIBUTION} centerLabel={`${avgTrust}`} centerSub="avg" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Scan outcomes" eyebrow="Last 30 days" />
          <div className="mt-5">
            <DonutChart segments={SCAN_STATUS_SPLIT} centerLabel="91%" centerSub="pass" />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Most common gaps" eyebrow="Where tenants struggle" description="The obligations most frequently flagged across assessments." />
        <div className="mt-5">
          <HBars data={COMMON_GAPS} unit="%" />
        </div>
      </Card>
    </div>
  );
}
