import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Recipe } from '@dishday/types';
import { Chip, Icon, Text } from '../../src/components/ui';
import { getApi } from '../../src/lib/api';
import { useTheme, useThemedStyles, type Theme } from '../../src/theme';

export default function RecipeDetailScreen() {
  const theme = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = getApi();

  const recipe = useQuery<Recipe>({
    queryKey: ['recipe', id],
    queryFn: () => api.recipes.get(id),
    enabled: !!id,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero image with overlaid back button */}
        <View style={styles.heroWrap}>
          {recipe.data?.imageUrl ? (
            <Image source={{ uri: recipe.data.imageUrl }} style={styles.hero} />
          ) : (
            <View style={[styles.hero, styles.heroFallback]}>
              <Icon name="restaurant-outline" color="textMuted" size={64} />
            </View>
          )}
          <SafeAreaView edges={['top']} style={styles.heroOverlay}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
              <Icon name="chevron-back" color="text" size={22} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          {recipe.isLoading && (
            <View style={styles.loaderRow}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          )}

          {recipe.error && (
            <Text variant="bodyMd" color="danger">
              Could not load recipe: {(recipe.error as Error).message}
            </Text>
          )}

          {recipe.data && (
            <>
              <Text variant="displayLg">{recipe.data.title}</Text>
              {recipe.data.description && (
                <Text variant="bodyMd" color="textSecondary" style={styles.description}>
                  {recipe.data.description}
                </Text>
              )}

              {/* Meta row */}
              <View style={styles.metaRow}>
                {recipe.data.prepTimeMin != null && (
                  <MetaItem icon="time-outline" value={`${recipe.data.prepTimeMin} min prep`} />
                )}
                {recipe.data.cookTimeMin != null && (
                  <MetaItem icon="flame-outline" value={`${recipe.data.cookTimeMin} min cook`} />
                )}
                <MetaItem icon="people-outline" value={`${recipe.data.servings} serving${recipe.data.servings === 1 ? '' : 's'}`} />
              </View>

              {/* Tags */}
              {recipe.data.tags.length > 0 && (
                <View style={styles.tags}>
                  {recipe.data.tags.map((tag) => (
                    <Chip key={tag} label={tag} variant="tint" tone="primary" />
                  ))}
                </View>
              )}

              {/* Nutrition */}
              <View style={styles.nutrition}>
                <Text variant="headlineMd" style={styles.sectionTitle}>
                  Nutrition per serving
                </Text>
                <View style={styles.nutritionRow}>
                  <NutritionItem
                    label="kcal"
                    value={Math.round(recipe.data.caloriesPerServing ?? 0).toLocaleString()}
                    color="tertiary"
                  />
                  <NutritionItem
                    label="protein"
                    value={`${Math.round(recipe.data.proteinG ?? 0)} g`}
                    color="primary"
                  />
                  <NutritionItem
                    label="carbs"
                    value={`${Math.round(recipe.data.carbsG ?? 0)} g`}
                    color="primary"
                  />
                  <NutritionItem
                    label="fat"
                    value={`${Math.round(recipe.data.fatG ?? 0)} g`}
                    color="primary"
                  />
                </View>
              </View>

              {/* Ingredients */}
              {recipe.data.ingredients && recipe.data.ingredients.length > 0 && (
                <View>
                  <Text variant="headlineMd" style={styles.sectionTitle}>
                    Ingredients
                  </Text>
                  <View style={styles.ingredients}>
                    {recipe.data.ingredients.map((ing) => (
                      <View key={ing.id} style={styles.ingredient}>
                        <View style={styles.bullet} />
                        <Text variant="bodyMd" style={styles.ingredientText}>
                          <Text variant="bodyMd" color="text">
                            {ing.quantity} {ing.unit}
                          </Text>
                          <Text variant="bodyMd" color="textSecondary">
                            {' '}
                            · {ing.name}
                            {ing.notes ? `, ${ing.notes}` : ''}
                          </Text>
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaItem({
  icon,
  value,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  value: string;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.metaItem}>
      <Icon name={icon} color="textSecondary" size={18} />
      <Text variant="labelLg" color="textSecondary">
        {value}
      </Text>
    </View>
  );
}

function NutritionItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'primary' | 'tertiary';
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.nutritionItem}>
      <Text variant="headlineMd" color={color}>
        {value}
      </Text>
      <Text variant="labelSm" color="textMuted">
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { paddingBottom: theme.spacing.xl },
    heroWrap: { width: '100%', height: 260, position: 'relative' },
    hero: { width: '100%', height: '100%' },
    heroFallback: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: theme.spacing.md,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.text,
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    body: {
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    description: { marginTop: theme.spacing.xs },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.base },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
    nutrition: { gap: theme.spacing.sm },
    sectionTitle: { marginTop: theme.spacing.sm },
    nutritionRow: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: theme.spacing.md,
    },
    nutritionItem: { flex: 1, alignItems: 'center', gap: theme.spacing.base },
    ingredients: { gap: theme.spacing.sm },
    ingredient: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
    bullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
      marginTop: 9,
    },
    ingredientText: { flex: 1 },
    loaderRow: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
  });
}
