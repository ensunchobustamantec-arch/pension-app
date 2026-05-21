import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jwkrshpgeahkzdshcrle.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a3JzaHBnZWFoa3pkc2hjcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMjI3NTEsImV4cCI6MjA5NDg5ODc1MX0.KqQRGfA6CjefiY6SUoY2GLitQEVKp_zNaaFjXBqDmyo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
