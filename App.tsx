
import React, { useState, useCallback, useEffect } from 'react';
import { Recipe, UserPreferences } from './types';
import { generateRecipe, generateRecipeImage } from './services/geminiService';
import NutritionChart from './components/NutritionChart';

const App: React.FC = () => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingInputValue, setIngInputValue] = useState('');
  const [targetDish, setTargetDish] = useState('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  const [preferences, setPreferences] = useState<UserPreferences>({
    dietaryRestrictions: [],
    skillLevel: 'Intermediate',
    cuisinePreference: 'Indian'
  });

  useEffect(() => {
    const saved = localStorage.getItem('flavorgen_recipes');
    if (saved) setSavedRecipes(JSON.parse(saved));
  }, []);

  const addIngredient = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (ingInputValue.trim() && !ingredients.includes(ingInputValue.trim().toLowerCase())) {
      setIngredients([...ingredients, ingInputValue.trim().toLowerCase()]);
      setIngInputValue('');
    }
  };

  const removeIngredient = (ing: string) => {
    setIngredients(ingredients.filter(i => i !== ing));
  };

  const handleGenerate = async () => {
    if (ingredients.length === 0 && !targetDish) {
      alert("Please provide at least some ingredients or a dish name.");
      return;
    }
    
    setLoading(true);
    setRecipe(null);
    setLoadingMessage(targetDish 
      ? `Architecting the perfect ${targetDish}...` 
      : 'Optimizing flavors from your pantry...'
    );

    try {
      const newRecipe = await generateRecipe(ingredients, { ...preferences, targetDish });
      setLoadingMessage('Creating professional food visuals...');
      const imageUrl = await generateRecipeImage(newRecipe.title);
      
      const finalRecipe = { ...newRecipe, imageUrl };
      setRecipe(finalRecipe);
    } catch (error) {
      console.error(error);
      alert('Failed to generate recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveRecipe = () => {
    if (recipe && !savedRecipes.find(r => r.id === recipe.id)) {
      const updated = [...savedRecipes, recipe];
      setSavedRecipes(updated);
      localStorage.setItem('flavorgen_recipes', JSON.stringify(updated));
    }
  };

  const deleteSaved = (id: string) => {
    const updated = savedRecipes.filter(r => r.id !== id);
    setSavedRecipes(updated);
    localStorage.setItem('flavorgen_recipes', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
              F
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-800 tracking-tight">FlavorGen AI</h1>
          </div>
          <button 
            onClick={() => setShowSaved(!showSaved)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-stone-100 border border-stone-200 flex items-center gap-2"
          >
            <span>{showSaved ? 'Back to Architect' : `Collection (${savedRecipes.length})`}</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-12">
        {showSaved ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-3xl font-serif font-bold">Your Recipe Collection</h2>
            {savedRecipes.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-stone-200 rounded-2xl">
                <p className="text-stone-500 italic">No saved recipes yet. Start generating!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedRecipes.map((r) => (
                  <div key={r.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 group cursor-pointer hover:shadow-md transition-shadow">
                    <div className="h-48 relative overflow-hidden">
                      <img 
                        src={r.imageUrl || `https://picsum.photos/seed/${r.id}/800/600`} 
                        alt={r.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteSaved(r.id); }}
                        className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div className="p-5" onClick={() => { setRecipe(r); setShowSaved(false); }}>
                      <h3 className="text-lg font-bold mb-1 line-clamp-1">{r.title}</h3>
                      <p className="text-stone-500 text-sm mb-4 line-clamp-2">{r.description}</p>
                      <div className="flex justify-between items-center text-xs font-semibold text-stone-400">
                        <span>{r.prepTime} Prep</span>
                        <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded">{r.cuisineType || 'Global'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Sidebar Controls */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* PART 1: THE PANTRY (Handy Ingredients) */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
                <h2 className="text-md font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-stone-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  1. Handy Ingredients
                </h2>
                <form onSubmit={addIngredient} className="relative mb-4">
                  <input
                    type="text"
                    value={ingInputValue}
                    onChange={(e) => setIngInputValue(e.target.value)}
                    placeholder="Paneer, Cumin, Spinach..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-orange-600 outline-none transition-all text-sm"
                  />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-orange-600 hover:bg-orange-50 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  </button>
                </form>
                <div className="flex flex-wrap gap-2 min-h-[3rem]">
                  {ingredients.length === 0 && <p className="text-xs text-stone-400 italic">List what you already have...</p>}
                  {ingredients.map((ing) => (
                    <span key={ing} className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 px-2 py-1 rounded-lg text-xs font-medium border border-stone-200">
                      {ing}
                      <button onClick={() => removeIngredient(ing)} className="hover:text-red-500">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </span>
                  ))}
                </div>
              </section>

              {/* PART 2: THE CRAVING (Direct Dish) */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
                <h2 className="text-md font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-stone-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  2. Direct Dish
                </h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={targetDish}
                    onChange={(e) => setTargetDish(e.target.value)}
                    placeholder="E.g., Butter Chicken, Dal Makhani..."
                    className="w-full bg-orange-50/50 border border-orange-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-600 outline-none transition-all text-sm font-medium placeholder:text-stone-400"
                  />
                  <p className="text-[10px] text-stone-400 leading-tight">
                    * If left blank, we'll architect a creative recipe using only your pantry items.
                  </p>
                </div>
              </section>

              {/* Preferences */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
                 <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Cuisine</label>
                    <select 
                      value={preferences.cuisinePreference}
                      onChange={(e) => setPreferences({...preferences, cuisinePreference: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs outline-none"
                    >
                      <option>Indian</option>
                      <option>Mediterranean</option>
                      <option>Asian</option>
                      <option>Mexican</option>
                      <option>Italian</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Dietary Mode</label>
                    <div className="flex flex-wrap gap-2">
                      {['Vegetarian', 'Vegan', 'Jain'].map(diet => (
                        <button
                          key={diet}
                          onClick={() => {
                            const current = preferences.dietaryRestrictions;
                            setPreferences({
                              ...preferences,
                              dietaryRestrictions: current.includes(diet) ? current.filter(d => d !== diet) : [...current, diet]
                            });
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                            preferences.dietaryRestrictions.includes(diet) ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200'
                          }`}
                        >
                          {diet}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <button
                onClick={handleGenerate}
                disabled={loading || (ingredients.length === 0 && !targetDish)}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${
                  loading || (ingredients.length === 0 && !targetDish)
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                    : 'bg-orange-600 text-white hover:bg-orange-700 hover:scale-[1.02] active:scale-95 shadow-orange-100'
                }`}
              >
                {loading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : 'Start Architecting'}
              </button>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-8 min-h-[600px]">
              {loading ? (
                <div className="bg-white rounded-[2rem] p-12 h-full flex flex-col items-center justify-center text-center animate-pulse">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-orange-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-2">{loadingMessage}</h3>
                </div>
              ) : recipe ? (
                <article className="bg-white rounded-[2rem] shadow-xl border border-stone-200 overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                  <div className="h-[400px] relative">
                    <img src={recipe.imageUrl || 'https://picsum.photos/1200/800'} alt={recipe.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex items-end p-12">
                      <div className="space-y-2">
                        <span className="bg-orange-600 text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest">{recipe.cuisineType || 'Custom'}</span>
                        <h2 className="text-4xl font-serif font-bold text-white">{recipe.title}</h2>
                        <div className="flex gap-6 text-white/80 text-sm">
                          <span>Prep: {recipe.prepTime}</span>
                          <span>Serves: {recipe.servings}</span>
                          <span>{recipe.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-12 space-y-12">
                    <div className="flex flex-col md:flex-row gap-12">
                      <div className="flex-1 space-y-8">
                        <section>
                          <h3 className="text-xl font-bold mb-4 border-b pb-2">Chef's Note</h3>
                          <p className="text-stone-600 leading-relaxed italic">"{recipe.description}"</p>
                        </section>
                        <section>
                          <h3 className="text-xl font-bold mb-6 border-b pb-2">Ingredients List</h3>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {recipe.ingredients.map((ing, idx) => (
                              <li key={idx} className="flex items-center gap-3 p-2 bg-stone-50 rounded-lg text-sm">
                                <span className="font-bold text-orange-600">{ing.amount}</span>
                                <span className="text-stone-700">{ing.name}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      </div>
                      <div className="md:w-56">
                        <div className="bg-stone-50 p-4 rounded-2xl text-center">
                          <h4 className="text-xs font-bold text-stone-400 uppercase mb-4">Nutrients</h4>
                          <NutritionChart nutrition={recipe.nutrition} />
                          <p className="mt-4 text-xl font-bold">{recipe.nutrition.calories} <span className="text-[10px] text-stone-400">kcal</span></p>
                        </div>
                        <button onClick={saveRecipe} disabled={savedRecipes.some(r => r.id === recipe.id)} className={`w-full mt-4 py-3 rounded-xl font-bold text-sm transition-all ${savedRecipes.some(r => r.id === recipe.id) ? 'bg-green-100 text-green-700' : 'bg-stone-800 text-white hover:bg-black'}`}>
                          {savedRecipes.some(r => r.id === recipe.id) ? 'Saved' : 'Save Recipe'}
                        </button>
                      </div>
                    </div>
                    <section>
                      <h3 className="text-xl font-bold mb-8 border-b pb-2">The Process</h3>
                      <div className="space-y-6">
                        {recipe.instructions.map((step, idx) => (
                          <div key={idx} className="flex gap-4">
                            <span className="flex-none w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-400 text-sm">{idx + 1}</span>
                            <p className="text-stone-700 leading-relaxed pt-1">{step}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                </article>
              ) : (
                <div className="bg-white rounded-[2rem] p-12 h-full flex flex-col items-center justify-center text-center border border-stone-200 border-dashed">
                  <div className="w-24 h-24 mb-6 text-stone-100">
                    <svg fill="currentColor" viewBox="0 0 24 24"><path d="M11 2L6 7l1 1L11 4.41V13h2V4.41L17 8l1-1-5-5h-2zm-6 11c-1.1 0-2 .9-2 2v5c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2h-1.5v2H19v5H5v-5h1.5v-2H5z"/></svg>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-stone-700 mb-2">Pantry or Craving?</h3>
                  <p className="text-sm text-stone-400 max-w-xs">List your <b>Handy Ingredients</b> for a pantry challenge, or type a <b>Direct Dish</b> to get an authentic recipe.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
