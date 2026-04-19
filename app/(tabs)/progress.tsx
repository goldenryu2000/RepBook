import React, { useState, useCallback } from 'react';
import { ScrollView, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polyline, Polygon, Defs, LinearGradient, Stop } from 'react-native-svg';
import { YStack, XStack, Text, H1, Button } from 'tamagui';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getWorkoutHistory } from '../../db/database';

interface BarPoint {
  date: string;
  maxWeight: number;
  unit: string;
}
interface ExerciseGroup {
  name: string;
  data: BarPoint[];
  maxEver: number;
  lastUnit: string;
}

const BAR_MAX_PX = 88;
const POINT_SPACING = 48;

export default function ProgressScreen() {
  const [groups, setGroups] = useState<ExerciseGroup[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  const fetchData = async () => {
    try {
      const history = await getWorkoutHistory();
      const grouped: Record<string, ExerciseGroup> = {};

      [...history].reverse().forEach(w => {
        const dateStr = new Date(w.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
        w.exercises.forEach(ex => {
          const key = ex.name.trim().toLowerCase();
          if (!key) return;
          if (!grouped[key])
            grouped[key] = { name: ex.name, data: [], maxEver: 0, lastUnit: 'lbs' };
          let max = 0;
          let unit = 'lbs';
          ex.sets.forEach(s => {
            if (s.weight > max) {
              max = s.weight;
              unit = s.unit || 'lbs';
            }
          });
          if (max > 0) {
            grouped[key].data.push({ date: dateStr, maxWeight: max, unit });
            if (max > grouped[key].maxEver) {
              grouped[key].maxEver = max;
              grouped[key].lastUnit = unit;
            }
          }
        });
      });
      setGroups(Object.values(grouped).filter(g => g.data.length > 0));
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
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
          Progress
        </H1>
        <Button
          size="$3"
          bg="$color3"
          onPress={() => setChartType(p => (p === 'bar' ? 'line' : 'bar'))}
          icon={
            <Feather
              name={chartType === 'bar' ? 'activity' : 'bar-chart-2'}
              size={14}
              color="#a1a1aa"
            />
          }
          pressStyle={{ opacity: 0.8 }}
        >
          {chartType === 'bar' ? 'Line' : 'Bar'}
        </Button>
      </XStack>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ade80" />
        }
      >
        {groups.length === 0 ? (
          <YStack ai="center" py="$12" gap="$3">
            <Feather name="trending-up" size={48} color="#3f3f46" />
            <Text color="$color8" fontSize="$4" ta="center">
              {'No workout data yet.\nFinish a workout to see your progress!'}
            </Text>
          </YStack>
        ) : (
          groups.map((group, i) => (
            <YStack
              key={i}
              bg="$color2"
              borderColor="$color4"
              borderWidth={1}
              br="$6"
              p="$4"
              mb="$4"
            >
              {/* Header */}
              <XStack ai="center" jc="space-between" mb="$4">
                <Text
                  color="$color12"
                  fontWeight="800"
                  fontSize="$6"
                  textTransform="capitalize"
                  flex={1}
                  mr="$2"
                >
                  {group.name}
                </Text>
                <YStack ai="flex-end">
                  <Text color="$color9" fontSize="$1" fontWeight="600">
                    ALL-TIME PR
                  </Text>
                  <Text color="$green10" fontWeight="800" fontSize="$5">
                    {group.maxEver} {group.lastUnit}
                  </Text>
                </YStack>
              </XStack>

              {/* Chart Area */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View
                  style={{ minWidth: group.data.length * POINT_SPACING, height: BAR_MAX_PX + 40 }}
                >
                  {chartType === 'line' &&
                    (() => {
                      const linePoints = group.data
                        .map((pt, idx) => {
                          const x = idx * POINT_SPACING + POINT_SPACING / 2;
                          const height = Math.max((pt.maxWeight / group.maxEver) * BAR_MAX_PX, 8);
                          const y = BAR_MAX_PX + 40 - height - 16;
                          return `${x},${y}`;
                        })
                        .join(' ');

                      const firstX = POINT_SPACING / 2;
                      const lastX = (group.data.length - 1) * POINT_SPACING + POINT_SPACING / 2;
                      const bottomY = BAR_MAX_PX + 40 - 16;
                      const areaPoints = `${firstX},${bottomY} ${linePoints} ${lastX},${bottomY}`;

                      return (
                        <Svg
                          height="100%"
                          width="100%"
                          style={{ position: 'absolute', top: 0, left: 0 }}
                        >
                          <Defs>
                            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                              <Stop offset="0" stopColor="#4ade80" stopOpacity="0.35" />
                              <Stop offset="1" stopColor="#4ade80" stopOpacity="0.0" />
                            </LinearGradient>
                          </Defs>
                          <Polygon points={areaPoints} fill="url(#grad)" />
                          <Polyline
                            points={linePoints}
                            fill="none"
                            stroke="#4ade80"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      );
                    })()}

                  <XStack ai="flex-end" gap={0} style={{ height: '100%' }}>
                    {group.data.map((pt, idx) => {
                      const height = Math.max((pt.maxWeight / group.maxEver) * BAR_MAX_PX, 8);
                      const isMax = pt.maxWeight === group.maxEver;
                      return (
                        <YStack key={idx} ai="center" jc="flex-end" w={POINT_SPACING} h="100%">
                          {/* Label Pill */}
                          <YStack
                            style={{ position: 'absolute', bottom: height + 24, zIndex: 20 }}
                            bg="rgba(9, 9, 11, 0.85)"
                            px={6}
                            py={2}
                            br="$2"
                          >
                            <Text
                              color={isMax ? '$green10' : '$color11'}
                              fontSize={10}
                              fontWeight="800"
                            >
                              {pt.maxWeight}
                            </Text>
                          </YStack>

                          {chartType === 'bar' ? (
                            <View
                              key="bar"
                              style={{
                                width: 24,
                                height: BAR_MAX_PX,
                                backgroundColor: '#27272a',
                                borderRadius: 6,
                                justifyContent: 'flex-end',
                                overflow: 'hidden',
                                marginBottom: 16,
                              }}
                            >
                              <View
                                style={{
                                  width: '100%',
                                  height: height,
                                  backgroundColor: isMax ? '#4ade80' : '#16a34a',
                                  borderRadius: 6,
                                }}
                              />
                            </View>
                          ) : (
                            <View
                              key="line"
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                backgroundColor: isMax ? '#4ade80' : '#16a34a',
                                borderColor: '#09090b',
                                borderWidth: 2,
                                position: 'absolute',
                                bottom: height + 11,
                                zIndex: 10,
                              }}
                            />
                          )}

                          <Text
                            color="$color8"
                            style={{ fontSize: 10, position: 'absolute', bottom: 0 }}
                          >
                            {pt.date}
                          </Text>
                        </YStack>
                      );
                    })}
                  </XStack>
                </View>
              </ScrollView>
            </YStack>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
