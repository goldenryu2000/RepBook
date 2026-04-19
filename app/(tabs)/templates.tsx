import React, { useState, useCallback } from 'react';
import { ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Button, H1 } from 'tamagui';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';

import { getTemplates, saveTemplate, deleteTemplate } from '../../db/database';
import { Template, TemplateExercise } from '../../types';
import { useWorkoutStore } from '../../store/workoutStore';
import { useUserStore } from '../../store/userStore';
import { useAlertStore } from '../../store/alertStore';
import { ExerciseAutocomplete } from '../../components/ExerciseAutocomplete';

type FullTemplate = Template & { exercises: TemplateExercise[] };
interface DraftExercise {
  name: string;
  target_sets: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TemplatesScreen() {
  const [templates, setTemplates] = useState<FullTemplate[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [assignedDays, setAssignedDays] = useState<number[]>([]);
  const [assignedDates, setAssignedDates] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [drafts, setDrafts] = useState<DraftExercise[]>([{ name: '', target_sets: '' }]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const { defaultUnit } = useUserStore();

  const fetchTemplates = async () => {
    try {
      setTemplates(await getTemplates());
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTemplates();
    }, [])
  );

  const openModalForCreate = () => {
    setEditingTemplateId(null);
    setTemplateName('');
    setAssignedDays([]);
    setAssignedDates([]);
    setDrafts([{ name: '', target_sets: '' }]);
    setModalVisible(true);
  };

  const openModalForEdit = (t: FullTemplate) => {
    setEditingTemplateId(t.id);
    setTemplateName(t.name);
    setAssignedDays(t.assigned_days || []);
    setAssignedDates(t.assigned_dates || []);
    setDrafts(
      t.exercises.map(ex => ({
        name: ex.name,
        target_sets: ex.target_sets ? ex.target_sets.toString() : '',
      }))
    );
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      useAlertStore.getState().showAlert('Error', 'Give your template a name.');
      return;
    }
    const valid = drafts.filter(d => d.name.trim());
    if (!valid.length) {
      useAlertStore.getState().showAlert('Error', 'Add at least one exercise.');
      return;
    }
    try {
      await saveTemplate(
        templateName.trim(),
        assignedDays,
        assignedDates,
        valid.map(d => ({
          name: d.name.trim(),
          target_sets: parseInt(d.target_sets) || 0,
        })),
        editingTemplateId || undefined
      );
      setModalVisible(false);
      fetchTemplates();
    } catch (e) {
      console.error(e);
      useAlertStore.getState().showAlert('Error', 'Could not save template.');
    }
  };

  const handleDelete = (id: string, name: string) => {
    useAlertStore.getState().showAlert(`Delete "${name}"?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTemplate(id);
          fetchTemplates();
        },
      },
    ]);
  };

  const handleStart = (template: FullTemplate) => {
    useAlertStore
      .getState()
      .showAlert(`Start "${template.name}"?`, 'This replaces your current workout.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          style: 'default',
          onPress: () => {
            const uid = () => Math.random().toString(36).substring(2, 9);
            useWorkoutStore.setState({
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
            });
            router.navigate('/(tabs)');
          },
        },
      ]);
  };

  const updateDraft = (i: number, field: keyof DraftExercise, value: string) =>
    setDrafts(prev => prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      {/* Header */}
      <XStack
        px="$5"
        pt="$4"
        pb="$3"
        ai="center"
        jc="space-between"
        borderBottomColor="$color3"
        borderBottomWidth={1}
      >
        <H1 color="$color12" fontSize="$9" fontWeight="900">
          Templates
        </H1>
        <Button
          size="$3"
          bg="$green9"
          color="#09090b"
          fontWeight="800"
          onPress={openModalForCreate}
          pressStyle={{ opacity: 0.8 }}
          icon={<Feather name="plus" size={16} color="#09090b" />}
        >
          New
        </Button>
      </XStack>

      {/* Template List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {templates.length === 0 ? (
          <YStack ai="center" py="$12" gap="$3">
            <Feather name="bookmark" size={44} color="#3f3f46" />
            <Text color="$color8" fontSize="$4" ta="center">
              {'No templates yet.\nCreate one to speed up logging!'}
            </Text>
          </YStack>
        ) : (
          templates.map(t => (
            <YStack
              key={t.id}
              bg="$color2"
              borderColor="$color4"
              borderWidth={1}
              br="$6"
              p="$4"
              mb="$4"
            >
              <XStack ai="flex-start" jc="space-between" mb="$2">
                <Text color="$color12" fontWeight="800" fontSize="$6" flex={1} mr="$3">
                  {t.name}
                </Text>
                <XStack gap="$2">
                  <Button
                    size="$2"
                    circular
                    bg="$color3"
                    onPress={() => openModalForEdit(t)}
                    pressStyle={{ opacity: 0.7 }}
                    icon={<Feather name="edit-2" size={14} color="#a1a1aa" />}
                  />
                  <Button
                    size="$2"
                    circular
                    bg="$red2"
                    onPress={() => handleDelete(t.id, t.name)}
                    pressStyle={{ opacity: 0.7 }}
                    icon={<Feather name="trash-2" size={14} color="#ef4444" />}
                  />
                </XStack>
              </XStack>
              {((t.assigned_days && t.assigned_days.length > 0) ||
                (t.assigned_dates && t.assigned_dates.length > 0)) && (
                <XStack gap="$2" mb="$3" flexWrap="wrap">
                  {t.assigned_days?.sort().map(d => (
                    <YStack key={`day-${d}`} bg="$green3" px="$2" py="$1" br="$4">
                      <Text color="$green10" fontSize="$2" fontWeight="700">
                        {DAYS[d]}
                      </Text>
                    </YStack>
                  ))}
                  {t.assigned_dates?.map(d => (
                    <YStack key={`date-${d}`} bg="$color4" px="$2" py="$1" br="$4">
                      <Text color="$color11" fontSize="$2" fontWeight="700">
                        {new Date(d).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </YStack>
                  ))}
                </XStack>
              )}

              {t.exercises.map((ex, i) => (
                <XStack key={ex.id} ai="center" mb="$2" gap="$3">
                  <YStack w={20} h={20} br="$10" bg="$color3" ai="center" jc="center">
                    <Text color="$color9" fontSize={10} fontWeight="700">
                      {i + 1}
                    </Text>
                  </YStack>
                  <Text color="$color11" flex={1}>
                    {ex.name}
                  </Text>
                  {ex.target_sets > 0 && (
                    <Text color="$color9" fontSize="$2">
                      {ex.target_sets} sets
                    </Text>
                  )}
                </XStack>
              ))}

              <Button
                size="$3"
                mt="$3"
                bg="$green2"
                borderColor="$green6"
                borderWidth={1}
                color="$green10"
                fontWeight="700"
                onPress={() => handleStart(t)}
                pressStyle={{ opacity: 0.8 }}
              >
                Start Workout →
              </Button>
            </YStack>
          ))
        )}
      </ScrollView>

      {/* Create Template Modal (RN Modal — no portal issues) */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: '#09090b' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                {editingTemplateId ? 'Edit Template' : 'New Template'}
              </Text>
              <Button
                size="$2"
                circular
                chromeless
                onPress={() => setModalVisible(false)}
                icon={<Feather name="x" size={20} color="#71717a" />}
              />
            </XStack>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Name */}
              <Text
                color="$color9"
                fontSize="$2"
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing={1}
                mb="$2"
              >
                Template Name
              </Text>
              <YStack
                bg="$color2"
                borderColor="$color4"
                borderWidth={1}
                br="$4"
                px="$4"
                py="$3"
                mb="$5"
              >
                <TextInput
                  style={{ color: '#fafafa', fontSize: 18, fontWeight: '700' }}
                  placeholder="e.g. Push Day"
                  placeholderTextColor="#52525b"
                  value={templateName}
                  onChangeText={setTemplateName}
                  autoFocus
                />
              </YStack>

              {/* Assigned Days */}
              <Text
                color="$color9"
                fontSize="$2"
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing={1}
                mb="$2"
              >
                Assigned Schedule (Optional)
              </Text>
              <XStack gap="$2" mb="$2" flexWrap="wrap">
                {DAYS.map((day, idx) => {
                  const isSelected = assignedDays.includes(idx);
                  return (
                    <Button
                      key={day}
                      size="$3"
                      bg={isSelected ? '$green9' : '$color2'}
                      borderColor={isSelected ? '$green9' : '$color4'}
                      borderWidth={1}
                      color={isSelected ? '#09090b' : '$color10'}
                      fontWeight="700"
                      onPress={() =>
                        setAssignedDays(prev =>
                          isSelected ? prev.filter(d => d !== idx) : [...prev, idx]
                        )
                      }
                    >
                      {day}
                    </Button>
                  );
                })}
              </XStack>

              <XStack gap="$2" mb="$5" flexWrap="wrap" ai="center">
                {assignedDates.map(dateStr => (
                  <Button
                    key={dateStr}
                    size="$3"
                    bg="$color4"
                    borderColor="$color5"
                    borderWidth={1}
                    color="$color11"
                    fontWeight="700"
                    iconAfter={<Feather name="x" size={14} />}
                    onPress={() => setAssignedDates(prev => prev.filter(d => d !== dateStr))}
                  >
                    {new Date(dateStr).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Button>
                ))}
                <Button
                  size="$3"
                  bg="$color2"
                  borderColor="$color4"
                  borderWidth={1}
                  color="$color10"
                  fontWeight="700"
                  icon={<Feather name="calendar" size={14} />}
                  onPress={() => setShowDatePicker(true)}
                >
                  Add Specific Date
                </Button>
              </XStack>

              {showDatePicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display="default"
                  themeVariant="dark"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      const dateStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                        .toISOString()
                        .split('T')[0];
                      if (!assignedDates.includes(dateStr)) {
                        setAssignedDates(prev => [...prev, dateStr]);
                      }
                    }
                  }}
                />
              )}

              {/* Exercises */}
              <Text
                color="$color9"
                fontSize="$2"
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing={1}
                mb="$3"
              >
                Exercises
              </Text>

              {drafts.map((d, i) => (
                <YStack
                  key={i}
                  bg="$color2"
                  borderColor="$color4"
                  borderWidth={1}
                  br="$4"
                  p="$4"
                  mb="$3"
                >
                  <XStack ai="flex-start" mb="$3" gap="$3">
                    <Text color="$color8" fontWeight="700" w={20} mt="$1">
                      {i + 1}.
                    </Text>
                    <ExerciseAutocomplete
                      value={d.name}
                      onChangeText={v => updateDraft(i, 'name', v)}
                      style={{ fontSize: 16, fontWeight: '600' }}
                    />
                    {drafts.length > 1 && (
                      <Button
                        size="$2"
                        circular
                        chromeless
                        onPress={() => setDrafts(prev => prev.filter((_, idx) => idx !== i))}
                        icon={<Feather name="x" size={14} color="#71717a" />}
                        mt="$1"
                      />
                    )}
                  </XStack>
                  <XStack bg="$color3" br="$3" px="$3" py="$2" ai="center">
                    <TextInput
                      style={{ flex: 1, color: '#a1a1aa', fontSize: 13 }}
                      placeholder="Target sets (optional)"
                      placeholderTextColor="#3f3f46"
                      keyboardType="numeric"
                      value={d.target_sets}
                      onChangeText={v => updateDraft(i, 'target_sets', v)}
                    />
                    <Text color="$color8" fontSize="$2">
                      sets
                    </Text>
                  </XStack>
                </YStack>
              ))}

              <Button
                size="$3"
                mb="$5"
                bg="$color2"
                borderColor="$color5"
                borderWidth={1}
                color="$color9"
                fontWeight="600"
                onPress={() => setDrafts(prev => [...prev, { name: '', target_sets: '' }])}
              >
                + Add Exercise
              </Button>

              <Button
                size="$5"
                bg="$green9"
                color="#09090b"
                fontWeight="900"
                onPress={handleSave}
                pressStyle={{ opacity: 0.8 }}
              >
                Save Template
              </Button>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
