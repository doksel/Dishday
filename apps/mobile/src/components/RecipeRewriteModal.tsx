/**
 * AI recipe rewrite modal (Pro feature).
 *
 *   User picks one of the preset transformations (vegan, double portions,
 *   etc.) or types a custom one, hits Apply, and waits ~5-10s while Claude
 *   crafts a new variant. On success we navigate to the new recipe's detail
 *   screen so the user immediately sees the result.
 *
 *   This modal is for Pro / admin only — the caller should gate Free users
 *   to a PaywallModal before opening this one. Backend also enforces.
 */

import { useMutation } from '@tanstack/react-query';
import { ApiClientError } from '@dishday/api-client';
import type { Recipe } from '@dishday/types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Icon, Input, Text } from './ui';
import { getApi } from '../lib/api';
import { apiErrorMessage } from '../lib/apiError';
import { useTheme, useThemedStyles, type Theme } from '../theme';

export interface RecipeRewriteModalProps {
  visible: boolean;
  recipeId: string | null;
  onClose: () => void;
}

/**
 * Preset transformation keys. Translated via `recipe.rewrite.presets.*`.
 * The localized chip label is what gets sent to the AI as `prompt` —
 * keeping the prompt in the user's locale gives the model better signal
 * about the desired output language (Claude often mirrors the input).
 */
const PRESETS = ['vegan', 'double', 'healthier', 'quicker', 'noNuts'] as const;
type Preset = (typeof PRESETS)[number];

export function RecipeRewriteModal({ visible, recipeId, onClose }: RecipeRewriteModalProps) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { t } = useTranslation('recipe');
  const tCommon = useTranslation('common').t;
  const api = getApi();

  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSelectedPreset(null);
      setCustomPrompt('');
      setError(null);
    }
  }, [visible]);

  const rewrite = useMutation({
    mutationFn: ({ prompt }: { prompt: string }): Promise<Recipe> =>
      api.recipes.rewrite(recipeId!, { prompt }),
    onSuccess: (recipe) => {
      onClose();
      // Replace the current detail screen with the new one — back button
      // returns to wherever the user came from before the original recipe.
      router.replace({ pathname: '/recipe/[id]', params: { id: recipe.id } });
    },
    onError: (err) => {
      // 429 (rate limit) and 402 (Pro required) get surfaced inline; the
      // caller should already have gated Pro upstream so 402 is defensive.
      if (err instanceof ApiClientError) {
        if (err.body?.code === 'RATE_LIMITED') {
          setError(t('rewrite.errors.rateLimited'));
          return;
        }
      }
      setError(apiErrorMessage(err, t));
    },
  });

  /** Resolve the actual text prompt to send Claude. */
  function resolvePrompt(): string | null {
    if (selectedPreset) return t(`rewrite.presets.${selectedPreset}`);
    const trimmed = customPrompt.trim();
    return trimmed.length >= 3 ? trimmed : null;
  }

  function handleApply() {
    const prompt = resolvePrompt();
    if (!prompt || !recipeId) return;
    setError(null);
    rewrite.mutate({ prompt });
  }

  const canApply = !!resolvePrompt() && !!recipeId && !rewrite.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text variant="headlineMd">{t('rewrite.title')}</Text>
          <Pressable onPress={onClose} hitSlop={8} disabled={rewrite.isPending}>
            <Text variant="bodyLg" color="primary">{tCommon('close')}</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text variant="bodyMd" color="textSecondary">{t('rewrite.subtitle')}</Text>

            {/* Preset chips */}
            <View style={styles.chips}>
              {PRESETS.map((p) => (
                <Chip
                  key={p}
                  label={t(`rewrite.presets.${p}`)}
                  selected={selectedPreset === p}
                  onPress={() => {
                    setSelectedPreset(selectedPreset === p ? null : p);
                    if (selectedPreset !== p) setCustomPrompt(''); // mutually exclusive
                  }}
                />
              ))}
            </View>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text variant="labelSm" color="textMuted">{t('rewrite.or')}</Text>
              <View style={styles.line} />
            </View>

            <Input
              label={t('rewrite.customLabel')}
              placeholder={t('rewrite.customPlaceholder')}
              value={customPrompt}
              onChangeText={(v) => {
                setCustomPrompt(v);
                if (v.trim().length > 0) setSelectedPreset(null);
              }}
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            {rewrite.isPending && (
              <View style={styles.pendingRow}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text variant="bodyMd" color="textSecondary">
                  {t('rewrite.generating')}
                </Text>
              </View>
            )}

            {error && (
              <Text variant="bodyMd" color="danger">{error}</Text>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={rewrite.isPending ? t('rewrite.generating') : t('rewrite.apply')}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={<Icon name="sparkles" color="onPrimary" size={20} />}
              loading={rewrite.isPending}
              disabled={!canApply}
              onPress={handleApply}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    body: { padding: theme.spacing.lg, gap: theme.spacing.lg },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    line: { flex: 1, height: 1, backgroundColor: theme.colors.border },
    pendingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    footer: {
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  });
}
