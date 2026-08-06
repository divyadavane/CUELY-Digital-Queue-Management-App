export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          name: string
          default_language: string
          created_at: string
        }
      }
      admins: {
        Row: {
          id: string
          business_id: string
          role: 'admin' | 'owner'
          created_at: string
        }
      }
      queues: {
        Row: {
          id: string
          business_id: string
          name: string
          is_active: boolean
          is_paused: boolean
          department: string | null
          doctor_name: string | null
          counter_number: string | null
          status: 'available' | 'busy' | 'on break' | 'offline' | null
          avg_rating: number
          total_ratings: number
          consultation_fee: number
          video_enabled: boolean
          assistance_requested_at: string | null
          avg_consult_mins: number
          created_at: string
        }
      }
      ratings: {
        Row: {
          id: string
          queue_id: string
          ticket_id: string | null
          consultation_id: string | null
          patient_name: string | null
          patient_phone: string | null
          rating_value: number
          comment: string | null
          created_at: string
        }
      }
      patient_profiles: {
        Row: {
          id: string
          phone: string
          name: string | null
          email: string | null
          notification_prefs: Record<string, boolean>
          preferred_language: string
          created_at: string
          last_login_at: string | null
        }
      }
      patient_otps: {
        Row: {
          id: string
          phone: string
          code: string
          attempts: number
          expires_at: string
          used_at: string | null
          created_at: string
        }
      }
      patient_sessions: {
        Row: {
          id: string
          patient_id: string
          token: string
          expires_at: string
          created_at: string
        }
      }
      bills: {
        Row: {
          id: string
          business_id: string | null
          ticket_id: string | null
          consultation_id: string | null
          patient_phone: string | null
          amount: number
          status: 'paid' | 'pending'
          description: string | null
          paid_at: string | null
          created_at: string
        }
      }
      tickets: {
        Row: {
          id: string
          queue_id: string
          token_number: number
          customer_name: string | null
          customer_phone: string | null
          emergency_type: string | null
          status: 'waiting' | 'called' | 'serving' | 'served' | 'no_show' | 'left'
          priority: number
          recall_count: number
          served_by: string | null
          joined_at: string
          called_at: string | null
          served_at: string | null
          visit_reason: string | null
          clinical_note: string | null
          insurance_verified: boolean
          urgency_tag: 'emergency' | 'walk-in' | 'follow-up' | 'vip' | null
          consult_started_at: string | null
          consult_ended_at: string | null
        }
      }
      serving_stats: {
        Row: {
          id: string
          queue_id: string
          ticket_id: string
          duration_seconds: number
          recorded_at: string
        }
      }
      queue_activity_log: {
        Row: {
          id: string
          queue_id: string
          ticket_id: string | null
          admin_id: string
          action: string
          created_at: string
        }
      }
      appointments: {
        Row: {
          id: string
          business_id: string
          queue_id: string
          patient_name: string | null
          patient_phone: string
          emergency_type: string | null
          appointment_date: string
          appointment_time: string | null
          status: 'scheduled' | 'checked_in' | 'cancelled' | 'completed'
          is_video: boolean
          created_at: string
        }
      }
      consultations: {
        Row: {
          id: string
          business_id: string
          queue_id: string
          appointment_id: string | null
          patient_id: string | null
          patient_phone: string
          patient_name: string | null
          status: 'scheduled' | 'ready' | 'in_call' | 'completed' | 'cancelled' | 'missed'
          room_token: string
          scheduled_start: string
          started_at: string | null
          ended_at: string | null
          expires_at: string
          created_at: string
          updated_at: string
        }
      }
      consultation_notes: {
        Row: {
          id: string
          consultation_id: string
          subjective: string
          objective: string
          assessment: string
          plan: string
          updated_at: string
        }
      }
      prescriptions: {
        Row: {
          id: string
          consultation_id: string
          diagnosis: string | null
          medicine_items: Json
          lab_tests: Json
          follow_up_date: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
      }
      consultation_chat: {
        Row: {
          id: string
          consultation_id: string
          sender_role: 'doctor' | 'patient'
          sender_name: string | null
          message: string | null
          attachment_url: string | null
          created_at: string
        }
      }
    }
    Functions: {
      join_queue: {
        Args: { p_queue_id: string; p_name?: string; p_phone?: string; p_emergency_type?: string }
        Returns: Json
      }
      call_next: {
        Args: { p_queue_id: string }
        Returns: Json
      }
      mark_served: {
        Args: { p_ticket_id: string }
        Returns: Json
      }
      mark_no_show: {
        Args: { p_ticket_id: string }
        Returns: Json
      }
      bump_priority: {
        Args: { p_ticket_id: string; p_new_priority: number }
        Returns: Json
      }
      recall_ticket: {
        Args: { p_ticket_id: string }
        Returns: Json
      }
      add_manual_ticket: {
        Args: { p_queue_id: string; p_phone: string; p_priority?: number; p_name?: string }
        Returns: Json
      }
      undo_ticket_action: {
        Args: { p_ticket_id: string; p_revert_to_status: string }
        Returns: Json
      }
      toggle_queue_pause: {
        Args: { p_queue_id: string; p_is_paused: boolean }
        Returns: Json
      }
      leave_queue: {
        Args: { p_ticket_id: string }
        Returns: Json
      }
      book_appointment: {
        Args: { p_queue_id: string; p_name?: string; p_phone?: string; p_emergency_type?: string; p_date?: string; p_time?: string }
        Returns: Json
      }
      check_in_appointment: {
        Args: { p_appointment_id: string }
        Returns: Json
      }
      cancel_appointment: {
        Args: { p_appointment_id: string }
        Returns: Json
      }
      submit_rating: {
        Args: { p_queue_id: string; p_rating_value: number; p_ticket_id?: string; p_patient_name?: string; p_comment?: string; p_patient_phone?: string }
        Returns: Json
      }
      ensure_patient_profile: {
        Args: { p_phone: string; p_name?: string }
        Returns: Json
      }
      request_patient_otp: {
        Args: { p_phone: string; p_language?: string }
        Returns: Json
      }
      verify_patient_otp: {
        Args: { p_phone: string; p_code: string }
        Returns: Json
      }
      revoke_patient_session: {
        Args: { p_token: string }
        Returns: Json
      }
      reschedule_appointment: {
        Args: { p_appointment_id: string; p_new_date: string; p_new_time?: string }
        Returns: Json
      }
      book_video_consultation: {
        Args: { p_queue_id: string; p_phone: string; p_patient_id?: string; p_name?: string; p_date?: string; p_time?: string }
        Returns: Json
      }
      set_consultation_status: {
        Args: { p_consultation_id: string; p_status: string }
        Returns: Json
      }
      save_consultation_notes: {
        Args: { p_consultation_id: string; p_subjective?: string; p_objective?: string; p_assessment?: string; p_plan?: string }
        Returns: Json
      }
      save_prescription: {
        Args: { p_consultation_id: string; p_diagnosis?: string; p_medicine_items?: Json; p_lab_tests?: Json; p_follow_up_date?: string; p_notes?: string; p_created_by?: string }
        Returns: Json
      }
      submit_consultation_rating: {
        Args: { p_consultation_id: string; p_rating_value: number; p_comment?: string }
        Returns: Json
      }
      start_consult: {
        Args: { p_ticket_id: string }
        Returns: Json
      }
      complete_consult: {
        Args: { p_ticket_id: string }
        Returns: Json
      }
      request_assistance: {
        Args: { p_queue_id: string }
        Returns: Json
      }
      clear_assistance: {
        Args: { p_queue_id: string }
        Returns: Json
      }
    }
  }
}

export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type PatientProfile = Database["public"]["Tables"]["patient_profiles"]["Row"];
export type Bill = Database["public"]["Tables"]["bills"]["Row"];
export type Consultation = Database["public"]["Tables"]["consultations"]["Row"];
export type ConsultationNotes = Database["public"]["Tables"]["consultation_notes"]["Row"];
export type Prescription = Database["public"]["Tables"]["prescriptions"]["Row"];
export type ConsultationChatMessage = Database["public"]["Tables"]["consultation_chat"]["Row"];

// Legacy Type Aliases to support older components
export type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
export type Queue = Database["public"]["Tables"]["queues"]["Row"];
export type Rating = Database["public"]["Tables"]["ratings"]["Row"];
export type Admin = Database["public"]["Tables"]["admins"]["Row"];
export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type QueueActivityLog = Database["public"]["Tables"]["queue_activity_log"]["Row"];
export type TicketStatus = Ticket["status"];
export type CallNextResponse = any;
export type MarkServedResponse = any;
export type MarkNoShowResponse = any;
