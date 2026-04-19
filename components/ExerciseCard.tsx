import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Button, XStack, YStack } from 'tamagui';
import { useWorkoutStore } from '../store/workoutStore';
import { ActiveExercise, ActiveSet } from '../types';
import { ExerciseAutocomplete } from './ExerciseAutocomplete';
import { SetRow } from './SetRow';

interface ExerciseCardProps {
  exercise: ActiveExercise;
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const { updateExerciseName, removeExercise, addSet, updateSet, removeSet } = useWorkoutStore();

  return (
    <YStack bg="$color2" borderColor="$color4" borderWidth={1} br="$6" p="$4" mb="$4">
      {/* Header */}
      <XStack ai="center" mb="$4" gap="$3">
        <ExerciseAutocomplete
          value={exercise.name}
          onChangeText={v => updateExerciseName(exercise.id, v)}
        />
        <Button
          size="$2"
          circular
          bg="$red2"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            removeExercise(exercise.id);
          }}
          pressStyle={{ opacity: 0.7 }}
          icon={<Feather name="x" size={14} color="#ef4444" />}
        />
      </XStack>

      {/* Sets */}
      <YStack mb="$3">
        {exercise.sets.map((set, i) => (
          <SetRow
            key={set.id}
            setNumber={i + 1}
            set={set}
            onUpdate={(field, value) =>
              updateSet(exercise.id, set.id, field as keyof ActiveSet, value)
            }
            onRemove={() => removeSet(exercise.id, set.id)}
          />
        ))}
      </YStack>

      {/* Add Set */}
      <Button
        size="$3"
        bg="$color3"
        borderColor="$color5"
        borderWidth={1}
        color="$green10"
        fontWeight="700"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          addSet(exercise.id);
        }}
        pressStyle={{ opacity: 0.8 }}
      >
        + Add Set
      </Button>
    </YStack>
  );
}
