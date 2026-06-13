import { useQuery } from '@tanstack/react-query';
import { pickLocalized } from '@dishday/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MealType, Recipe } from '@dishday/types';
import { getApi } from '../lib/api';
import { apiErrorMessage } from '../lib/apiError';
import { useTheme, useThemedStyles, type Theme } from '../theme';
import { Icon, Text } from './ui';
import { QuickDishModal } from './QuickDishModal';

export interface RecipePickerModalProps {
  visible: boolean;
  mealType?: MealType;
  onClose: () => void;
  onSelect: (recipe: Recipe) => void;
}

export function RecipePickerModal({
  visible,
  mealType,
  onClose,
  onSelect,
}: RecipePickerModalProps) {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const api = getApi();
  const { t, i18n } = useTranslation('recipes');
  const tMealTypes = useTranslation('mealTypes').t;
  const tCommon = useTranslation('common').t;
  const [q, setQ] = useState('');
  const [quickOpen, setQuickOpen] = useState(false);

  /**
   * When the user creates a quick dish from inside the picker, we want to
   * (a) immediately drop it into the slot they were trying to fill and
   * (b) close the picker — no point making them re-find their own new dish
   * in the list they just searched. Both modals close in one motion.
   */
  function handleQuickCreated(recipe: Recipe) {
    setQuickOpen(false);
    onSelect(recipe);
  }

  const recipes = useQuery({
    queryKey: ['recipes', { q, mealType }],
    queryFn: () => api.recipes.list({ q: q || undefined, mealType, pageSize: 50 }),
    enabled: visible,
  });

  const title = mealType
    ? t('picker.titleWithMeal', { meal: tMealTypes(mealType) })
    : t('picker.title');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text variant="headlineMd">{title}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text variant="bodyLg" color="primary">{tCommon('close')}</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={theme.colors.placeholder}
            value={q}
            onChangeText={setQ}
            style={styles.search}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Quick-dish entry point — always visible at the top so users notice
         * they CAN add a personal dish, not only pick from the catalog. */}
        <Pressable
          onPress={() => setQuickOpen(true)}
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        >
          <View style={styles.addIcon}>
            <Icon name="add" color="onPrimary" size={20} />
          </View>
          <Text variant="bodyLg" style={styles.addLabel}>{t('quickDish.addNewButton')}</Text>
          <Icon name="chevron-forward" color="textMuted" size={18} />
        </Pressable>

        {recipes.isLoading && (
          <View style={styles.loaderRow}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}

        {recipes.error && (
          <Text variant="bodyMd" color="danger" style={styles.error}>
            {t('loadError', { error: apiErrorMessage(recipes.error, t) })}
          </Text>
        )}

        {recipes.data && (
          <FlatList
            data={recipes.data.items}
            keyExtractor={(r) => r.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Text variant="bodyMd" color="textMuted" style={styles.empty}>
                {t('picker.noMatch')}
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={styles.rowMain}>
                  <Text variant="bodyLg" numberOfLines={1} style={styles.rowTitle}>
                    {pickLocalized(item.title, item.titleI18n, i18n.language)}
                  </Text>
                  {item.description && (
                    <Text variant="bodyMd" color="textSecondary" numberOfLines={2}>
                      {pickLocalized(item.description, item.descriptionI18n, i18n.language)}
                    </Text>
                  )}
                  <View style={styles.metaRow}>
                    {item.caloriesPerServing != null && (
                      <Text variant="labelSm" color="textMuted">
                        {t('meta.kcal', { value: Math.round(item.caloriesPerServing) })}
                      </Text>
                    )}
                    {item.prepTimeMin != null && (
                      <Text variant="labelSm" color="textMuted">
                        {t('meta.min', { value: item.prepTimeMin })}
                      </Text>
                    )}
                    {item.cuisine && (
                      <Text variant="labelSm" color="textMuted">{item.cuisine}</Text>
                    )}
                  </View>
                </View>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>

      <QuickDishModal
        visible={quickOpen}
        onClose={() => setQuickOpen(false)}
        onCreated={handleQuickCreated}
      />
    </Modal>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
    },
    searchWrap: { paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.sm },
    search: {
      backgroundColor: theme.colors.inputBackground,
      borderColor: theme.colors.inputBorder,
      borderWidth: 1,
      borderRadius: theme.radius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: theme.colors.text,
    },
    list: { padding: theme.spacing.md },
    separator: { height: 1, backgroundColor: theme.colors.border, marginVertical: 6 },
    loaderRow: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
    error: { paddingHorizontal: theme.spacing.md },
    empty: { textAlign: 'center', marginTop: theme.spacing.xl },
    row: { paddingVertical: theme.spacing.md, borderRadius: theme.radius.md },
    rowPressed: { backgroundColor: theme.colors.surfaceVariant },
    rowMain: { gap: 4 },
    rowTitle: { fontWeight: '600' },
    metaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },

    // Quick-dish CTA row above the catalog list.
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      paddingVertical: 10,
      paddingHorizontal: theme.spacing.sm,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.radius.md,
    },
    addBtnPressed: { opacity: 0.85 },
    addIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addLabel: { flex: 1, fontWeight: '600' },
  });
}
