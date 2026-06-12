import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { MealType } from '@dishday/types';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/ui';
import { getApi } from '../../src/lib/api';
import { useTheme, useThemedStyles, type Theme } from '../../src/theme';

export default function RecipesScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const api = getApi();
  const { t } = useTranslation('recipes');
  const [q, setQ] = useState('');
  const [mealType, setMealType] = useState<MealType | undefined>(undefined);

  const FILTERS: { label: string; value: MealType | undefined }[] = [
    { label: t('filters.all'), value: undefined },
    { label: t('filters.breakfast'), value: 'breakfast' },
    { label: t('filters.lunch'), value: 'lunch' },
    { label: t('filters.dinner'), value: 'dinner' },
    { label: t('filters.snack'), value: 'snack' },
  ];

  const recipes = useQuery({
    queryKey: ['recipes', { q, mealType }],
    queryFn: () => api.recipes.list({ q: q || undefined, mealType, pageSize: 50 }),
  });

  return (
    <Screen padding="none">
      <View style={styles.headerWrap}>
        <Text variant="displayLg">{t('title')}</Text>

        <TextInput
          placeholder={t('searchPlaceholder')}
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
                <Text variant="labelLg" color={active ? 'onPrimary' : 'textSecondary'}>
                  {f.label}
                </Text>
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
        <Text variant="bodyMd" color="danger" style={styles.error}>
          {t('loadError', { error: (recipes.error as Error).message })}
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
              {q || mealType ? t('noMatch') : t('empty')}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: item.id } })}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <Text variant="headlineMd">{item.title}</Text>
              {item.description && (
                <Text variant="bodyMd" color="textSecondary" numberOfLines={2}>
                  {item.description}
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
            </Pressable>
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
    list: { padding: theme.spacing.md, paddingTop: 0 },
    separator: { height: theme.spacing.sm },
    loaderRow: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
    error: { paddingHorizontal: theme.spacing.md },
    empty: { textAlign: 'center', marginTop: theme.spacing.xl },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 4,
    },
    cardPressed: { opacity: 0.94 },
    metaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  });
}
