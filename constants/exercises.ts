export interface ExerciseDefinition {
  name: string;
  category: string;
}

export const COMMON_EXERCISES: ExerciseDefinition[] = [
  // Chest
  { name: 'Bench Press', category: 'Chest' },
  { name: 'Incline Bench Press', category: 'Chest' },
  { name: 'Decline Bench Press', category: 'Chest' },
  { name: 'Dumbbell Bench Press', category: 'Chest' },
  { name: 'Incline Dumbbell Press', category: 'Chest' },
  { name: 'Decline Dumbbell Press', category: 'Chest' },
  { name: 'Chest Fly', category: 'Chest' },
  { name: 'Dumbbell Fly', category: 'Chest' },
  { name: 'Cable Crossover', category: 'Chest' },
  { name: 'Pec Deck', category: 'Chest' },
  { name: 'Chest Dip', category: 'Chest' },
  { name: 'Push Up', category: 'Chest' },
  { name: 'Diamond Push Up', category: 'Chest' },
  { name: 'Dumbbell Pullover', category: 'Chest' },

  // Back
  { name: 'Deadlift', category: 'Back' },
  { name: 'Romanian Deadlift', category: 'Back' },
  { name: 'Sumo Deadlift', category: 'Back' },
  { name: 'Pull Up', category: 'Back' },
  { name: 'Chin Up', category: 'Back' },
  { name: 'Lat Pulldown', category: 'Back' },
  { name: 'Barbell Row', category: 'Back' },
  { name: 'Dumbbell Row', category: 'Back' },
  { name: 'T-Bar Row', category: 'Back' },
  { name: 'Seated Cable Row', category: 'Back' },
  { name: 'Straight Arm Pulldown', category: 'Back' },
  { name: 'Good Morning', category: 'Back' },
  { name: 'Back Extension', category: 'Back' },
  { name: 'Shrug', category: 'Back' },

  // Shoulders
  { name: 'Overhead Press', category: 'Shoulders' },
  { name: 'Dumbbell Shoulder Press', category: 'Shoulders' },
  { name: 'Arnold Press', category: 'Shoulders' },
  { name: 'Push Press', category: 'Shoulders' },
  { name: 'Lateral Raise', category: 'Shoulders' },
  { name: 'Cable Lateral Raise', category: 'Shoulders' },
  { name: 'Front Raise', category: 'Shoulders' },
  { name: 'Reverse Fly', category: 'Shoulders' },
  { name: 'Face Pull', category: 'Shoulders' },
  { name: 'Upright Row', category: 'Shoulders' },
  { name: 'Machine Shoulder Press', category: 'Shoulders' },

  // Biceps
  { name: 'Bicep Curl', category: 'Biceps' },
  { name: 'Dumbbell Curl', category: 'Biceps' },
  { name: 'Hammer Curl', category: 'Biceps' },
  { name: 'Preacher Curl', category: 'Biceps' },
  { name: 'Concentration Curl', category: 'Biceps' },
  { name: 'Cable Curl', category: 'Biceps' },
  { name: 'EZ Bar Curl', category: 'Biceps' },
  { name: 'Reverse Curl', category: 'Biceps' },
  { name: 'Spider Curl', category: 'Biceps' },

  // Triceps
  { name: 'Tricep Pushdown', category: 'Triceps' },
  { name: 'Overhead Tricep Extension', category: 'Triceps' },
  { name: 'Skullcrusher', category: 'Triceps' },
  { name: 'Close Grip Bench Press', category: 'Triceps' },
  { name: 'Tricep Dip', category: 'Triceps' },
  { name: 'Tricep Kickback', category: 'Triceps' },
  { name: 'Rope Pushdown', category: 'Triceps' },

  // Legs (Quads, Hamstrings, Glutes)
  { name: 'Squat', category: 'Legs' },
  { name: 'Front Squat', category: 'Legs' },
  { name: 'Hack Squat', category: 'Legs' },
  { name: 'Goblet Squat', category: 'Legs' },
  { name: 'Box Squat', category: 'Legs' },
  { name: 'Bulgarian Split Squat', category: 'Legs' },
  { name: 'Lunge', category: 'Legs' },
  { name: 'Walking Lunge', category: 'Legs' },
  { name: 'Reverse Lunge', category: 'Legs' },
  { name: 'Leg Press', category: 'Legs' },
  { name: 'Leg Extension', category: 'Legs' },
  { name: 'Leg Curl', category: 'Legs' },
  { name: 'Seated Leg Curl', category: 'Legs' },
  { name: 'Hip Thrust', category: 'Legs' },
  { name: 'Glute Bridge', category: 'Legs' },
  { name: 'Cable Pull Through', category: 'Legs' },

  // Calves
  { name: 'Calf Raise', category: 'Calves' },
  { name: 'Seated Calf Raise', category: 'Calves' },
  { name: 'Standing Calf Raise', category: 'Calves' },
  { name: 'Leg Press Calf Raise', category: 'Calves' },

  // Core
  { name: 'Crunch', category: 'Core' },
  { name: 'Sit Up', category: 'Core' },
  { name: 'Plank', category: 'Core' },
  { name: 'Russian Twist', category: 'Core' },
  { name: 'Leg Raise', category: 'Core' },
  { name: 'Hanging Leg Raise', category: 'Core' },
  { name: 'Ab Wheel Rollout', category: 'Core' },
  { name: 'Cable Crunch', category: 'Core' },
  { name: 'Woodchopper', category: 'Core' },
  { name: 'Bicycle Crunch', category: 'Core' },
  { name: 'V-Up', category: 'Core' },
].sort((a, b) => a.name.localeCompare(b.name));
