import React from 'react';
import { TextInput } from 'react-native';
import { XStack, YStack, Text, Button } from 'tamagui';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActiveSet } from '../types';

interface SetRowProps {
  setNumber: number;
  set: ActiveSet;
  onUpdate: (field: keyof ActiveSet, value: string) => void;
  onRemove: () => void;
}

export function SetRow({ setNumber, set, onUpdate, onRemove }: SetRowProps) {
  return (
    <XStack ai="center" gap="$2" mb="$2">
      {/* Set number badge */}
      <YStack w={28} h={28} br="$10" bg="$color3" ai="center" jc="center">
        <Text color="$color9" fontSize={11} fontWeight="700">
          {setNumber}
        </Text>
      </YStack>

      {/* Reps */}
      <XStack
        flex={1}
        bg="$color2"
        borderColor="$color4"
        borderWidth={1}
        br="$4"
        px="$3"
        py="$2"
        ai="center"
      >
        <TextInput
          style={{ flex: 1, color: '#fafafa', fontSize: 16, fontWeight: '600' }}
          placeholder="0"
          placeholderTextColor="#52525b"
          keyboardType="numeric"
          value={set.reps}
          onChangeText={v => onUpdate('reps', v)}
        />
        <Text color="$color8" fontSize="$2" fontWeight="600">
          reps
        </Text>
      </XStack>

      {/* Weight */}
      <XStack
        flex={1}
        bg="$color2"
        borderColor="$color4"
        borderWidth={1}
        br="$4"
        px="$3"
        py="$2"
        ai="center"
      >
        <TextInput
          style={{ flex: 1, color: '#fafafa', fontSize: 16, fontWeight: '600' }}
          placeholder="0"
          placeholderTextColor="#52525b"
          keyboardType="numeric"
          value={set.weight}
          onChangeText={v => onUpdate('weight', v)}
        />
        {/* lbs/kgs toggle */}
        <Button
          size="$1"
          bg="$color3"
          color="$color10"
          fontWeight="800"
          fontSize={10}
          px="$2"
          onPress={() => {
            Haptics.selectionAsync();
            onUpdate('unit', set.unit === 'lbs' ? 'kgs' : 'lbs');
          }}
          pressStyle={{ opacity: 0.7 }}
        >
          {set.unit || 'lbs'}
        </Button>
      </XStack>

      {/* Delete */}
      <Button
        size="$2"
        circular
        bg="$red2"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onRemove();
        }}
        pressStyle={{ opacity: 0.7 }}
        icon={<Feather name="trash-2" size={14} color="#ef4444" />}
      />
    </XStack>
  );
}
