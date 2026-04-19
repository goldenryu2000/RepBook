import React, { useState, useCallback } from 'react';
import { ScrollView, Modal, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Button, H1, Input } from 'tamagui';
import { Feather } from '@expo/vector-icons';

import { useWorkoutStore } from '../../store/workoutStore';
import { useUserStore } from '../../store/userStore';
import { ExerciseCard } from '../../components/ExerciseCard';
import { saveWorkoutSession, getTemplates, saveTemplate } from '../../db/database';
import { useFocusEffect } from 'expo-router';
import { Template, TemplateExercise, ActiveExercise } from '../../types';
import { useAlertStore } from '../../store/alertStore';

type FullTemplate = Template & { exercises: TemplateExercise[] };

// Greeting removed as per user request

export default function LogScreen() {
  const {
    isActive,
    activeTemplateId,
    exercises,
    date,
    setDate,
    addExercise,
    resetWorkout,
    editingWorkoutId,
    startEmptyWorkout,
  } = useWorkoutStore();
  const { defaultUnit, setDefaultUnit } = useUserStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [suggestedTemplate, setSuggestedTemplate] = useState<FullTemplate | null>(null);
  const [pendingTemplates, setPendingTemplates] = useState<FullTemplate[]>([]);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [exercisesToSave, setExercisesToSave] = useState<ActiveExercise[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (isActive) return; // Don't suggest if already logging
      const checkTemplates = async () => {
        try {
          const templates = await getTemplates();
          const now = new Date();
          const todayIdx = now.getDay();
          const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0];

          const todays = templates.filter(t => {
            const hasDate = t.assigned_dates?.includes(todayStr);
            const hasDay = t.assigned_days?.includes(todayIdx);
            return hasDate || hasDay;
          });

          todays.sort((a, b) => {
            const aDate = a.assigned_dates?.includes(todayStr) ? 1 : 0;
            const bDate = b.assigned_dates?.includes(todayStr) ? 1 : 0;
            return bDate - aDate;
          });

          setSuggestedTemplate(todays.length > 0 ? todays[0] : null);
          setPendingTemplates(todays.slice(1));
        } catch (e) {
          console.error(e);
        }
      };
      checkTemplates();
    }, [isActive])
  );

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleFinish = async () => {
    if (exercises.length === 0) {
      useAlertStore.getState().showAlert('Empty Session', 'Add some exercises first.');
      return;
    }
    const valid = exercises.filter(ex => ex.name.trim() && ex.sets.some(s => s.reps || s.weight));
    if (valid.length === 0) {
      useAlertStore.getState().showAlert('Empty Session', 'Fill in at least one set with data.');
      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    try {
      await saveWorkoutSession(valid, date.toISOString(), editingWorkoutId);
      const wasAdhoc = !activeTemplateId && !editingWorkoutId;
      resetWorkout();

      if (wasAdhoc) {
        useAlertStore
          .getState()
          .showAlert(
            'Workout Saved! 💪',
            'Would you like to save this routine as a new template?',
            [
              { text: 'No thanks', style: 'cancel' },
              {
                text: 'Save Template',
                style: 'default',
                onPress: () => {
                  setExercisesToSave(valid);
                  setTemplateName('');
                  setShowSaveTemplateModal(true);
                },
              },
            ]
          );
      } else {
        useAlertStore.getState().showAlert('Great work! 💪', 'Workout saved.');
      }
    } catch (e) {
      console.error(e);
      useAlertStore.getState().showAlert('Error', 'Could not save workout.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartTemplate = (template: FullTemplate) => {
    const uid = () => Math.random().toString(36).substring(2, 9);
    useWorkoutStore.setState({
      isActive: true,
      activeTemplateId: template.id,
      exercises: template.exercises.map(ex => ({
        id: uid(),
        name: ex.name,
        sets: Array.from({ length: Math.max(ex.target_sets, 1) }, () => ({
          id: uid(),
          reps: '',
          weight: '',
          unit: defaultUnit,
        })),
      })),
      date: new Date(),
      editingWorkoutId: null,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      {/* Header */}
      <XStack
        px="$5"
        pt="$4"
        pb="$3"
        ai="flex-end"
        jc="space-between"
        borderBottomColor="$color3"
        borderBottomWidth={1}
      >
        <YStack flex={1}>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <H1 color="$color12" fontSize="$8" fontWeight="900" mr="$2">
              {formattedDate}
            </H1>
            <Feather name="calendar" size={24} color="#a1a1aa" />
          </TouchableOpacity>
        </YStack>
        {/* Header Action button */}
        {isActive ? (
          <Button
            size="$3"
            bg="$red4"
            borderColor="$red6"
            borderWidth={1}
            color="$red11"
            fontWeight="700"
            onPress={() => {
              useAlertStore
                .getState()
                .showAlert('Cancel Workout?', 'Are you sure you want to discard this workout?', [
                  { text: 'Keep Logging', style: 'cancel' },
                  { text: 'Discard', style: 'destructive', onPress: resetWorkout },
                ]);
            }}
            pressStyle={{ opacity: 0.8 }}
          >
            Cancel
          </Button>
        ) : (
          <Button
            size="$3"
            circular
            chromeless
            onPress={() => setSettingsOpen(true)}
            icon={<Feather name="settings" size={20} color="#71717a" />}
            pressStyle={{ opacity: 0.7 }}
          />
        )}
      </XStack>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          themeVariant="dark"
          maximumDate={new Date()} // Don't allow future workouts
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      {/* Main Area */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {!isActive ? (
          <YStack py="$2" gap="$4">
            {suggestedTemplate ? (
              <YStack bg="$green2" borderColor="$green5" borderWidth={1} br="$6" p="$5">
                <Text
                  color="$green10"
                  fontWeight="900"
                  fontSize="$4"
                  textTransform="uppercase"
                  letterSpacing={1}
                  mb="$2"
                >
                  Today&apos;s Scheduled Workout
                </Text>
                <Text color="$color12" fontWeight="800" fontSize="$8" mb="$4">
                  {suggestedTemplate.name}
                </Text>
                <XStack mb="$4" flexWrap="wrap" gap="$2">
                  {suggestedTemplate.exercises.map((ex, _i) => (
                    <XStack key={ex.id} ai="center" bg="$green3" px="$2" py="$1" br="$4">
                      <Text color="$green11" fontSize="$2" fontWeight="600">
                        {ex.name}
                      </Text>
                    </XStack>
                  ))}
                </XStack>
                <Button
                  size="$4"
                  bg="$green9"
                  color="#09090b"
                  fontWeight="800"
                  onPress={() => handleStartTemplate(suggestedTemplate)}
                  pressStyle={{ opacity: 0.8 }}
                >
                  {`Start ${suggestedTemplate.name}`}
                </Button>
                {pendingTemplates.length > 0 && (
                  <Button
                    size="$3"
                    bg="$green4"
                    borderColor="$green6"
                    borderWidth={1}
                    mt="$3"
                    color="$green11"
                    fontWeight="800"
                    icon={<Feather name="list" size={16} color="#22c55e" />}
                    iconAfter={<Feather name="chevron-down" size={16} color="#22c55e" />}
                    onPress={() => setShowPendingModal(true)}
                    pressStyle={{ opacity: 0.8 }}
                  >
                    {`${pendingTemplates.length} more scheduled today`}
                  </Button>
                )}
              </YStack>
            ) : (
              <YStack ai="center" py="$4" gap="$3">
                <Feather name="calendar" size={44} color="#3f3f46" />
                <Text color="$color8" fontSize="$4" ta="center">
                  {'No templates scheduled for today.'}
                </Text>
              </YStack>
            )}

            <Button
              size="$5"
              mt="$4"
              bg="$color2"
              borderColor="$color5"
              borderWidth={1}
              color="$color12"
              fontWeight="800"
              onPress={startEmptyWorkout}
              icon={<Feather name="plus" size={18} color="#fafafa" />}
              pressStyle={{ opacity: 0.8 }}
            >
              Start Empty Workout
            </Button>
          </YStack>
        ) : (
          <YStack pb="$8">
            {exercises.map(ex => (
              <ExerciseCard key={ex.id} exercise={ex} />
            ))}

            <Button
              size="$4"
              mt="$2"
              bg="$color2"
              borderColor="$color4"
              borderWidth={1}
              color="$blue10"
              fontWeight="700"
              onPress={addExercise}
              icon={<Feather name="plus" size={18} color="#60a5fa" />}
              pressStyle={{ opacity: 0.8 }}
            >
              Add Exercise
            </Button>
          </YStack>
        )}
      </ScrollView>

      {/* Finish bar */}
      {isActive && (
        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          px="$5"
          pb="$8"
          pt="$3"
          bg="$color1"
          borderTopColor="$color3"
          borderTopWidth={1}
        >
          <Button
            size="$5"
            bg="$green9"
            color="#09090b"
            fontWeight="900"
            onPress={handleFinish}
            pressStyle={{ opacity: 0.8 }}
            disabled={isSaving}
            opacity={isSaving ? 0.5 : 1}
          >
            {isSaving ? 'Saving...' : editingWorkoutId ? 'Update Workout' : 'Finish Workout'}
          </Button>
        </YStack>
      )}

      {/* ─── Settings Modal ────────────────────────── */}
      <Modal
        visible={settingsOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
          <XStack
            px="$5"
            pt="$4"
            pb="$4"
            ai="center"
            jc="space-between"
            style={{ borderBottomColor: '#27272a', borderBottomWidth: 1 }}
          >
            <Text color="$color12" fontWeight="900" fontSize="$7">
              Settings
            </Text>
            <Button
              size="$2"
              circular
              chromeless
              onPress={() => setSettingsOpen(false)}
              icon={<Feather name="x" size={20} color="#71717a" />}
            />
          </XStack>

          <YStack px="$5" pt="$6" gap="$4">
            {/* Default Unit Toggle */}
            <YStack bg="$color2" borderColor="$color4" borderWidth={1} br="$5" p="$4">
              <Text
                color="$color9"
                fontSize="$2"
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing={1}
                mb="$3"
              >
                Default Weight Unit
              </Text>
              <Text color="$color8" fontSize="$3" mb="$4">
                New sets will default to this unit. You can still change individual sets while
                logging.
              </Text>
              <XStack gap="$3">
                <Button
                  flex={1}
                  size="$4"
                  bg={defaultUnit === 'lbs' ? '$green9' : '$color3'}
                  color={defaultUnit === 'lbs' ? '#09090b' : '$color9'}
                  fontWeight="800"
                  onPress={() => setDefaultUnit('lbs')}
                  pressStyle={{ opacity: 0.8 }}
                >
                  lbs
                </Button>
                <Button
                  flex={1}
                  size="$4"
                  bg={defaultUnit === 'kgs' ? '$green9' : '$color3'}
                  color={defaultUnit === 'kgs' ? '#09090b' : '$color9'}
                  fontWeight="800"
                  onPress={() => setDefaultUnit('kgs')}
                  pressStyle={{ opacity: 0.8 }}
                >
                  kgs
                </Button>
              </XStack>
            </YStack>
          </YStack>
        </SafeAreaView>
      </Modal>

      {/* Pending Templates Modal */}
      <Modal
        visible={showPendingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPendingModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
          <XStack
            px="$5"
            pt="$4"
            pb="$4"
            ai="center"
            jc="space-between"
            borderBottomColor="#27272a"
            borderBottomWidth={1}
          >
            <Text color="$color12" fontWeight="900" fontSize="$7">
              Pending Today
            </Text>
            <Button
              size="$2"
              circular
              chromeless
              onPress={() => setShowPendingModal(false)}
              icon={<Feather name="x" size={20} color="#71717a" />}
            />
          </XStack>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            {pendingTemplates.map(t => (
              <YStack
                key={t.id}
                bg="$color2"
                borderColor="$color4"
                borderWidth={1}
                br="$6"
                p="$4"
                mb="$4"
              >
                <Text color="$color12" fontWeight="800" fontSize="$6" mb="$2">
                  {t.name}
                </Text>
                <XStack gap="$2" mb="$4" flexWrap="wrap">
                  {t.exercises.map((ex, i) => (
                    <Text key={ex.id} color="$color10" fontSize="$3">
                      {ex.name}
                      {i < t.exercises.length - 1 ? ',' : ''}
                    </Text>
                  ))}
                </XStack>
                <Button
                  size="$3"
                  bg="$green2"
                  borderColor="$green6"
                  borderWidth={1}
                  color="$green10"
                  fontWeight="700"
                  onPress={() => {
                    setShowPendingModal(false);
                    handleStartTemplate(t);
                  }}
                >
                  Start This Instead
                </Button>
              </YStack>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Save Template Prompt Modal */}
      <Modal
        visible={showSaveTemplateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSaveTemplateModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
          <XStack
            px="$5"
            pt="$4"
            pb="$4"
            ai="center"
            jc="space-between"
            borderBottomColor="#27272a"
            borderBottomWidth={1}
          >
            <Text color="$color12" fontWeight="900" fontSize="$7">
              Save Template
            </Text>
            <Button
              size="$2"
              circular
              chromeless
              onPress={() => setShowSaveTemplateModal(false)}
              icon={<Feather name="x" size={20} color="#71717a" />}
            />
          </XStack>
          <YStack p="$5" gap="$4">
            <Text color="$color11" fontSize="$4">
              Name your new template:
            </Text>
            <Input
              value={templateName}
              onChangeText={setTemplateName}
              placeholder="e.g. Chest & Triceps"
              size="$5"
              bg="$color2"
              borderColor="$color4"
              borderWidth={1}
              color="$color12"
            />
            <Button
              size="$5"
              bg="$green9"
              color="#09090b"
              fontWeight="800"
              mt="$4"
              opacity={!templateName.trim() ? 0.5 : 1}
              disabled={!templateName.trim()}
              onPress={async () => {
                if (!templateName.trim()) return;
                try {
                  const mappedExercises = exercisesToSave.map(ex => ({
                    name: ex.name,
                    target_sets: ex.sets.length,
                  }));
                  await saveTemplate(templateName.trim(), [], [], mappedExercises);
                  setShowSaveTemplateModal(false);
                  useAlertStore.getState().showAlert('Success', 'Template saved!');
                } catch (e) {
                  console.error(e);
                  useAlertStore.getState().showAlert('Error', 'Failed to save template.');
                }
              }}
            >
              Save Template
            </Button>
          </YStack>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
