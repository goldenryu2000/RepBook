import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import {
  AnimatePresence,
  Button,
  Input,
  Progress,
  ScrollView,
  Text,
  XStack,
  YStack,
} from 'tamagui';
import { getLastPerformance } from '../db/database';
import { useUserStore } from '../store/userStore';
import { useWorkoutStore } from '../store/workoutStore';
import { ExerciseAutocomplete } from './ExerciseAutocomplete';

export function FocusWorkoutView({ onFinish }: { onFinish?: () => void }) {
  const {
    exercises,
    focusState,
    nextStep,
    prevStep,
    updateSet,
    setLoggingMode,
    updateExerciseName,
    addExercise,
  } = useWorkoutStore();
  const { defaultRestTime } = useUserStore();
  const [lastPerf, setLastPerf] = useState<any>(null);

  const { exerciseIndex, setIndex, step } = focusState;
  const currentExercise = exercises[exerciseIndex];

  useEffect(() => {
    if (currentExercise?.name) {
      getLastPerformance(currentExercise.name).then(setLastPerf);
    } else {
      setLastPerf(null);
    }
  }, [currentExercise?.name]);

  // Safety check: if exerciseIndex is out of bounds, reset it
  useEffect(() => {
    if (exercises.length > 0 && exerciseIndex >= exercises.length) {
      useWorkoutStore.setState({
        focusState: { ...focusState, exerciseIndex: 0, setIndex: 0, step: 'weight' },
      });
    }
  }, [exercises.length, exerciseIndex]);

  if (!currentExercise) {
    return (
      <YStack f={1} jc="center" ai="center" p="$5">
        <Text color="$color10">No exercise active. Add an exercise to start focus mode.</Text>
        <Button mt="$4" onPress={() => setLoggingMode('list')}>
          Back to List
        </Button>
      </YStack>
    );
  }

  const currentSet = currentExercise.sets?.[setIndex];

  // If we somehow have an exercise with no sets, or index is wrong
  if (!currentSet && step !== 'complete') {
    return (
      <YStack f={1} jc="center" ai="center" p="$5">
        <Text color="$color10">No sets found for this exercise.</Text>
        <Button
          mt="$4"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            useWorkoutStore.getState().addSet(currentExercise.id);
          }}
        >
          Add First Set
        </Button>
      </YStack>
    );
  }

  // Calculate granular progress based on sets and exercises, 100% if complete
  const progress =
    step === 'complete'
      ? 100
      : ((exerciseIndex +
          (currentExercise.sets?.length > 0 ? setIndex / currentExercise.sets.length : 0)) /
          exercises.length) *
        100;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <YStack f={1} bg="#09090b">
        {/* Header Info */}
        <YStack px="$5" pt="$2" pb="$4" gap="$2">
          <XStack jc="space-between" ai="center">
            <Text
              color="$blue10"
              fontWeight="700"
              fontSize="$3"
              textTransform="uppercase"
              letterSpacing={1}
            >
              Exercise {exerciseIndex + 1} of {exercises.length}
            </Text>
            <XStack gap="$2">
              <Button
                size="$2"
                bg="$blue9"
                br="$10"
                icon={<Feather name="plus" size={14} color="black" />}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  addExercise();
                }}
              >
                <Text color="black" fontWeight="700" fontSize="$2">
                  EXERCISE
                </Text>
              </Button>
              <Button
                size="$2"
                bg="$color3"
                br="$10"
                borderColor="$color5"
                borderWidth={1}
                icon={<Feather name="list" size={14} color="white" />}
                onPress={() => setLoggingMode('list')}
              >
                <Text color="white" fontWeight="700" fontSize="$2">
                  LIST
                </Text>
              </Button>
            </XStack>
          </XStack>
          <XStack ai="flex-start" gap="$2">
            <ExerciseAutocomplete
              value={currentExercise.name}
              onChangeText={name => updateExerciseName(currentExercise.id, name)}
              placeholder="Exercise Name"
              style={{ fontSize: 28, fontWeight: '900', color: 'white' }}
            />
            <YStack pt="$3">
              <Feather name="edit-2" size={18} color="#71717a" />
            </YStack>
          </XStack>
          <XStack ai="center" gap="$3" mt="$2">
            <Progress value={progress} f={1} h={6} bg="$color3">
              <Progress.Indicator bg="$blue9" animation="lazy" />
            </Progress>
            <Text color="$color9" fontSize="$2" fontWeight="600">
              {Math.round(progress)}%
            </Text>
          </XStack>
        </YStack>

        {/* Main Stage Area */}
        <ScrollView
          f={1}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <YStack px="$5" py="$4">
            <AnimatePresence exitBeforeEnter>
              {step === 'weight' && (
                <WeightStage
                  key="weight"
                  exerciseId={currentExercise.id}
                  setId={currentSet.id}
                  weight={currentSet.weight}
                  unit={currentSet.unit}
                  onNext={nextStep}
                  lastPerf={lastPerf?.sets?.[setIndex] || lastPerf?.sets?.[0]}
                />
              )}
              {step === 'active' && <ActiveStage key="active" onNext={nextStep} />}
              {step === 'reps' && (
                <RepsStage
                  key="reps"
                  exerciseId={currentExercise.id}
                  setId={currentSet.id}
                  reps={currentSet.reps}
                  onNext={nextStep}
                  lastPerf={lastPerf?.sets?.[setIndex] || lastPerf?.sets?.[0]}
                />
              )}
              {step === 'rest' && (
                <RestStage key="rest" duration={defaultRestTime} onNext={nextStep} />
              )}
              {step === 'complete' && <CompleteStage key="complete" onFinish={onFinish} />}
            </AnimatePresence>
          </YStack>
        </ScrollView>

        {/* Bottom Navigation & Counter */}
        <XStack p="$5" pb="$8" jc="space-between" ai="center">
          <Button
            size="$4"
            circular
            bg="$color3"
            icon={<Feather name="chevron-left" size={24} color="white" />}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              prevStep();
            }}
            disabled={exerciseIndex === 0 && setIndex === 0 && step === 'weight'}
            opacity={exerciseIndex === 0 && setIndex === 0 && step === 'weight' ? 0 : 1}
          />

          <XStack
            ai="center"
            gap="$2"
            bg="$color2"
            px="$4"
            py="$2"
            br="$10"
            borderColor="$color4"
            borderWidth={1}
          >
            <Text color="$color9" fontSize="$2" fontWeight="700">
              SET
            </Text>
            <Text color="$color12" fontSize="$5" fontWeight="900">
              {setIndex + 1} / {currentExercise.sets.length}
            </Text>
          </XStack>

          {/* Empty space to keep counter centered */}
          <YStack w={44} />
        </XStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}

// Internal Stage Components

interface WeightStageProps {
  exerciseId: string;
  setId: string;
  weight: string;
  unit: string;
  onNext: () => void;
  lastPerf: any;
}

function WeightStage({ exerciseId, setId, weight, unit, onNext, lastPerf }: WeightStageProps) {
  const { updateSet } = useWorkoutStore();

  return (
    <YStack
      gap="$6"
      animation="quick"
      enterStyle={{ opacity: 0, y: 10 }}
      exitStyle={{ opacity: 0, y: -10 }}
    >
      <YStack ai="center" gap="$4">
        {lastPerf && (
          <Text
            color="$blue8"
            fontSize="$3"
            fontWeight="600"
            bg="$blue2"
            px="$3"
            py="$1"
            br="$10"
            mb="$2"
          >
            LAST TIME: {lastPerf.weight} {lastPerf.unit}
          </Text>
        )}
        <Text color="$color10" fontSize="$5" fontWeight="600">
          How much weight?
        </Text>
        <XStack ai="center" gap="$3">
          <Input
            value={weight}
            onChangeText={v => updateSet(exerciseId, setId, 'weight', v)}
            keyboardType="numeric"
            inputMode="numeric"
            placeholder="0"
            placeholderTextColor="$color5"
            fontSize={64}
            fontWeight="900"
            color="$blue10"
            bg="$color3"
            borderColor="$color5"
            borderWidth={1}
            br="$6"
            textAlign="center"
            px="$4"
            h={100} // Increased height
            minWidth={200} // Increased width
            autoFocus
            selectTextOnFocus
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <Button
            bg="$color3"
            borderColor="$color5"
            borderWidth={1}
            br="$4"
            mt="$4"
            onPress={() => {
              Haptics.selectionAsync();
              updateSet(exerciseId, setId, 'unit', unit === 'lbs' ? 'kgs' : 'lbs');
            }}
            pressStyle={{ scale: 0.95, opacity: 0.8 }}
          >
            <Text color="$blue10" fontSize="$5" fontWeight="900" textTransform="uppercase">
              {unit}
            </Text>
          </Button>
        </XStack>
      </YStack>

      <Button
        size="$6"
        bg="$blue9"
        color="black"
        fontWeight="800"
        fontSize="$6"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onNext();
        }}
        pressStyle={{ opacity: 0.8, scale: 0.98 }}
        iconAfter={<Feather name="play" size={20} color="black" />}
      >
        BEGIN SET
      </Button>
    </YStack>
  );
}

function ActiveStage({ onNext }: { onNext: () => void }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <YStack
      ai="center"
      jc="space-around"
      f={1}
      animation="quick"
      enterStyle={{ opacity: 0, scale: 0.95 }}
      exitStyle={{ opacity: 0, scale: 1.05 }}
    >
      <YStack ai="center" gap="$2">
        <Text
          color="$red10"
          fontSize="$3"
          fontWeight="900"
          textTransform="uppercase"
          letterSpacing={4}
          opacity={0.8}
        >
          Working...
        </Text>
        <Text
          color="$color12"
          fontSize={110}
          fontWeight="200"
          style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
        >
          {formatTime(seconds)}
        </Text>
      </YStack>

      <Button
        size="$6"
        w="100%"
        h={80}
        br="$10"
        bg="$red9"
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onNext();
        }}
        pressStyle={{ scale: 0.96, opacity: 0.9 }}
        style={{ shadowColor: '#ef4444', shadowRadius: 15, shadowOpacity: 0.4 }}
      >
        <XStack ai="center" gap="$3">
          <Feather name="check-circle" size={28} color="black" />
          <Text color="black" fontWeight="900" fontSize="$7" letterSpacing={1}>
            COMPLETE SET
          </Text>
        </XStack>
      </Button>
    </YStack>
  );
}

interface RepsStageProps {
  exerciseId: string;
  setId: string;
  reps: string;
  onNext: () => void;
  lastPerf: any;
}

function RepsStage({ exerciseId, setId, reps, onNext, lastPerf }: RepsStageProps) {
  const { updateSet } = useWorkoutStore();

  return (
    <YStack
      gap="$6"
      animation="quick"
      enterStyle={{ opacity: 0, y: 10 }}
      exitStyle={{ opacity: 0, y: -10 }}
    >
      <YStack ai="center" gap="$4">
        {lastPerf && (
          <Text
            color="$green8"
            fontSize="$3"
            fontWeight="600"
            bg="$green2"
            px="$3"
            py="$1"
            br="$10"
            mb="$2"
          >
            LAST TIME: {lastPerf.reps} REPS
          </Text>
        )}
        <Text color="$color10" fontSize="$5" fontWeight="600">
          How many reps?
        </Text>
        <Input
          value={reps}
          onChangeText={v => updateSet(exerciseId, setId, 'reps', v)}
          keyboardType="numeric"
          inputMode="numeric"
          placeholder="0"
          placeholderTextColor="$color5"
          fontSize={84}
          fontWeight="900"
          color="$green10"
          bg="$color3"
          borderColor="$color5"
          borderWidth={1}
          br="$6"
          textAlign="center"
          px="$4"
          h={120} // Increased height
          minWidth={200} // Increased width
          autoFocus
          selectTextOnFocus
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
      </YStack>

      <Button
        size="$6"
        bg="$green9"
        color="black"
        fontWeight="800"
        fontSize="$6"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onNext();
        }}
        pressStyle={{ opacity: 0.8, scale: 0.98 }}
        iconAfter={<Feather name="check" size={24} color="black" />}
      >
        CONFIRM REPS
      </Button>
    </YStack>
  );
}

function RestStage({ duration, onNext }: { duration: number; onNext: () => void }) {
  const { exercises, addExercise } = useWorkoutStore();
  const [remaining, setRemaining] = useState(duration);

  const handleAddMore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newIndex = exercises.length;
    addExercise();
    useWorkoutStore.setState({
      focusState: { exerciseIndex: newIndex, setIndex: 0, step: 'weight' },
    });
  };

  useEffect(() => {
    if (remaining <= 0) {
      onNext();
      return;
    }
    const interval = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(interval);
  }, [remaining]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <YStack
      ai="center"
      gap="$8"
      animation="quick"
      enterStyle={{ opacity: 0, x: 20 }}
      exitStyle={{ opacity: 0, x: -20 }}
    >
      <YStack ai="center" gap="$2">
        <Text
          color="$green10"
          fontSize="$4"
          fontWeight="800"
          textTransform="uppercase"
          letterSpacing={2}
        >
          Rest Timer
        </Text>
        <Text color="$color12" fontSize={84} fontWeight="900">
          {formatTime(remaining)}
        </Text>
      </YStack>

      <XStack gap="$4">
        <Button
          size="$5"
          bg="$color3"
          color="white"
          fontWeight="700"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setRemaining(r => r + 30);
          }}
        >
          +30s
        </Button>
        <Button
          size="$5"
          bg="$color5"
          color="white"
          fontWeight="700"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNext();
          }}
        >
          Skip Rest
        </Button>
      </XStack>

      <Button
        mt="$4"
        size="$4"
        chromeless
        color="$blue10"
        fontWeight="700"
        icon={<Feather name="plus" size={16} color="$blue10" />}
        onPress={handleAddMore}
      >
        ADD ANOTHER EXERCISE
      </Button>
    </YStack>
  );
}

function CompleteStage({ onFinish }: { onFinish?: () => void }) {
  const { exercises, addExercise } = useWorkoutStore();
  const [isSaving, setIsSaving] = useState(false);

  const handleAddMore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newIndex = exercises.length;
    addExercise();
    // Jump to the new exercise immediately
    useWorkoutStore.setState({
      focusState: { exerciseIndex: newIndex, setIndex: 0, step: 'weight' },
    });
  };

  const handlePress = async () => {
    if (onFinish) {
      setIsSaving(true);
      await onFinish();
      setIsSaving(false);
    }
  };

  return (
    <YStack
      ai="center"
      gap="$6"
      animation="quick"
      enterStyle={{ opacity: 0, scale: 0.9 }}
      exitStyle={{ opacity: 0, scale: 1.1 }}
    >
      <YStack ai="center" gap="$2">
        <Feather name="award" size={80} color="#eab308" />
        <Text color="$color12" fontSize="$9" fontWeight="900" ta="center">
          Workout Complete!
        </Text>
        <Text color="$color10" fontSize="$5" ta="center">
          You crushed it. Ready to wrap up?
        </Text>
      </YStack>

      <YStack w="100%" gap="$3">
        <Button
          size="$6"
          bg="$green9"
          color="black"
          fontWeight="800"
          onPress={handlePress}
          disabled={isSaving}
        >
          {isSaving ? 'SAVING...' : 'FINISH WORKOUT'}
        </Button>

        <Button
          size="$5"
          bg="$color3"
          borderColor="$color5"
          borderWidth={1}
          color="white"
          fontWeight="700"
          onPress={handleAddMore}
          icon={<Feather name="plus" size={18} color="white" />}
          disabled={isSaving}
        >
          ADD ANOTHER EXERCISE
        </Button>
      </YStack>
    </YStack>
  );
}
