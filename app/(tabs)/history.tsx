import React, { useState, useCallback } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, XStack, Text, H1, Button } from 'tamagui';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { getWorkoutHistory, deleteWorkout } from '../../db/database';
import { Workout, Exercise, Set } from '../../types';
import { useWorkoutStore } from '../../store/workoutStore';
import { useAlertStore } from '../../store/alertStore';

type HistoryWorkout = Workout & { exercises: (Exercise & { sets: Set[] })[] };

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryWorkout[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchHistory = async () => {
    try {
      const data = await getWorkoutHistory();
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const handleEdit = (workout: HistoryWorkout) => {
    useWorkoutStore.getState().loadWorkoutForEdit(workout);
    router.navigate('/(tabs)');
  };

  const handleDelete = (id: string, date: string) => {
    useAlertStore
      .getState()
      .showAlert(
        'Delete Workout?',
        `Are you sure you want to delete the workout from ${formatDate(date)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteWorkout(id);
                fetchHistory();
              } catch (e) {
                console.error(e);
              }
            },
          },
        ]
      );
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      <YStack px="$5" pt="$4" pb="$3" borderBottomColor="$color3" borderBottomWidth={1}>
        <H1 color="$color12" fontSize="$9" fontWeight="900">
          History
        </H1>
      </YStack>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ade80" />
        }
      >
        {history.length === 0 ? (
          <YStack ai="center" py="$12" gap="$3">
            <Feather name="calendar" size={48} color="#3f3f46" />
            <Text color="$color8" fontSize="$4" ta="center">
              {'No workout history yet.\nComplete a workout to see it here!'}
            </Text>
          </YStack>
        ) : (
          history.map(workout => (
            <YStack
              key={workout.id}
              bg="$color2"
              borderColor="$color4"
              borderWidth={1}
              br="$6"
              p="$4"
              mb="$4"
            >
              <XStack ai="center" jc="space-between" mb="$4">
                <XStack ai="center" gap="$2">
                  <Feather name="calendar" size={16} color="#4ade80" />
                  <Text color="$color12" fontWeight="800" fontSize="$5">
                    {formatDate(workout.date)}
                  </Text>
                </XStack>
                <XStack gap="$2">
                  <Button
                    size="$2"
                    circular
                    bg="$color3"
                    onPress={() => handleEdit(workout)}
                    icon={<Feather name="edit-2" size={14} color="#a1a1aa" />}
                  />
                  <Button
                    size="$2"
                    circular
                    bg="$red2"
                    onPress={() => handleDelete(workout.id, workout.date)}
                    icon={<Feather name="trash-2" size={14} color="#ef4444" />}
                  />
                </XStack>
              </XStack>

              {workout.exercises.map((ex, i) => (
                <YStack key={ex.id} mb={i < workout.exercises.length - 1 ? '$4' : '$0'}>
                  <Text color="$color11" fontWeight="700" fontSize="$4" mb="$2">
                    {ex.name}
                  </Text>
                  <YStack gap="$1">
                    {ex.sets.map((set, _j) => (
                      <XStack key={set.id} ai="center" gap="$3">
                        <YStack w={20} h={20} br="$10" bg="$color3" ai="center" jc="center">
                          <Text color="$color9" fontSize={10} fontWeight="700">
                            {set.set_number}
                          </Text>
                        </YStack>
                        <Text color="$color10" fontSize="$3">
                          {set.reps} reps
                        </Text>
                        <Text color="$color8" fontSize="$3">
                          ×
                        </Text>
                        <Text color="$color10" fontSize="$3" fontWeight="600">
                          {set.weight} {set.unit}
                        </Text>
                      </XStack>
                    ))}
                  </YStack>
                </YStack>
              ))}
            </YStack>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
