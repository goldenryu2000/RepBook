import React, { useState } from 'react';
import {
  TextInput,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  StyleProp,
  TextStyle,
} from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { COMMON_EXERCISES } from '../constants/exercises';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  style?: StyleProp<TextStyle>;
}

export function ExerciseAutocomplete({
  value,
  onChangeText,
  placeholder,
  autoFocus,
  style,
}: Props) {
  const [focused, setFocused] = useState(false);

  const filtered =
    value.trim() === ''
      ? COMMON_EXERCISES.slice(0, 8)
      : COMMON_EXERCISES.filter(
          ex =>
            ex.name.toLowerCase().includes(value.toLowerCase()) &&
            ex.name.toLowerCase() !== value.toLowerCase()
        ).slice(0, 8);

  return (
    <YStack>
      <TextInput
        style={[
          {
            color: '#fafafa',
            fontSize: 18,
            fontWeight: '800',
            paddingVertical: 8,
          },
          style,
        ]}
        textAlignVertical="top"
        placeholder={placeholder || 'Exercise Name'}
        placeholderTextColor="#52525b"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          // slight delay so we can register the tap on suggestion before it unmounts
          setTimeout(() => setFocused(false), 150);
        }}
        autoFocus={autoFocus}
        multiline={true}
        blurOnSubmit={true}
        onSubmitEditing={() => Keyboard.dismiss()}
      />
      {focused && filtered.length > 0 && (
        <ScrollView
          horizontal
          keyboardShouldPersistTaps="always"
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8 }}
        >
          <XStack gap="$2" pb="$1">
            {filtered.map(ex => (
              <TouchableOpacity
                key={ex.name}
                onPress={() => {
                  onChangeText(ex.name);
                  Keyboard.dismiss();
                }}
              >
                <YStack
                  bg="$color3"
                  px="$3"
                  py="$1.5"
                  br="$4"
                  borderColor="$color5"
                  borderWidth={1}
                >
                  <Text color="$color11" fontWeight="600" fontSize="$2">
                    {ex.name}
                  </Text>
                </YStack>
              </TouchableOpacity>
            ))}
          </XStack>
        </ScrollView>
      )}
    </YStack>
  );
}
