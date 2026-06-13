/**
 * Shopping list screen.
 *
 *   Route: /shopping-list/[planId]
 *
 *   Layout: SectionList grouped by ingredient `category` (with an "Other"
 *   bucket for items where `category` is null). Inside each section, items
 *   are sorted alphabetically. Checked items drift to the bottom of their
 *   section in a muted, struck-through state — that way the user always
 *   sees their progress without losing context.
 *
 *   Header shows progress (e.g. "12 / 23") and a right-side "regenerate"
 *   button that destructively rebuilds the list from the meal plan.
 *
 *   Tap on item        → toggle checked (optimistic).
 *   Long-press on item → action sheet (Delete).
 *   Pull-to-refresh    → re-fetch from server (no regenerate).
 *   FAB "+"            → opens the Add Item modal (S5).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ShoppingList, ShoppingListItem } from '@dishday/types';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fab } from '../../src/components/Fab';
import { AddShoppingItemModal } from '../../src/components/AddShoppingItemModal';
import { Checkbox, Icon, Text } from '../../src/components/ui';
import { getApi } from '../../src/lib/api';
import { apiErrorMessage } from '../../src/lib/apiError';
import { useTheme, useThemedStyles, type Theme } from '../../src/theme';

/**
 * Categories we recognize and group under. Anything else (including null)
 * falls into the `"other"` bucket. The order here is the on-screen order
 * — roughly mirrors a typical supermarket layout (perimeter → center).
 */
const KNOWN_CATEGORIES = [
  'vegetables',
  'fruit',
  'dairy',
  'meat',
  'grains',
  'spices',
  'frozen',
  'drinks',
  'other',
] as const;

type CategoryKey = (typeof KNOWN_CATEGORIES)[number];

interface Section {
  key: CategoryKey;
  title: string;
  data: ShoppingListItem[];
}

export default function ShoppingListScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const { t } = useTranslation('shoppingList');
  const tCommon = useTranslation('common').t;
  const api = getApi();
  const qc = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);

  const listQ = useQuery<ShoppingList>({
    queryKey: ['shopping-list', planId],
    queryFn: () => api.shoppingLists.forPlan(planId!),
    enabled: !!planId,
  });

  const list = listQ.data;
  const items = list?.items ?? [];

  /**
   * Optimistic toggle. We mutate the cached list immediately, fire the
   * PATCH in the background, and roll back on error. Snapshot the
   * previous list inside `onMutate` so `onError` can restore it exactly.
   */
  const toggle = useMutation({
    mutationFn: ({ itemId, isChecked }: { itemId: string; isChecked: boolean }) =>
      api.shoppingLists.toggleItem(list!.id, itemId, isChecked),
    onMutate: async ({ itemId, isChecked }) => {
      await qc.cancelQueries({ queryKey: ['shopping-list', planId] });
      const prev = qc.getQueryData<ShoppingList>(['shopping-list', planId]);
      if (prev) {
        qc.setQueryData<ShoppingList>(['shopping-list', planId], {
          ...prev,
          items: prev.items?.map((it) => (it.id === itemId ? { ...it, isChecked } : it)),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['shopping-list', planId], ctx.prev);
    },
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => api.shoppingLists.removeItem(list!.id, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shopping-list', planId] }),
  });

  const regenerate = useMutation({
    mutationFn: () => api.shoppingLists.regenerate(planId!),
    onSuccess: (fresh) => qc.setQueryData(['shopping-list', planId], fresh),
  });

  /** Build sections — group by category, sort items alphabetically,
   *  push checked items to the end of their section. */
  const sections: Section[] = useMemo(() => {
    const buckets = new Map<CategoryKey, ShoppingListItem[]>();
    for (const item of items) {
      const raw = (item.category ?? '').toLowerCase();
      const key = (KNOWN_CATEGORIES as readonly string[]).includes(raw)
        ? (raw as CategoryKey)
        : 'other';
      const arr = buckets.get(key) ?? [];
      arr.push(item);
      buckets.set(key, arr);
    }
    // Sort each bucket: unchecked first (alpha), then checked (alpha).
    for (const arr of buckets.values()) {
      arr.sort((a, b) => {
        if (a.isChecked !== b.isChecked) return a.isChecked ? 1 : -1;
        return a.ingredientName.localeCompare(b.ingredientName);
      });
    }
    return KNOWN_CATEGORIES
      .filter((k) => buckets.has(k))
      .map<Section>((k) => ({
        key: k,
        title: t(`sections.${k}`),
        data: buckets.get(k)!,
      }));
  }, [items, t]);

  const total = items.length;
  const checked = items.filter((it) => it.isChecked).length;

  function handleLongPress(item: ShoppingListItem) {
    Alert.alert(t('confirms.deleteItemTitle'), t('confirms.deleteItemBody'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: t('confirms.remove'),
        style: 'destructive',
        onPress: () => removeItem.mutate(item.id),
      },
    ]);
  }

  function handleRegenerate() {
    Alert.alert(t('confirms.regenerateTitle'), t('confirms.regenerateBody'), [
      { text: tCommon('cancel'), style: 'cancel' },
      {
        text: t('confirms.regenerate'),
        style: 'destructive',
        onPress: () => regenerate.mutate(),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom header — back arrow · title + progress · regenerate */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerBtn}>
          <Icon name="chevron-back" size={26} color="text" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text variant="headlineMd">{t('title')}</Text>
          {total > 0 && (
            <Text variant="labelSm" color="textSecondary">
              {t('progress', { checked, total })}
            </Text>
          )}
        </View>
        <Pressable
          onPress={handleRegenerate}
          disabled={regenerate.isPending || total === 0}
          hitSlop={8}
          style={styles.headerBtn}
        >
          {regenerate.isPending ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Icon name="refresh" size={22} color={total === 0 ? 'textMuted' : 'text'} />
          )}
        </Pressable>
      </View>

      {listQ.isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      )}

      {listQ.error && (
        <View style={[styles.centered, styles.padded]}>
          <Text variant="bodyMd" color="danger" align="center">
            {t('loadError', { error: apiErrorMessage(listQ.error, t) })}
          </Text>
        </View>
      )}

      {!listQ.isLoading && !listQ.error && total === 0 && (
        <View style={[styles.centered, styles.padded]}>
          <Text variant="headlineMd" align="center">{t('empty.noItemsTitle')}</Text>
          <Text variant="bodyMd" color="textSecondary" align="center" style={styles.emptyBody}>
            {t('empty.noItemsBody')}
          </Text>
          <Pressable onPress={handleRegenerate} style={styles.cta}>
            <Text variant="bodyLg" color="onPrimary">{t('empty.noItemsCta')}</Text>
          </Pressable>
        </View>
      )}

      {total > 0 && (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 96 }]}
          refreshControl={
            <RefreshControl
              refreshing={listQ.isFetching && !listQ.isLoading}
              onRefresh={() => listQ.refetch()}
              tintColor={theme.colors.primary}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text variant="labelLg" color="textSecondary">
                {section.title.toUpperCase()}
              </Text>
              <Text variant="labelSm" color="textMuted">{section.data.length}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() => handleLongPress(item)}
              delayLongPress={350}
              style={({ pressed }) => [styles.itemRow, pressed && styles.itemPressed]}
            >
              <Checkbox
                checked={item.isChecked}
                onChange={(next) => toggle.mutate({ itemId: item.id, isChecked: next })}
                strikeThrough
                label={item.ingredientName}
                style={styles.itemCheckbox}
              />
              <Text
                variant="bodyMd"
                color={item.isChecked ? 'textMuted' : 'textSecondary'}
                style={[styles.itemQty, item.isChecked && styles.struck]}
              >
                {formatQty(item.totalQuantity)} {item.unit}
              </Text>
            </Pressable>
          )}
        />
      )}

      {list && <Fab icon="add" onPress={() => setAddOpen(true)} />}

      <AddShoppingItemModal
        visible={addOpen}
        listId={list?.id ?? null}
        onClose={() => setAddOpen(false)}
        onCreated={() => qc.invalidateQueries({ queryKey: ['shopping-list', planId] })}
      />
    </SafeAreaView>
  );
}

/** Trim trailing zeros so "200.000" → "200" and "0.500" → "0.5". */
function formatQty(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  return Number(n.toFixed(3)).toString();
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    headerBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm },
    padded: { padding: theme.spacing.xl },
    emptyBody: { maxWidth: 280 },
    cta: {
      marginTop: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radius.full,
    },
    listContent: { paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.sm },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      paddingVertical: theme.spacing.sm,
      paddingTop: theme.spacing.md,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    itemPressed: { backgroundColor: theme.colors.surfaceVariant },
    itemCheckbox: { flex: 1 },
    itemQty: { minWidth: 70, textAlign: 'right' },
    struck: { textDecorationLine: 'line-through' },
  });
}
