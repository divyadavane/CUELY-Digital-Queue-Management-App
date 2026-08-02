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
    }
  }
}

export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

// Legacy Type Aliases to support older components
export type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
export type Queue = Database["public"]["Tables"]["queues"]["Row"];
export type Admin = Database["public"]["Tables"]["admins"]["Row"];
export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type QueueActivityLog = Database["public"]["Tables"]["queue_activity_log"]["Row"];
export type TicketStatus = Ticket["status"];
export type CallNextResponse = any;
export type MarkServedResponse = any;
export type MarkNoShowResponse = any;
