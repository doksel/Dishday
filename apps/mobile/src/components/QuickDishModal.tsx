/**
 * Quick-dish creation modal — the lowest-friction path to add a personal
 * recipe to a meal slot.
 *
 *   Single text input: the dish name. Everything else (ingredients,
 *   instructions, macros, image) is omitted on purpose — Free users get the
 *   full edit UI later as a Pro feature, but everyone can drop a quick
 *   reminder ("Mom's pancakes", "leftover risotto") into their plan.
 *
 *   On save:
 *     1. POST /recipes { title } → backend creates a Recipe with
 *        source='user', isPublic=false (Free) or true (Pro), no ingredients.
 *     2. The created Recipe is passed back via `onCreated` so the caller
 *        (typically RecipePickerModal) can immediately drop it into the slot.
 */

import { useMutation } from '@tanstack/react-query';
import { ApiClientError } from '@dishday/api-client';
import type { Recipe } from '@dishday/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Text } from './ui';
import { getApi } from '../lib/api';
import { apiErrorMessage } from '../lib/apiError';
import { useThemedStyles, type Theme } from '../theme';
import { PaywallModal } from './PaywallModal';

export interface QuickDishModalProps {
  visible: boolean;
  onClose: () => void;
  /** Fired with the freshly created Recipe — parent decides what to do next. */
  onCreated?: (recipe: Recipe) => void;
}

export function QuickDishModal({ visible, onClose, onCreated }: QuickDishModalProps) {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation('recipes');
  const tCommon = useTranslation('common').t;
  const api = getApi();

  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  // Reset form whenever the modal is re-opened (matches AddShoppingItemModal pattern).
  useEffect(() => {
    if (visible) {
      setTitle('');
      setError(null);
      setPaywallOpen(false);
    }
  }, [visible]);

  const create = useMutation({
    mutationFn: () => api.recipes.create({ title: title.trim() }) as Promise<Recipe>,
    onSuccess: (recipe) => {
      onCreated?.(recipe);
      onClose();
    },
    onError: (err) => {
      // Free users hit the quick-dish cap → server returns 402 LIMIT_REACHED.
      // Surface the paywall with the right framing instead of a generic
      // inline error.
      if (
        err instanceof ApiClientError &&
        err.status === 402 &&
        err.body?.code === 'LIMIT_REACHED'
      ) {
        setPaywallOpen(true);
        return;
      }
      setError(apiErrorMessage(err, t));
    },
  });

  const canSave = title.trim().length > 0 && !create.isPending;

  function handleSave() {
    if (!canSave) return;
    setError(null);
    create.mutate();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text variant="headlineMd">{t('quickDish.title')}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text variant="bodyLg" color="primary">{tCommon('close')}</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={styles.body}>
            <Input
              label={t('quickDish.name')}
              placeholder={t('quickDish.placeholder')}
              value={title}
              onChangeText={setTitle}
              autoCapitalize="sentences"
              autoFocus
              onSubmitEditing={handleSave}
              returnKeyType="done"
              maxLength={120}
            />

            <Text variant="labelSm" color="textMuted" style={styles.hint}>
              {t('quickDish.hint')}
            </Text>

            {error && (
              <Text variant="bodyMd" color="danger">{error}</Text>
            )}
          </View>

          <View style={styles.footer}>
            <Button
              label={create.isPending ? t('quickDish.saving') : t('quickDish.save')}
              variant="primary"
              size="lg"
              fullWidth
              loading={create.isPending}
              disabled={!canSave}
              onPress={handleSave}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <PaywallModal
        visible={paywallOpen}
        context="quickDishes"
        onClose={() => {
          setPaywallOpen(false);
          onClose();
        }}
      />
    </Modal>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    body: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    hint: { lineHeight: 16 },
    footer: {
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  });
}
