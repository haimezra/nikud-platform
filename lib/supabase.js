import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ─── AUTH HELPERS ─────────────────────────────────────────────
export async function signUp({ email, password, name, role, school_id, class_name }) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  await supabase.from('users').insert({
    id: data.user.id,
    name, role, email, school_id, class_name,
    points: 0,
    created_at: new Date().toISOString()
  })
  return data
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
  return data
}

// ─── STUDENTS ────────────────────────────────────────────────
export async function getStudentsByClass(school_id, class_name) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, points, class_name')
    .eq('school_id', school_id)
    .eq('class_name', class_name)
    .eq('role', 'student')
    .order('name')
  if (error) throw error
  return data
}

export async function getStudentProfile(student_id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', student_id)
    .single()
  if (error) throw error
  return data
}

export async function getStudentActivity(student_id) {
  const { data, error } = await supabase
    .from('point_logs')
    .select('*, lessons(subject, teacher_name)')
    .eq('student_id', student_id)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data
}

export async function getClassLeaderboard(school_id, class_name) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, points')
    .eq('school_id', school_id)
    .eq('class_name', class_name)
    .eq('role', 'student')
    .order('points', { ascending: false })
    .limit(10)
  if (error) throw error
  return data
}

// ─── LESSONS ─────────────────────────────────────────────────
export async function createLesson({ teacher_id, school_id, class_name, subject }) {
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      teacher_id, school_id, class_name, subject,
      status: 'active',
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getActiveLesson(teacher_id) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('teacher_id', teacher_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (error) return null
  return data
}

// ─── POINTS ──────────────────────────────────────────────────
export async function distributePoints(lesson_id, approvals) {
  // approvals = [{ student_id, points, reason }]
  const logs = approvals.map(a => ({
    lesson_id,
    student_id: a.student_id,
    points: a.points,
    reason: a.reason,
    created_at: new Date().toISOString()
  }))

  // Insert logs
  const { error: logError } = await supabase.from('point_logs').insert(logs)
  if (logError) throw logError

  // Update each student's total
  for (const a of approvals) {
    if (a.points === 0) continue
    const { data: student } = await supabase
      .from('users').select('points').eq('id', a.student_id).single()
    await supabase
      .from('users')
      .update({ points: (student?.points || 0) + a.points })
      .eq('id', a.student_id)
  }

  // Close lesson
  await supabase.from('lessons').update({ status: 'completed' }).eq('id', lesson_id)
  return true
}

// ─── STORE ───────────────────────────────────────────────────
export async function getStoreItems() {
  const { data, error } = await supabase
    .from('store_items')
    .select('*')
    .eq('active', true)
    .order('points_cost')
  if (error) throw error
  return data
}

export async function purchaseItem(student_id, item_id, points_cost) {
  const { data: student } = await supabase
    .from('users').select('points').eq('id', student_id).single()

  if ((student?.points || 0) < points_cost) throw new Error('אין מספיק נקודות')

  await supabase.from('purchases').insert({
    student_id, item_id,
    points_spent: points_cost,
    created_at: new Date().toISOString()
  })

  await supabase
    .from('users')
    .update({ points: student.points - points_cost })
    .eq('id', student_id)

  return true
}

// ─── SCHOOL DASHBOARD ────────────────────────────────────────
export async function getSchoolStats(school_id) {
  const { count: totalStudents } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', school_id)
    .eq('role', 'student')

  const today = new Date().toISOString().split('T')[0]
  const { count: todayLessons } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', school_id)
    .gte('created_at', today)

  const { data: pointsToday } = await supabase
    .from('point_logs')
    .select('points')
    .gte('created_at', today)

  const totalPtsToday = pointsToday?.reduce((s, r) => s + r.points, 0) || 0

  return { totalStudents, todayLessons, totalPtsToday }
}

export async function getClassAttendance(school_id) {
  const { data, error } = await supabase
    .from('lessons')
    .select('class_name, point_logs(count)')
    .eq('school_id', school_id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}
