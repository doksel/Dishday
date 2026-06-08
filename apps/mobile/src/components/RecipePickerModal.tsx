import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MealType, Recipe } from '@dishday/types';
import { getApi } from '../lib/api';
import { useTheme, useThemedStyles, type Theme } from '../theme';

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
  const [q, setQ] = useState('');

  const recipes = useQuery({
    queryKey: ['recipes', { q, mealType }],
    queryFn: () => api.recipes.list({ q: q || undefined, mealType, pageSize: 50 }),
    enabled: visible,
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Pick a recipe{mealType ? ` — ${mealType}` : ''}
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            placeholder="Search recipes…"
            placeholderTextColor={theme.colors.placeholder}
            value={q}
            onChangeText={setQ}
            style={styles.search}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {recipes.isLoading && (
          <View style={styles.loaderRow}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}

        {recipes.error && (
          <Text style={styles.error}>
            Could not load recipes: {(recipes.error as Error).message}
          </Text>
        )}

        {recipes.data && (
          <FlatList
            data={recipes.data.items}
            keyExtractor={(r) => r.id}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Text style={styles.empty}>No recipes match this search.</Text>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text style={styles.rowDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  <View style={styles.metaRow}>
                    {item.caloriesPerServing != null && (
                      <Text style={styles.metaItem}>
                        {Math.round(item.caloriesPerServing)} kcal
                      </Text>
                    )}
                    {item.prepTimeMin != null && (
                      <Text style={styles.metaItem}>{item.prepTimeMin} min prep</Text>
                    )}
                    {item.cuisine && <Text style={styles.metaItem}>{item.cuisine}</Text>}
                  </View>
                  {item.tags.length > 0 && (
                    <View style={styles.tags}>
                      {item.tags.slice(0, 3).map((t) => (
                        <View key={t} style={styles.tag}>
                          <Text style={styles.tagText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
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
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
    },
    title: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
    close: { color: theme.colors.primary, fontWeight: '600', fontSize: 16 },
    searchWrap: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm },
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
    list: { padding: theme.spacing.lg, gap: 0 },
    separator: { height: 1, backgroundColor: theme.colors.border, marginVertical: 6 },
    loaderRow: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
    error: { color: theme.colors.danger, paddingHorizontal: theme.spacing.lg },
    empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing.xl },
    row: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
    },
    rowPressed: { backgroundColor: theme.colors.surfaceVariant },
    rowMain: { gap: 4 },
    rowTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
    rowDesc: { fontSize: 13, color: theme.colors.textSecondary },
    metaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
    metaItem: { fontSize: 12, color: theme.colors.textMuted },
    tags: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
    tag: {
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.radius.full,
    },
    tagText: { fontSize: 11, color: theme.colors.textSecondary },
  });
}
