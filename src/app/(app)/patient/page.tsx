"use client";

import { useRouter } from "next/navigation";
import { DepartmentDoctorWizard } from "@/components/patient/DepartmentDoctorWizard";

export default function PatientPage() {
  const router = useRouter();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4">
      <DepartmentDoctorWizard 
        onComplete={(queue) => {
          router.push(`/track/${queue.id}`);
        }} 
      />
    </div>
  );
}
