/**
 * Supabase database types.
 *
 * Transcribed by hand from supabase/migrations/* (the authoritative schema) so
 * the typed Supabase clients and repositories are checked against real tables,
 * columns, enums, and the apply_approval_transition RPC — instead of `any`.
 *
 * This is drop-in compatible with the generator. Regenerate the canonical file
 * any time the schema changes (it will replace this one wholesale):
 *
 *   npm run db:types          # supabase gen types typescript --local   (needs Docker)
 *   npm run db:types:linked   # against a linked cloud project
 *
 * CI enforces that this file matches the migrations (see .github/workflows).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          name: string;
          slug: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          country: string | null;
          status: Database["public"]["Enums"]["school_status"];
          subscription_tier: string | null;
          trial_ends_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          country?: string | null;
          status?: Database["public"]["Enums"]["school_status"];
          subscription_tier?: string | null;
          trial_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          country?: string | null;
          status?: Database["public"]["Enums"]["school_status"];
          subscription_tier?: string | null;
          trial_ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      school_settings: {
        Row: {
          school_id: string;
          logo_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          timezone: string;
          locale: string;
          approval_policy: Database["public"]["Enums"]["approval_policy"];
          fee_gating_enabled: boolean;
          feature_flags: Json;
          principal_signature_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          school_id: string;
          logo_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          timezone?: string;
          locale?: string;
          approval_policy?: Database["public"]["Enums"]["approval_policy"];
          fee_gating_enabled?: boolean;
          feature_flags?: Json;
          principal_signature_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          school_id?: string;
          logo_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          timezone?: string;
          locale?: string;
          approval_policy?: Database["public"]["Enums"]["approval_policy"];
          fee_gating_enabled?: boolean;
          feature_flags?: Json;
          principal_signature_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          school_id: string | null;
          full_name: string;
          email: string | null;
          phone: string | null;
          status: string;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          school_id?: string | null;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          status?: string;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string | null;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          status?: string;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          school_id: string | null;
          key: string;
          name: string;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id?: string | null;
          key: string;
          name: string;
          is_system?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string | null;
          key?: string;
          name?: string;
          is_system?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      permissions: {
        Row: { id: string; key: string; description: string | null };
        Insert: { id?: string; key: string; description?: string | null };
        Update: { id?: string; key?: string; description?: string | null };
        Relationships: [];
      };
      role_permissions: {
        Row: { role_id: string; permission_id: string };
        Insert: { role_id: string; permission_id: string };
        Update: { role_id?: string; permission_id?: string };
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          user_id: string;
          role_id: string;
          school_id: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role_id: string;
          school_id?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role_id?: string;
          school_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          starts_on: string | null;
          ends_on: string | null;
          is_current: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          name: string;
          starts_on?: string | null;
          ends_on?: string | null;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          name?: string;
          starts_on?: string | null;
          ends_on?: string | null;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      terms: {
        Row: {
          id: string;
          school_id: string;
          session_id: string;
          name: string;
          sequence: number;
          starts_on: string | null;
          ends_on: string | null;
          is_current: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          session_id: string;
          name: string;
          sequence: number;
          starts_on?: string | null;
          ends_on?: string | null;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          session_id?: string;
          name?: string;
          sequence?: number;
          starts_on?: string | null;
          ends_on?: string | null;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "terms_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      classes: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          level: Database["public"]["Enums"]["school_level"];
          arm: string | null;
          grade_order: number;
          form_teacher_id: string | null;
          next_class_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          name: string;
          level: Database["public"]["Enums"]["school_level"];
          arm?: string | null;
          grade_order?: number;
          form_teacher_id?: string | null;
          next_class_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          name?: string;
          level?: Database["public"]["Enums"]["school_level"];
          arm?: string | null;
          grade_order?: number;
          form_teacher_id?: string | null;
          next_class_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          code: string;
          category: Database["public"]["Enums"]["subject_category"];
          applies_to_levels: Database["public"]["Enums"]["school_level"][];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          name: string;
          code: string;
          category?: Database["public"]["Enums"]["subject_category"];
          applies_to_levels?: Database["public"]["Enums"]["school_level"][];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          name?: string;
          code?: string;
          category?: Database["public"]["Enums"]["subject_category"];
          applies_to_levels?: Database["public"]["Enums"]["school_level"][];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      class_subjects: {
        Row: {
          id: string;
          school_id: string;
          class_id: string;
          subject_id: string;
          term_id: string;
          teacher_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          class_id: string;
          subject_id: string;
          term_id: string;
          teacher_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          class_id?: string;
          subject_id?: string;
          term_id?: string;
          teacher_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          school_id: string;
          user_id: string | null;
          admission_no: string;
          first_name: string;
          last_name: string;
          other_names: string | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          date_of_birth: string | null;
          photo_url: string | null;
          status: Database["public"]["Enums"]["student_status"];
          current_class_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          user_id?: string | null;
          admission_no: string;
          first_name: string;
          last_name: string;
          other_names?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          date_of_birth?: string | null;
          photo_url?: string | null;
          status?: Database["public"]["Enums"]["student_status"];
          current_class_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          user_id?: string | null;
          admission_no?: string;
          first_name?: string;
          last_name?: string;
          other_names?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          date_of_birth?: string | null;
          photo_url?: string | null;
          status?: Database["public"]["Enums"]["student_status"];
          current_class_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      guardians: {
        Row: {
          id: string;
          school_id: string;
          user_id: string | null;
          full_name: string;
          phone: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          user_id?: string | null;
          full_name: string;
          phone?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          user_id?: string | null;
          full_name?: string;
          phone?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      student_guardians: {
        Row: {
          student_id: string;
          guardian_id: string;
          school_id: string;
          relationship: string | null;
          is_primary: boolean;
        };
        Insert: {
          student_id: string;
          guardian_id: string;
          school_id: string;
          relationship?: string | null;
          is_primary?: boolean;
        };
        Update: {
          student_id?: string;
          guardian_id?: string;
          school_id?: string;
          relationship?: string | null;
          is_primary?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "student_guardians_guardian_id_fkey";
            columns: ["guardian_id"];
            isOneToOne: false;
            referencedRelation: "guardians";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          id: string;
          school_id: string;
          student_id: string;
          class_id: string;
          session_id: string;
          term_id: string;
          roll_no: number | null;
          status: Database["public"]["Enums"]["enrollment_status"];
          enrolled_on: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          student_id: string;
          class_id: string;
          session_id: string;
          term_id: string;
          roll_no?: number | null;
          status?: Database["public"]["Enums"]["enrollment_status"];
          enrolled_on?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          student_id?: string;
          class_id?: string;
          session_id?: string;
          term_id?: string;
          roll_no?: number | null;
          status?: Database["public"]["Enums"]["enrollment_status"];
          enrolled_on?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      staff: {
        Row: {
          id: string;
          school_id: string;
          user_id: string | null;
          staff_no: string;
          full_name: string;
          phone: string | null;
          qualification: string | null;
          status: Database["public"]["Enums"]["staff_status"];
          is_teaching: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          user_id?: string | null;
          staff_no: string;
          full_name: string;
          phone?: string | null;
          qualification?: string | null;
          status?: Database["public"]["Enums"]["staff_status"];
          is_teaching?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          user_id?: string | null;
          staff_no?: string;
          full_name?: string;
          phone?: string | null;
          qualification?: string | null;
          status?: Database["public"]["Enums"]["staff_status"];
          is_teaching?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      grading_systems: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          session_id: string | null;
          level: Database["public"]["Enums"]["school_level"] | null;
          is_active: boolean;
          rounding_dp: number;
          tie_strategy: Database["public"]["Enums"]["tie_strategy"];
          exclude_absent_from_rank: boolean;
          pass_mark: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          name: string;
          session_id?: string | null;
          level?: Database["public"]["Enums"]["school_level"] | null;
          is_active?: boolean;
          rounding_dp?: number;
          tie_strategy?: Database["public"]["Enums"]["tie_strategy"];
          exclude_absent_from_rank?: boolean;
          pass_mark?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          name?: string;
          session_id?: string | null;
          level?: Database["public"]["Enums"]["school_level"] | null;
          is_active?: boolean;
          rounding_dp?: number;
          tie_strategy?: Database["public"]["Enums"]["tie_strategy"];
          exclude_absent_from_rank?: boolean;
          pass_mark?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      grade_bands: {
        Row: {
          id: string;
          school_id: string;
          grading_system_id: string;
          min_score: number;
          max_score: number;
          grade: string;
          remark: string;
          grade_point: number | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          school_id: string;
          grading_system_id: string;
          min_score: number;
          max_score: number;
          grade: string;
          remark?: string;
          grade_point?: number | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          school_id?: string;
          grading_system_id?: string;
          min_score?: number;
          max_score?: number;
          grade?: string;
          remark?: string;
          grade_point?: number | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "grade_bands_grading_system_id_fkey";
            columns: ["grading_system_id"];
            isOneToOne: false;
            referencedRelation: "grading_systems";
            referencedColumns: ["id"];
          },
        ];
      };
      assessment_schemes: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          session_id: string | null;
          level: Database["public"]["Enums"]["school_level"] | null;
          total_obtainable: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          name: string;
          session_id?: string | null;
          level?: Database["public"]["Enums"]["school_level"] | null;
          total_obtainable?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          name?: string;
          session_id?: string | null;
          level?: Database["public"]["Enums"]["school_level"] | null;
          total_obtainable?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      assessment_components: {
        Row: {
          id: string;
          school_id: string;
          scheme_id: string;
          key: string;
          label: string;
          max_score: number;
          is_exam: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          school_id: string;
          scheme_id: string;
          key: string;
          label: string;
          max_score: number;
          is_exam?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          school_id?: string;
          scheme_id?: string;
          key?: string;
          label?: string;
          max_score?: number;
          is_exam?: boolean;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_components_scheme_id_fkey";
            columns: ["scheme_id"];
            isOneToOne: false;
            referencedRelation: "assessment_schemes";
            referencedColumns: ["id"];
          },
        ];
      };
      scores: {
        Row: {
          id: string;
          school_id: string;
          enrollment_id: string;
          class_subject_id: string;
          assessment_component_id: string;
          term_id: string;
          score: number | null;
          is_absent: boolean;
          is_exempt: boolean;
          status: Database["public"]["Enums"]["score_status"];
          entered_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          enrollment_id: string;
          class_subject_id: string;
          assessment_component_id: string;
          term_id: string;
          score?: number | null;
          is_absent?: boolean;
          is_exempt?: boolean;
          status?: Database["public"]["Enums"]["score_status"];
          entered_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          enrollment_id?: string;
          class_subject_id?: string;
          assessment_component_id?: string;
          term_id?: string;
          score?: number | null;
          is_absent?: boolean;
          is_exempt?: boolean;
          status?: Database["public"]["Enums"]["score_status"];
          entered_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      results: {
        Row: {
          id: string;
          school_id: string;
          enrollment_id: string;
          class_subject_id: string;
          subject_id: string;
          term_id: string;
          ca_total: number;
          exam_score: number;
          total: number;
          grade: string | null;
          grade_point: number | null;
          remark: string | null;
          subject_position: number | null;
          subject_count: number | null;
          is_absent: boolean;
          config_snapshot: Json | null;
          computed_at: string | null;
          status: Database["public"]["Enums"]["result_status"];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          enrollment_id: string;
          class_subject_id: string;
          subject_id: string;
          term_id: string;
          ca_total?: number;
          exam_score?: number;
          total?: number;
          grade?: string | null;
          grade_point?: number | null;
          remark?: string | null;
          subject_position?: number | null;
          subject_count?: number | null;
          is_absent?: boolean;
          config_snapshot?: Json | null;
          computed_at?: string | null;
          status?: Database["public"]["Enums"]["result_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          enrollment_id?: string;
          class_subject_id?: string;
          subject_id?: string;
          term_id?: string;
          ca_total?: number;
          exam_score?: number;
          total?: number;
          grade?: string | null;
          grade_point?: number | null;
          remark?: string | null;
          subject_position?: number | null;
          subject_count?: number | null;
          is_absent?: boolean;
          config_snapshot?: Json | null;
          computed_at?: string | null;
          status?: Database["public"]["Enums"]["result_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      term_results: {
        Row: {
          id: string;
          school_id: string;
          enrollment_id: string;
          class_id: string;
          term_id: string;
          subjects_count: number;
          total_obtainable: number;
          total_obtained: number;
          average: number | null;
          class_position: number | null;
          class_size: number | null;
          grade_overall: string | null;
          attendance_present: number | null;
          attendance_total: number | null;
          promotion_status: Database["public"]["Enums"]["promotion_status"];
          class_teacher_remark: string | null;
          principal_remark: string | null;
          traits: Json | null;
          config_snapshot: Json | null;
          computed_at: string | null;
          published_at: string | null;
          status: Database["public"]["Enums"]["result_status"];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          enrollment_id: string;
          class_id: string;
          term_id: string;
          subjects_count?: number;
          total_obtainable?: number;
          total_obtained?: number;
          average?: number | null;
          class_position?: number | null;
          class_size?: number | null;
          grade_overall?: string | null;
          attendance_present?: number | null;
          attendance_total?: number | null;
          promotion_status?: Database["public"]["Enums"]["promotion_status"];
          class_teacher_remark?: string | null;
          principal_remark?: string | null;
          traits?: Json | null;
          config_snapshot?: Json | null;
          computed_at?: string | null;
          published_at?: string | null;
          status?: Database["public"]["Enums"]["result_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          enrollment_id?: string;
          class_id?: string;
          term_id?: string;
          subjects_count?: number;
          total_obtainable?: number;
          total_obtained?: number;
          average?: number | null;
          class_position?: number | null;
          class_size?: number | null;
          grade_overall?: string | null;
          attendance_present?: number | null;
          attendance_total?: number | null;
          promotion_status?: Database["public"]["Enums"]["promotion_status"];
          class_teacher_remark?: string | null;
          principal_remark?: string | null;
          traits?: Json | null;
          config_snapshot?: Json | null;
          computed_at?: string | null;
          published_at?: string | null;
          status?: Database["public"]["Enums"]["result_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      score_history: {
        Row: {
          id: string;
          school_id: string;
          score_id: string;
          enrollment_id: string | null;
          class_subject_id: string | null;
          assessment_component_id: string | null;
          old_value: number | null;
          new_value: number | null;
          old_is_absent: boolean | null;
          new_is_absent: boolean | null;
          changed_by: string | null;
          reason: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          score_id: string;
          enrollment_id?: string | null;
          class_subject_id?: string | null;
          assessment_component_id?: string | null;
          old_value?: number | null;
          new_value?: number | null;
          old_is_absent?: boolean | null;
          new_is_absent?: boolean | null;
          changed_by?: string | null;
          reason?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          score_id?: string;
          enrollment_id?: string | null;
          class_subject_id?: string | null;
          assessment_component_id?: string | null;
          old_value?: number | null;
          new_value?: number | null;
          old_is_absent?: boolean | null;
          new_is_absent?: boolean | null;
          changed_by?: string | null;
          reason?: string | null;
          changed_at?: string;
        };
        Relationships: [];
      };
      approvals: {
        Row: {
          id: string;
          school_id: string;
          subject_type: Database["public"]["Enums"]["approval_subject_type"];
          subject_id: string;
          term_id: string;
          state: Database["public"]["Enums"]["approval_state"];
          submitted_by: string | null;
          submitted_at: string | null;
          approved_by: string | null;
          approved_at: string | null;
          published_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          subject_type: Database["public"]["Enums"]["approval_subject_type"];
          subject_id: string;
          term_id: string;
          state?: Database["public"]["Enums"]["approval_state"];
          submitted_by?: string | null;
          submitted_at?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          published_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          subject_type?: Database["public"]["Enums"]["approval_subject_type"];
          subject_id?: string;
          term_id?: string;
          state?: Database["public"]["Enums"]["approval_state"];
          submitted_by?: string | null;
          submitted_at?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          published_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      approval_events: {
        Row: {
          id: string;
          school_id: string;
          approval_id: string;
          from_state: Database["public"]["Enums"]["approval_state"] | null;
          to_state: Database["public"]["Enums"]["approval_state"];
          actor_id: string | null;
          actor_role: string | null;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          approval_id: string;
          from_state?: Database["public"]["Enums"]["approval_state"] | null;
          to_state: Database["public"]["Enums"]["approval_state"];
          actor_id?: string | null;
          actor_role?: string | null;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          approval_id?: string;
          from_state?: Database["public"]["Enums"]["approval_state"] | null;
          to_state?: Database["public"]["Enums"]["approval_state"];
          actor_id?: string | null;
          actor_role?: string | null;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "approval_events_approval_id_fkey";
            columns: ["approval_id"];
            isOneToOne: false;
            referencedRelation: "approvals";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          school_id: string | null;
          actor_id: string | null;
          actor_role: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          ip: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id?: string | null;
          actor_id?: string | null;
          actor_role?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string | null;
          actor_id?: string | null;
          actor_role?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          school_id: string;
          recipient_user_id: string | null;
          channel: Database["public"]["Enums"]["notification_channel"];
          type: string;
          payload: Json;
          status: Database["public"]["Enums"]["notification_status"];
          sent_at: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          recipient_user_id?: string | null;
          channel?: Database["public"]["Enums"]["notification_channel"];
          type: string;
          payload?: Json;
          status?: Database["public"]["Enums"]["notification_status"];
          sent_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          recipient_user_id?: string | null;
          channel?: Database["public"]["Enums"]["notification_channel"];
          type?: string;
          payload?: Json;
          status?: Database["public"]["Enums"]["notification_status"];
          sent_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      cumulative_results: {
        Row: {
          id: string;
          school_id: string;
          student_id: string;
          class_id: string;
          session_id: string;
          terms_count: number;
          cumulative_average: number | null;
          annual_position: number | null;
          class_size: number | null;
          promotion_status: Database["public"]["Enums"]["promotion_status"];
          next_class_id: string | null;
          config_snapshot: Json | null;
          computed_at: string | null;
          status: Database["public"]["Enums"]["result_status"];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          student_id: string;
          class_id: string;
          session_id: string;
          terms_count?: number;
          cumulative_average?: number | null;
          annual_position?: number | null;
          class_size?: number | null;
          promotion_status?: Database["public"]["Enums"]["promotion_status"];
          next_class_id?: string | null;
          config_snapshot?: Json | null;
          computed_at?: string | null;
          status?: Database["public"]["Enums"]["result_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          student_id?: string;
          class_id?: string;
          session_id?: string;
          terms_count?: number;
          cumulative_average?: number | null;
          annual_position?: number | null;
          class_size?: number | null;
          promotion_status?: Database["public"]["Enums"]["promotion_status"];
          next_class_id?: string | null;
          config_snapshot?: Json | null;
          computed_at?: string | null;
          status?: Database["public"]["Enums"]["result_status"];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      fee_status: {
        Row: {
          id: string;
          school_id: string;
          enrollment_id: string;
          term_id: string;
          status: string;
          note: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          enrollment_id: string;
          term_id: string;
          status?: string;
          note?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          enrollment_id?: string;
          term_id?: string;
          status?: string;
          note?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          school_id: string;
          plan: string;
          status: string;
          provider: string;
          customer_code: string | null;
          subscription_code: string | null;
          amount: number | null;
          currency: string;
          current_period_end: string | null;
          last_payment_at: string | null;
          students_paid_for: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          plan?: string;
          status?: string;
          provider?: string;
          customer_code?: string | null;
          subscription_code?: string | null;
          amount?: number | null;
          currency?: string;
          current_period_end?: string | null;
          last_payment_at?: string | null;
          students_paid_for?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          plan?: string;
          status?: string;
          provider?: string;
          customer_code?: string | null;
          subscription_code?: string | null;
          amount?: number | null;
          currency?: string;
          current_period_end?: string | null;
          last_payment_at?: string | null;
          students_paid_for?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: true;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      trait_definitions: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          category: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          name: string;
          category?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          name?: string;
          category?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_events: {
        Row: {
          id: string;
          school_id: string | null;
          provider: string;
          reference: string;
          event_type: string;
          amount: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id?: string | null;
          provider?: string;
          reference: string;
          event_type: string;
          amount?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string | null;
          provider?: string;
          reference?: string;
          event_type?: string;
          amount?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_events_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      apply_approval_transition: {
        Args: {
          p_school_id: string;
          p_class_id: string;
          p_term_id: string;
          p_to: Database["public"]["Enums"]["approval_state"];
          p_from: Database["public"]["Enums"]["approval_state"];
          p_actor_id: string;
          p_actor_role: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: {
      school_status: "trial" | "active" | "suspended" | "cancelled";
      approval_policy: "one_step" | "two_step";
      school_level: "primary" | "junior_secondary" | "senior_secondary";
      gender: "male" | "female";
      student_status: "active" | "graduated" | "withdrawn" | "transferred";
      enrollment_status: "active" | "left";
      staff_status: "active" | "inactive" | "suspended";
      subject_category: "core" | "elective";
      score_status: "draft" | "submitted";
      result_status: "computed" | "published";
      approval_state: "draft" | "submitted" | "l1_approved" | "approved" | "published" | "returned";
      approval_subject_type: "class_subject_result" | "term_result" | "class";
      promotion_status: "promoted" | "repeat" | "pending" | "na";
      notification_channel: "in_app" | "email" | "sms" | "whatsapp";
      notification_status: "pending" | "sent" | "failed" | "read";
      tie_strategy: "dense" | "standard";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ── Generic helpers (match the Supabase generator output) ───────────────────
type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
