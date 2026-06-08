import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FlatList } from 'react-native';
import type { MealType } from '@dishday/types';
import { Screen } from '../../src/components/Screen';
import { getApi } from '../../src/lib/api';
import { useTheme, useThemedStyles, type Theme } from '../../src/theme';

const FILTERS: { label: string; value: MealType | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
];

export default function RecipesScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const api = getApi();
  const [q, setQ] = useState('');
  const [mealType, setMealType] = useState<MealType | undefined>(undefined);

  const recipes = useQuery({
    queryKey: ['recipes', { q, mealType }],
    queryFn: () => api.recipes.list({ q: q || undefined, mealType, pageSize: 50 }),
  });

  return (
    <Screen padding="none">
      <View style={styles.headerWrap}>
        <Text style={styles.title}>Recipes</Text>

        <TextInput
          placeholder="Search recipes…"
          placeholderTextColor={theme.colors.placeholder}
          value={q}
          onChangeText={setQ}
          style={styles.search}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.filters}>
          {FILTERS.map((f) => {
            const active = mealType === f.value;
            return (
              <Pressable
                key={f.label}
                onPress={() => setMealType(f.value)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={active ? styles.chipTextActive : styles.chipText}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
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
            <Text style={styles.empty}>
              {q || mealType
                ? 'No recipes match this filter.'
                : 'No recipes yet — run `npm run db:seed` to load defaults.'}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              <View style={styles.metaRow}>
                {item.caloriesPerServing != null && (
                  <Text style={styles.metaItem}>{Math.round(item.caloriesPerServing)} kcal</Text>
                )}
                {item.prepTimeMin != null && (
                  <Text style={styles.metaItem}>{item.prepTimeMin} min</Text>
                )}
                {item.cuisine && <Text style={styles.metaItem}>{item.cuisine}</Text>}
              </View>
              {item.tags.length > 0 && (
                <View style={styles.tags}>
                  {item.tags.slice(0, 4).map((t) => (
                    <View key={t} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        />
      )}
    </Screen>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    headerWrap: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.md,
    },
    title: { fontSize: 28, fontWeight: '700', color: theme.colors.text },
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
    filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surfaceVariant,
    },
    chipActive: { backgroundColor: theme.colors.primary },
    chipText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
    chipTextActive: { fontSize: 13, color: theme.colors.onPrimary, fontWeight: '600' },
    list: { padding: theme.spacing.md, paddingTop: 0 },
    separator: { height: theme.spacing.sm },
    loaderRow: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
    error: { color: theme.colors.danger, paddingHorizontal: theme.spacing.xl },
    empty: { color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing.xl },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 4,
    },
    cardTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
    cardDesc: { fontSize: 13, color: theme.colors.textSecondary },
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
