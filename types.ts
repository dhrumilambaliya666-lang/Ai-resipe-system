
export interface Ingredient {
  name: string;
  amount: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: string;
  cookTime: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  nutrition: NutritionInfo;
  imageUrl?: string;
  cuisineType?: string;
}

export interface UserPreferences {
  dietaryRestrictions: string[];
  maxTime?: number;
  cuisinePreference?: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Expert';
  targetDish?: string; // New field for direct dish requests
}
