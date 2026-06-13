/**
 * Modal: add a custom item to a shopping list.
 *
 *   Inputs: ingredientName (required), quantity (required, > 0), unit
 *   (required), category (optional — one of the known buckets or empty).
 *
 *   POSTs to /shopping-lists/:id/items and invalidates the parent's
 *   shopping-list query via `onCreated`.
 */

import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Chip, Input, Text } from './ui';
import { getApi } from '../lib/api';
import { apiErrorMessage } from '../lib/apiError';
import { useThemedStyles, type Theme } from '../theme';

/**
 * Same set as the screen's KNOWN_CATEGORIES, minus "other" which we
 * represent by leaving the field empty (server stores it as null).
 */
const CATEGORIES = [
  'vegetables',
  'fruit',
  'dairy',
  'meat',
  'grains',
  'spices',
  'frozen',
  'drinks',
] as const;

export interface AddShoppingItemModalProps {
  visible: boolean;
  listId: string | null;
  onClose: () => void;
  onCreated?: () => void;
}

export function AddShoppingItemModal({
  visible,
  listId,
  onClose,
  onCreated,
}: AddShoppingItemModalProps) {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation('shoppingList');
  const tCommon = useTranslation('common').t;
  const api = getApi();

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Reset form whenever the modal is re-opened. */
  useEffect(() => {
    if (visible) {
      setName('');
      setQuantity('');
      setUnit('');
      setCategory(null);
      setError(null);
    }
  }, [visible]);

  const create = useMutation({
    mutationFn: () => {
      const qty = Number(quantity.replace(',', '.'));
      return api.shoppingLists.addItem(listId!, {
        ingredientName: name.trim(),
        totalQuantity: qty,
        unit: unit.trim(),
        category,
      });
    },
    onSuccess: () => {
      onCreated?.();
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err, t)),
  });

  function handleSave() {
    const qty = Number(quantity.replace(',', '.'));
    if (!name.trim() || !unit.trim() || !Number.isFinite(qty) || qty <= 0 || !listId) {
      // Lightweight inline validation — block submit silently for now.
      return;
    }
    setError(null);
    create.mutate();
  }

  const canSave =
    !!listId &&
    name.trim().length > 0 &&
    unit.trim().length > 0 &&
    Number.isFinite(Number(quantity.replace(',', '.'))) &&
    Number(quantity.replace(',', '.')) > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text variant="headlineMd">{t('addModal.title')}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text variant="bodyLg" color="primary">{tCommon('close')}</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Input
              label={t('addModal.name')}
              placeholder={t('addModal.namePlaceholder')}
              value={name}
              onChangeText={setName}
              autoCapitalize="sentences"
              autoFocus
            />

            <View style={styles.row}>
              <View style={styles.qtyWrap}>
                <Input
                  label={t('addModal.quantity')}
                  placeholder="100"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.unitWrap}>
                <Input
                  label={t('addModal.unit')}
                  placeholder={t('addModal.unitPlaceholder')}
                  value={unit}
                  onChangeText={setUnit}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View>
              <Text variant="labelLg" color="textSecondary" style={styles.catLabel}>
                {t('addModal.category')}
              </Text>
              <View style={styles.chips}>
                {CATEGORIES.map((c) => (
                  <Chip
                    key={c}
                    label={t(`sections.${c}`)}
                    selected={category === c}
                    onPress={() => setCategory(category === c ? null : c)}
                  />
                ))}
              </View>
            </View>

            {error && (
              <Text variant="bodyMd" color="danger">{error}</Text>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              label={t('addModal.save')}
              variant="primary"
              fullWidth
              loading={create.isPending}
              disabled={!canSave || create.isPending}
              onPress={handleSave}
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
    body: {
      padding: theme.spacing.lg,
      gap: theme.spacing.lg,
    },
    row: { flexDirection: 'row', gap: theme.spacing.md },
    qtyWrap: { flex: 1 },
    unitWrap: { flex: 1 },
    catLabel: { marginBottom: theme.spacing.sm },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    footer: {
      padding: theme.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  });
}
