export type BookingStatus =
  | "new"
  | "assigned"
  | "en_route"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";

export type IssueType =
  | "screen_repair"
  | "battery"
  | "water_damage"
  | "charging_port"
  | "other";

export type TimeWindow = "morning" | "afternoon" | "evening";

export type PaymentProvider = "paymongo_gcash" | "paymongo_maya";

export type AppRole = "admin" | "technician";

export interface Profile {
  id: string;
  role: AppRole;
  full_name: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  address_lat: number | null;
  address_lng: number | null;
  created_at: string;
}

export interface Technician {
  id: string;
  profile_id: string | null;
  name: string;
  phone: string;
  service_zone: string;
  branch: string | null;
  lat: number | null;
  lng: number | null;
  active_status: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  reference_number: string;
  customer_id: string;
  device_info: string;
  issue_type: IssueType;
  issue_details: string | null;
  notes: string | null;
  photo_url: string | null;
  preferred_date: string;
  preferred_time: TimeWindow;
  status: BookingStatus;
  payment_status: PaymentStatus;
  amount: number;
  technician_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  provider: PaymentProvider;
  provider_reference: string | null;
  amount: number;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
}

export interface FollowUpNote {
  id: string;
  customer_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Customer>;
      };
      technicians: {
        Row: Technician;
        Insert: Omit<Technician, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Technician>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Booking>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Payment>;
      };
      follow_up_notes: {
        Row: FollowUpNote;
        Insert: Omit<FollowUpNote, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<FollowUpNote>;
      };
    };
  };
}
