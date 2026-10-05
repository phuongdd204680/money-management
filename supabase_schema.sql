-- ==============================================================================
-- FINFLOW 6 JARS - SUPABASE DATABASE SCHEMA
-- Chạy đoạn mã SQL này trong mục "SQL Editor" trên bảng điều khiển Supabase của bạn.
-- ==============================================================================

-- 1. Tạo bảng lưu trữ dữ liệu tài chính của người dùng
CREATE TABLE IF NOT EXISTS public.user_financial_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Kích hoạt Row Level Security (RLS) để bảo vệ dữ liệu riêng tư
ALTER TABLE public.user_financial_data ENABLE ROW LEVEL SECURITY;

-- 3. Tạo chính sách bảo mật: Người dùng chỉ có quyền xem dữ liệu của chính mình
CREATE POLICY "Users can read own financial data"
    ON public.user_financial_data
    FOR SELECT
    USING (auth.uid() = user_id);

-- 4. Tạo chính sách bảo mật: Người dùng chỉ có quyền thêm hoặc cập nhật dữ liệu của mình
CREATE POLICY "Users can insert or update own financial data"
    ON public.user_financial_data
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Hoàn tất! Bảng user_financial_data đã sẵn sàng đồng bộ dữ liệu đa thiết bị an toàn.
