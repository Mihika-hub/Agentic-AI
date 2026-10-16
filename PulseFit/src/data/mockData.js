// Realistic mock data for PulseFit. Replace with API calls when a backend exists.

export const user = {
  name: 'Alex Rivera',
  handle: '@alexlifts',
  avatar: 'https://i.pravatar.cc/240?img=12',
  membership: 'Pulse Elite',
  memberSince: 'March 2024',
  level: 14,
  xp: 7420,
  xpNext: 9000,
  streak: 12,
  bestStreak: 31,
  stats: { workouts: 186, hours: 214, prs: 23, classes: 41 },
}

export const communityStats = [
  { label: 'Active members', value: 48250, suffix: '+', icon: 'Users' },
  { label: 'Workouts completed', value: 1260000, suffix: '+', icon: 'Dumbbell' },
  { label: 'Classes this week', value: 342, suffix: '', icon: 'Calendar' },
]

export const weeklyActivity = [
  { day: 'Mon', minutes: 52 },
  { day: 'Tue', minutes: 38 },
  { day: 'Wed', minutes: 64 },
  { day: 'Thu', minutes: 0 },
  { day: 'Fri', minutes: 45 },
  { day: 'Sat', minutes: 72 },
  { day: 'Sun', minutes: 28 },
]

export const weeklyRings = [
  { key: 'workouts', label: 'Workouts', value: 4, goal: 5, unit: '', color: '#C6FF3D' },
  { key: 'minutes', label: 'Active min', value: 299, goal: 360, unit: '', color: '#22E4FF' },
  { key: 'goals', label: 'Goals hit', value: 7, goal: 10, unit: '', color: '#FF6B4A' },
]

export const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

export const exercises = [
  { id: 'bench', name: 'Barbell Bench Press', group: 'Chest', sets: 4, reps: '6-8', difficulty: 'Advanced', rest: 120, equipment: 'Barbell', kcal: 95 },
  { id: 'incline-db', name: 'Incline Dumbbell Press', group: 'Chest', sets: 3, reps: '8-10', difficulty: 'Intermediate', rest: 90, equipment: 'Dumbbells', kcal: 80 },
  { id: 'pushup', name: 'Tempo Push-Ups', group: 'Chest', sets: 3, reps: '12-15', difficulty: 'Beginner', rest: 60, equipment: 'Bodyweight', kcal: 55 },
  { id: 'cable-fly', name: 'Cable Chest Fly', group: 'Chest', sets: 3, reps: '12', difficulty: 'Intermediate', rest: 60, equipment: 'Cable', kcal: 50 },
  { id: 'deadlift', name: 'Conventional Deadlift', group: 'Back', sets: 5, reps: '5', difficulty: 'Advanced', rest: 180, equipment: 'Barbell', kcal: 130 },
  { id: 'pullup', name: 'Weighted Pull-Ups', group: 'Back', sets: 4, reps: '6-8', difficulty: 'Advanced', rest: 120, equipment: 'Pull-up Bar', kcal: 85 },
  { id: 'row', name: 'Seated Cable Row', group: 'Back', sets: 3, reps: '10-12', difficulty: 'Beginner', rest: 75, equipment: 'Cable', kcal: 60 },
  { id: 'squat', name: 'Back Squat', group: 'Legs', sets: 5, reps: '5', difficulty: 'Advanced', rest: 180, equipment: 'Barbell', kcal: 140 },
  { id: 'rdl', name: 'Romanian Deadlift', group: 'Legs', sets: 4, reps: '8', difficulty: 'Intermediate', rest: 120, equipment: 'Barbell', kcal: 110 },
  { id: 'lunge', name: 'Walking Lunges', group: 'Legs', sets: 3, reps: '12 / leg', difficulty: 'Beginner', rest: 60, equipment: 'Dumbbells', kcal: 90 },
  { id: 'curl', name: 'Incline Dumbbell Curl', group: 'Arms', sets: 3, reps: '10-12', difficulty: 'Beginner', rest: 60, equipment: 'Dumbbells', kcal: 40 },
  { id: 'dips', name: 'Parallel Bar Dips', group: 'Arms', sets: 3, reps: '8-12', difficulty: 'Intermediate', rest: 90, equipment: 'Dip Station', kcal: 60 },
  { id: 'skull', name: 'EZ-Bar Skull Crushers', group: 'Arms', sets: 3, reps: '10', difficulty: 'Intermediate', rest: 75, equipment: 'EZ Bar', kcal: 45 },
  { id: 'plank', name: 'Plank Hold', group: 'Core', sets: 3, reps: '60 sec', difficulty: 'Beginner', rest: 45, equipment: 'Bodyweight', kcal: 30 },
  { id: 'hanging', name: 'Hanging Leg Raises', group: 'Core', sets: 3, reps: '10-12', difficulty: 'Intermediate', rest: 60, equipment: 'Pull-up Bar', kcal: 45 },
  { id: 'abwheel', name: 'Ab Wheel Rollouts', group: 'Core', sets: 3, reps: '8-10', difficulty: 'Advanced', rest: 75, equipment: 'Ab Wheel', kcal: 45 },
  { id: 'intervals', name: 'Rower Intervals', group: 'Cardio', sets: 8, reps: '250 m', difficulty: 'Intermediate', rest: 60, equipment: 'Rower', kcal: 180 },
  { id: 'sled', name: 'Sled Push Sprints', group: 'Cardio', sets: 6, reps: '20 m', difficulty: 'Advanced', rest: 90, equipment: 'Sled', kcal: 160 },
  { id: 'jumprope', name: 'Jump Rope Rounds', group: 'Cardio', sets: 5, reps: '90 sec', difficulty: 'Beginner', rest: 45, equipment: 'Jump Rope', kcal: 120 },
]

export const todaysWorkout = {
  title: 'Upper Body Power',
  subtitle: 'Push focus · Week 6 of Strength Block',
  duration: 48,
  kcal: 420,
  exercises: [
    { id: 'bench', name: 'Barbell Bench Press', sets: 4, reps: '6-8', weight: '82.5 kg', rest: 90 },
    { id: 'incline-db', name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', weight: '30 kg', rest: 75 },
    { id: 'pullup', name: 'Weighted Pull-Ups', sets: 3, reps: '6-8', weight: '+10 kg', rest: 90 },
    { id: 'dips', name: 'Parallel Bar Dips', sets: 3, reps: '10', weight: 'Bodyweight', rest: 60 },
  ],
}

export const strengthHistory = [
  { month: 'May', bench: 65, squat: 90, deadlift: 115 },
  { month: 'Jun', bench: 67.5, squat: 95, deadlift: 122.5 },
  { month: 'Jul', bench: 70, squat: 100, deadlift: 130 },
  { month: 'Aug', bench: 72.5, squat: 107.5, deadlift: 135 },
  { month: 'Sep', bench: 77.5, squat: 112.5, deadlift: 145 },
  { month: 'Oct', bench: 82.5, squat: 120, deadlift: 155 },
]

export const personalRecords = [
  { lift: 'Deadlift', value: '155 kg', date: 'Oct 12', delta: '+10 kg', tier: 'gold' },
  { lift: 'Back Squat', value: '120 kg', date: 'Oct 08', delta: '+7.5 kg', tier: 'gold' },
  { lift: 'Bench Press', value: '82.5 kg', date: 'Oct 03', delta: '+5 kg', tier: 'silver' },
  { lift: '5K Run', value: '22:41', date: 'Sep 27', delta: '-48 s', tier: 'silver' },
  { lift: 'Pull-Ups', value: '18 reps', date: 'Sep 19', delta: '+3 reps', tier: 'bronze' },
  { lift: 'Plank', value: '4:10', date: 'Sep 02', delta: '+40 s', tier: 'bronze' },
]

export const classTypes = {
  Yoga: { color: '#A78BFA' },
  HIIT: { color: '#FF6B4A' },
  Spin: { color: '#22E4FF' },
  Boxing: { color: '#C6FF3D' },
}

export const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const classes = [
  { id: 1, day: 'Mon', time: '06:30', type: 'HIIT', name: 'Sunrise Burn', coach: 'Maya Chen', duration: 45, spots: 4, capacity: 20, room: 'Studio A' },
  { id: 2, day: 'Mon', time: '12:15', type: 'Yoga', name: 'Lunch Flow', coach: 'Priya Nair', duration: 50, spots: 9, capacity: 18, room: 'Zen Room' },
  { id: 3, day: 'Mon', time: '18:30', type: 'Boxing', name: 'Fight Club Fundamentals', coach: 'Marcus Cole', duration: 60, spots: 0, capacity: 16, room: 'The Ring' },
  { id: 4, day: 'Tue', time: '07:00', type: 'Spin', name: 'Climb & Sprint', coach: 'Jonas Berg', duration: 45, spots: 2, capacity: 24, room: 'Cycle Lab' },
  { id: 5, day: 'Tue', time: '19:00', type: 'Yoga', name: 'Deep Stretch', coach: 'Priya Nair', duration: 60, spots: 12, capacity: 18, room: 'Zen Room' },
  { id: 6, day: 'Wed', time: '06:30', type: 'Boxing', name: 'Heavy Bag Rounds', coach: 'Marcus Cole', duration: 45, spots: 6, capacity: 16, room: 'The Ring' },
  { id: 7, day: 'Wed', time: '17:45', type: 'HIIT', name: 'Tabata Inferno', coach: 'Maya Chen', duration: 30, spots: 3, capacity: 20, room: 'Studio A' },
  { id: 8, day: 'Thu', time: '07:00', type: 'Yoga', name: 'Power Vinyasa', coach: 'Lena Ortiz', duration: 60, spots: 7, capacity: 18, room: 'Zen Room' },
  { id: 9, day: 'Thu', time: '18:00', type: 'Spin', name: 'Rhythm Ride', coach: 'Jonas Berg', duration: 45, spots: 11, capacity: 24, room: 'Cycle Lab' },
  { id: 10, day: 'Fri', time: '06:30', type: 'HIIT', name: 'Friday Finisher', coach: 'Maya Chen', duration: 40, spots: 1, capacity: 20, room: 'Studio A' },
  { id: 11, day: 'Fri', time: '18:30', type: 'Boxing', name: 'Sparring Prep', coach: 'Marcus Cole', duration: 60, spots: 5, capacity: 12, room: 'The Ring' },
  { id: 12, day: 'Sat', time: '09:00', type: 'Spin', name: 'Weekend Long Ride', coach: 'Jonas Berg', duration: 60, spots: 8, capacity: 24, room: 'Cycle Lab' },
  { id: 13, day: 'Sat', time: '10:30', type: 'Yoga', name: 'Slow Flow & Breath', coach: 'Lena Ortiz', duration: 75, spots: 14, capacity: 18, room: 'Zen Room' },
]

export const achievements = [
  { id: 'streak30', name: 'Unbreakable', desc: '30-day streak', icon: 'Flame', unlocked: true, color: '#FF6B4A' },
  { id: 'century', name: 'Centurion', desc: '100 workouts', icon: 'Dumbbell', unlocked: true, color: '#C6FF3D' },
  { id: 'early', name: 'Early Bird', desc: '20 workouts before 7am', icon: 'Sunrise', unlocked: true, color: '#FFC94A' },
  { id: 'pr10', name: 'Record Breaker', desc: 'Set 10 PRs', icon: 'Trophy', unlocked: true, color: '#22E4FF' },
  { id: 'classes', name: 'Social Sweat', desc: 'Attend 25 classes', icon: 'Users', unlocked: true, color: '#A78BFA' },
  { id: 'marathon', name: 'Iron Lungs', desc: 'Run 100 km total', icon: 'Wind', unlocked: false, color: '#7CFFB2', progress: 72 },
  { id: 'twoplates', name: 'Two Plates', desc: 'Bench 100 kg', icon: 'Medal', unlocked: false, color: '#FFC94A', progress: 82 },
  { id: 'year', name: 'Year One', desc: '365 days as a member', icon: 'CalendarCheck', unlocked: false, color: '#22E4FF', progress: 55 },
]

export const quotes = [
  { text: "The only bad workout is the one that didn't happen.", author: 'Unknown' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: "Your body can stand almost anything. It's your mind you have to convince.", author: 'Unknown' },
  { text: 'Fall in love with taking care of yourself.', author: 'Unknown' },
  { text: 'Small daily improvements are the key to staggering long-term results.', author: 'Robin Sharma' },
  { text: "Don't count the days. Make the days count.", author: 'Muhammad Ali' },
  { text: 'It never gets easier. You just get stronger.', author: 'Unknown' },
]

export function quoteOfTheDay(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((date - start) / 86400000)
  return quotes[dayOfYear % quotes.length]
}
