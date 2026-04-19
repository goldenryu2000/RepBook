import React from 'react';
import { Modal } from 'react-native';
import { YStack, XStack, Text, Button } from 'tamagui';
import { useAlertStore } from '../store/alertStore';

export function CustomAlert() {
  const { visible, title, message, buttons, hideAlert } = useAlertStore();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={hideAlert}>
      <YStack flex={1} bg="rgba(0,0,0,0.8)" ai="center" jc="center" px="$5">
        <YStack
          bg="$color2"
          borderColor="$color4"
          borderWidth={1}
          br="$6"
          p="$5"
          w="100%"
          maxWidth={400}
          elevate
        >
          <Text color="$color12" fontSize="$6" fontWeight="900" mb="$2">
            {title}
          </Text>
          {!!message && (
            <Text color="$color11" fontSize="$4" mb="$5" lineHeight={22}>
              {message}
            </Text>
          )}
          <XStack jc="flex-end" gap="$3" flexWrap="wrap" mt={message ? 0 : '$4'}>
            {buttons.map((btn, i) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              return (
                <Button
                  key={i}
                  size="$3"
                  bg={isDestructive ? '$red9' : isCancel ? '$color3' : '$green9'}
                  borderColor={isCancel ? '$color5' : 'transparent'}
                  borderWidth={1}
                  color={isDestructive ? '#fff' : isCancel ? '$color11' : '#09090b'}
                  fontWeight="800"
                  onPress={() => {
                    hideAlert();
                    if (btn.onPress) btn.onPress();
                  }}
                  pressStyle={{ opacity: 0.7 }}
                >
                  {btn.text}
                </Button>
              );
            })}
          </XStack>
        </YStack>
      </YStack>
    </Modal>
  );
}
