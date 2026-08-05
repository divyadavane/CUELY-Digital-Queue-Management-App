"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase";
import { Database } from "@/types/database";
import { Stethoscope, User, Clock, Users, ArrowLeft, ChevronRight, Activity, Smile, Search } from "lucide-react";
import { DoctorRatingBadge } from "@/components/ui/DoctorRatingBadge";

type Queue = Database["public"]["Tables"]["queues"]["Row"];

interface QueueStatus {
  total_waiting: number;
  avg_serving_seconds: number;
}

interface DepartmentDoctorWizardProps {
  onComplete: (queue: Queue) => void;
  businessId?: string;
  isKiosk?: boolean;
}

const icons: Record<string, React.ReactNode> = {
  "General OPD": <Stethoscope className="w-8 h-8" />,
  "Pediatrics": <Smile className="w-8 h-8" />,
  "Dental": <Smile className="w-8 h-8" />, // Could map more later
};

export function DepartmentDoctorWizard({ onComplete, businessId, isKiosk }: DepartmentDoctorWizardProps) {
  const { t } = useTranslation();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, QueueStatus>>({});
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let query = supabase.from("queues").select("*").eq("is_active", true);
      if (businessId) {
        query = query.eq("business_id", businessId);
      }
      const { data: qData } = await query;
      
      if (qData) {
        setQueues(qData);
        // Fetch status for each queue
        const newStatusMap: Record<string, QueueStatus> = {};
        await Promise.all(
          qData.map(async (q: any) => {
            const { data: statusData } = await supabase.rpc("get_queue_status", { p_queue_id: q.id });
            if (statusData) {
              newStatusMap[q.id] = {
                total_waiting: statusData.total_waiting,
                avg_serving_seconds: statusData.avg_serving_seconds,
              };
            }
          })
        );
        setStatusMap(newStatusMap);
      }
      setLoading(false);
    };

    fetchData();

    // Subscribe to tickets to keep counts updated
    const channel = supabase
      .channel("wizard-tickets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          // Re-fetch statuses
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  // Aggregate departments
  const departments = useMemo(() => {
    const depts = new Map<string, { name: string; totalWaiting: number; avgWaitSeconds: number; queueCount: number }>();
    queues.forEach((q) => {
      const deptName = q.department || t("wizard.other");
      const status = statusMap[q.id] || { total_waiting: 0, avg_serving_seconds: 300 };
      
      if (!depts.has(deptName)) {
        depts.set(deptName, { name: deptName, totalWaiting: 0, avgWaitSeconds: 0, queueCount: 0 });
      }
      const d = depts.get(deptName)!;
      d.totalWaiting += status.total_waiting;
      d.avgWaitSeconds += status.avg_serving_seconds;
      d.queueCount += 1;
    });

    return Array.from(depts.values()).map(d => ({
      ...d,
      avgWaitSeconds: d.queueCount > 0 ? d.avgWaitSeconds / d.queueCount : 300
    })).sort((a, b) => a.totalWaiting - b.totalWaiting); // Shortest wait first
  }, [queues, statusMap, t]);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const renderDepartments = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className={`font-bold font-sans text-foreground mb-3 tracking-tight ${isKiosk ? "text-4xl" : "text-3xl"}`}>{t("wizard.selectDept")}</h2>
        <p className={`text-muted-foreground ${isKiosk ? "text-xl" : "text-sm"}`}>{t("wizard.selectDeptSub")}</p>
      </div>

      <div className={`grid gap-4 ${isKiosk ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
        {departments.map((dept) => (
          <button
            key={dept.name}
            onClick={() => {
              const deptQueues = queues.filter((q) => (q.department || "Other") === dept.name);
              if (deptQueues.length === 1) {
                onComplete(deptQueues[0]);
              } else {
                setSelectedDept(dept.name);
                setStep(2);
              }
            }}
            className="flex flex-col items-center justify-center p-6 bg-surface border border-border rounded-2xl hover:border-accent hover:shadow-md hover:-translate-y-1 transition-all premium-shadow group"
          >
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
              {icons[dept.name] || <Activity className="w-8 h-8" />}
            </div>
            <h3 className={`font-bold text-foreground mb-2 ${isKiosk ? "text-2xl" : "text-lg"}`}>{dept.name}</h3>
            <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border border-border mt-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("wizard.waiting", { n: dept.totalWaiting })}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderDoctors = () => {
    const deptQueues = queues.filter((q) => (q.department || "Other") === selectedDept);
    // Find min waiting for "Fastest" badge
    const minWait = Math.min(...deptQueues.map(q => statusMap[q.id]?.total_waiting || 0));

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center mb-8">
          <button
            onClick={() => setStep(1)}
            className="p-2 mr-4 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div>
            <h2 className={`font-bold font-sans text-foreground tracking-tight ${isKiosk ? "text-4xl" : "text-2xl"}`}>{t("wizard.selectDoctor")}</h2>
            <p className="text-muted-foreground">{selectedDept}</p>
          </div>
        </div>

        <div className={`grid gap-4 ${isKiosk ? "grid-cols-2" : "grid-cols-1"}`}>
          {deptQueues.map((q) => {
            const status = statusMap[q.id] || { total_waiting: 0, avg_serving_seconds: 300 };
            const estWaitMins = Math.ceil((status.total_waiting * status.avg_serving_seconds) / 60);
            const isOffline = q.status === 'offline';
            const isFastest = status.total_waiting === minWait && status.total_waiting > 0;

            return (
              <button
                key={q.id}
                disabled={isOffline}
                onClick={() => onComplete(q)}
                className={`flex flex-col p-5 border rounded-2xl transition-all text-left relative ${
                  isOffline 
                    ? "bg-muted/50 border-border opacity-60 cursor-not-allowed" 
                    : "bg-surface border-border hover:border-accent hover:shadow-md premium-shadow"
                }`}
              >
                <div className="flex justify-between items-start mb-3 w-full">
                  <div>
                    <h3 className={`font-bold text-foreground ${isKiosk ? "text-2xl" : "text-lg"}`}>
                      {q.doctor_name || q.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{q.counter_number}</p>
                    <div className="mt-1.5">
                      <DoctorRatingBadge queueId={q.id} />
                    </div>
                  </div>
                  {isFastest && !isOffline && (
                    <span className="bg-green-500/10 text-green-600 border border-green-500/20 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                      {t("wizard.fastest")}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50 w-full">
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{t("wizard.ahead", { n: status.total_waiting })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{t("wizard.wait", { n: estWaitMins })}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${
                      q.status === 'available' ? 'bg-green-500' :
                      q.status === 'busy' ? 'bg-amber-500' :
                      q.status === 'on break' ? 'bg-gray-400' : 'bg-red-500'
                    }`} />
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {q.status === "available" ? t("wizard.available") : q.status === "busy" ? t("wizard.busy") : q.status === "on break" ? t("wizard.onBreak") : t("wizard.offline")}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${isKiosk ? "p-4" : ""}`}>
      {step === 1 ? renderDepartments() : renderDoctors()}
    </div>
  );
}
