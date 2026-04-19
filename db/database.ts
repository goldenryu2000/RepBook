import * as SQLite from 'expo-sqlite';
import {
  ActiveExercise,
  Exercise,
  Set,
  Template,
  TemplateExercise,
  UserProfile,
  Workout,
} from '../types';

// Open the database synchronously at module load time.
// expo-sqlite v16 supports this and avoids JSI timing issues with the async singleton.
const db = SQLite.openDatabaseSync('repbook.db');

/** @internal – exposed for testing overrides only */
export function getDb() {
  return db;
}

export async function setupDatabase() {
  const database = getDb();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY NOT NULL,
      workout_id TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS sets (
      id TEXT PRIMARY KEY NOT NULL,
      exercise_id TEXT NOT NULL,
      reps INTEGER NOT NULL,
      weight REAL NOT NULL,
      unit TEXT DEFAULT 'lbs',
      set_number INTEGER NOT NULL,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      assigned_days TEXT DEFAULT '[]',
      assigned_dates TEXT DEFAULT '[]',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS template_exercises (
      id TEXT PRIMARY KEY NOT NULL,
      template_id TEXT NOT NULL,
      name TEXT NOT NULL,
      target_sets INTEGER DEFAULT 0,
      order_index INTEGER NOT NULL,
      FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
  // Migration guards
  try {
    await database.execAsync(`ALTER TABLE sets ADD COLUMN unit TEXT DEFAULT 'lbs';`);
  } catch (_) {}
  try {
    await database.execAsync(`ALTER TABLE templates ADD COLUMN assigned_days TEXT DEFAULT '[]';`);
  } catch (_) {}
  try {
    await database.execAsync(`ALTER TABLE templates ADD COLUMN assigned_dates TEXT DEFAULT '[]';`);
  } catch (_) {}
}

// ─── User Profile ────────────────────────────────────────────
export async function getUserProfile() {
  const database = getDb();
  const rows = await database.getAllAsync<{ key: string; value: string }>(
    `SELECT key, value FROM settings WHERE key IN ('user_profile','onboarded','default_unit')`
  );
  const map: Record<string, string> = {};
  rows.forEach(r => {
    map[r.key] = r.value;
  });
  const profile = map['user_profile'] ? (JSON.parse(map['user_profile']) as UserProfile) : null;
  return {
    profile,
    isOnboarded: map['onboarded'] === 'true',
    defaultUnit: (map['default_unit'] ?? profile?.defaultUnit ?? 'lbs') as 'lbs' | 'kgs',
  };
}

export async function saveUserProfile(profile: UserProfile) {
  const database = getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('user_profile', ?)`,
    JSON.stringify(profile)
  );
  await database.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('onboarded', 'true')`
  );
}

// ─── Workout Session ────────────────────────────────────────
export async function deleteWorkout(id: string) {
  const database = getDb();
  await database.withTransactionAsync(async () => {
    const exercises = await database.getAllAsync<{ id: string }>(
      'SELECT id FROM exercises WHERE workout_id = ?',
      String(id)
    );
    for (const ex of exercises) {
      await database.runAsync('DELETE FROM sets WHERE exercise_id = ?', String(ex.id));
    }
    await database.runAsync('DELETE FROM exercises WHERE workout_id = ?', String(id));
    await database.runAsync('DELETE FROM workouts WHERE id = ?', String(id));
  });
}

export async function saveWorkoutSession(
  exercises: ActiveExercise[],
  dateIso?: string,
  editingId?: string | null
) {
  const database = getDb();

  if (editingId) {
    await deleteWorkout(editingId);
  }

  const workoutId = editingId || uid();
  const now = new Date().toISOString();
  const workoutDate = dateIso || now;
  await database.withTransactionAsync(async () => {
    await database.runAsync(
      'INSERT INTO workouts (id, date, created_at) VALUES (?, ?, ?)',
      String(workoutId),
      String(workoutDate),
      String(now)
    );
    for (const exercise of exercises) {
      if (!exercise.name.trim() || exercise.sets.length === 0) continue;
      const exId = uid();
      await database.runAsync(
        'INSERT INTO exercises (id, workout_id, name) VALUES (?, ?, ?)',
        String(exId),
        String(workoutId),
        String(exercise.name)
      );
      let setNo = 1;
      for (const set of exercise.sets) {
        await database.runAsync(
          'INSERT INTO sets (id, exercise_id, reps, weight, unit, set_number) VALUES (?, ?, ?, ?, ?, ?)',
          String(uid()),
          String(exId),
          String(set.reps || '0'),
          String(set.weight || '0'),
          String(set.unit || 'lbs'),
          String(setNo++)
        );
      }
    }
  });
}

// ─── History ────────────────────────────────────────────────
export async function getWorkoutHistory() {
  const database = getDb();
  const workouts = await database.getAllAsync<Workout>(
    'SELECT * FROM workouts ORDER BY created_at DESC'
  );
  const history = [];
  for (const w of workouts) {
    const exercises = await database.getAllAsync<Exercise>(
      'SELECT * FROM exercises WHERE workout_id = ?',
      String(w.id)
    );
    const exerciseList = [];
    for (const ex of exercises) {
      const sets = await database.getAllAsync<Set>(
        'SELECT * FROM sets WHERE exercise_id = ? ORDER BY set_number ASC',
        String(ex.id)
      );
      exerciseList.push({ ...ex, sets });
    }
    history.push({ ...w, exercises: exerciseList });
  }
  return history;
}

// ─── Templates ──────────────────────────────────────────────
export async function getTemplates(): Promise<(Template & { exercises: TemplateExercise[] })[]> {
  const database = getDb();
  const templates = await database.getAllAsync<any>(
    'SELECT * FROM templates ORDER BY created_at DESC'
  );
  const result = [];
  for (const t of templates) {
    const exercises = await database.getAllAsync<TemplateExercise>(
      'SELECT * FROM template_exercises WHERE template_id = ? ORDER BY order_index ASC',
      String(t.id)
    );
    let parsedDays: number[] = [];
    let parsedDates: string[] = [];
    try {
      parsedDays = JSON.parse(t.assigned_days || '[]');
    } catch (e) {}
    try {
      parsedDates = JSON.parse(t.assigned_dates || '[]');
    } catch (e) {}
    result.push({ ...t, assigned_days: parsedDays, assigned_dates: parsedDates, exercises });
  }
  return result;
}

export async function saveTemplate(
  name: string,
  assignedDays: number[],
  assignedDates: string[],
  exercises: { name: string; target_sets: number }[],
  existingId?: string
) {
  const database = getDb();
  const templateId = existingId ? String(existingId) : uid();
  const now = new Date().toISOString();

  const daysStr = JSON.stringify(assignedDays || []);
  const datesStr = JSON.stringify(assignedDates || []);
  const nameStr = String(name || 'Untitled');

  await database.withTransactionAsync(async () => {
    if (existingId) {
      await database.runAsync(
        'UPDATE templates SET name = ?, assigned_days = ?, assigned_dates = ? WHERE id = ?',
        nameStr,
        daysStr,
        datesStr,
        templateId
      );
      await database.runAsync('DELETE FROM template_exercises WHERE template_id = ?', templateId);
    } else {
      await database.runAsync(
        'INSERT INTO templates (id, name, assigned_days, assigned_dates, created_at) VALUES (?, ?, ?, ?, ?)',
        templateId,
        nameStr,
        daysStr,
        datesStr,
        now
      );
    }
    for (let i = 0; i < exercises.length; i++) {
      const exId = uid();
      const exName = String(exercises[i].name || 'Exercise');
      const tSets = String(exercises[i].target_sets || 0);
      const ord = String(i);

      await database.runAsync(
        'INSERT INTO template_exercises (id, template_id, name, target_sets, order_index) VALUES (?, ?, ?, ?, ?)',
        exId,
        templateId,
        exName,
        tSets,
        ord
      );
    }
  });
  return templateId;
}

export async function deleteTemplate(id: string) {
  const database = getDb();
  const tId = String(id);
  await database.runAsync('DELETE FROM template_exercises WHERE template_id = ?', tId);
  await database.runAsync('DELETE FROM templates WHERE id = ?', tId);
}

// ─── Helpers ────────────────────────────────────────────────
export async function saveSetting(key: string, value: string) {
  const database = getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
    String(key),
    String(value)
  );
}

const uid = () => Math.random().toString(36).substring(2, 11);
