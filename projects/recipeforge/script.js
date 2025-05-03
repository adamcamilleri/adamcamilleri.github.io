// Theme Management
const themeToggle = document.querySelector('.theme-toggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// Set initial theme based on user preference
document.documentElement.setAttribute('data-theme', 
    localStorage.getItem('theme') || (prefersDarkScheme.matches ? 'dark' : 'light')
);

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// Ingredient Management
const ingredientInput = document.querySelector('.ingredient-input');
const ingredientsList = document.querySelector('.ingredients-list');
const ingredients = new Set();

function addIngredient(ingredient) {
    if (!ingredient || ingredients.has(ingredient)) return;
    
    ingredients.add(ingredient);
    const tag = document.createElement('div');
    tag.className = 'ingredient-tag';
    tag.innerHTML = `
        <span>${ingredient}</span>
        <button class="remove-ingredient" aria-label="Remove ${ingredient}">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    tag.querySelector('.remove-ingredient').addEventListener('click', () => {
        ingredients.delete(ingredient);
        tag.remove();
    });
    
    ingredientsList.appendChild(tag);
    ingredientInput.value = '';
}

// Remove initial ingredients and add event listeners
document.querySelectorAll('.ingredient-tag').forEach(tag => {
    const ingredient = tag.querySelector('span').textContent;
    ingredients.add(ingredient);
    
    tag.querySelector('.remove-ingredient').addEventListener('click', () => {
        ingredients.delete(ingredient);
        tag.remove();
    });
});

ingredientInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const ingredient = ingredientInput.value.trim();
        if (ingredient) {
            addIngredient(ingredient);
        }
    }
});

// Dietary Preferences
const preferenceTags = document.querySelectorAll('.preference-tag');
const selectedPreferences = new Set();

preferenceTags.forEach(tag => {
    tag.addEventListener('click', () => {
        const preference = tag.dataset.preference;
        if (selectedPreferences.has(preference)) {
            selectedPreferences.delete(preference);
            tag.classList.remove('selected');
        } else {
            selectedPreferences.add(preference);
            tag.classList.add('selected');
        }
    });
});

// Recipe Data Management
const recipeData = {
    "recipes": [
        {
            "id": "pasta-primavera",
            "title": "Pasta Primavera",
            "description": "A light and fresh pasta dish featuring seasonal vegetables and herbs.",
            "image": "https://source.unsplash.com/random/800x600/?pasta",
            "cookingTime": "30 mins",
            "calories": "450",
            "difficulty": "Easy",
            "ingredients": [
                "200g pasta",
                "2 cups mixed vegetables",
                "2 cloves garlic",
                "1/4 cup olive oil",
                "Fresh herbs",
                "Salt and pepper"
            ],
            "instructions": [
                "Cook pasta according to package instructions",
                "Sauté vegetables and garlic in olive oil",
                "Combine with pasta and season to taste",
                "Garnish with fresh herbs"
            ],
            "tags": ["vegetarian", "pasta", "quick"]
        },
        {
            "id": "chicken-stir-fry",
            "title": "Quick Chicken Stir Fry",
            "description": "A healthy and flavorful stir-fry that comes together in minutes.",
            "image": "https://source.unsplash.com/random/800x600/?stirfry",
            "cookingTime": "20 mins",
            "calories": "380",
            "difficulty": "Easy",
            "ingredients": [
                "2 chicken breasts",
                "2 cups mixed vegetables",
                "2 tbsp soy sauce",
                "1 tbsp ginger",
                "2 cloves garlic",
                "1 tbsp oil"
            ],
            "instructions": [
                "Slice chicken into thin strips",
                "Stir-fry chicken until golden",
                "Add vegetables and stir-fry until crisp-tender",
                "Add sauce and seasonings",
                "Serve hot over rice"
            ],
            "tags": ["chicken", "quick", "asian"]
        },
        {
            "id": "vegetable-curry",
            "title": "Creamy Vegetable Curry",
            "description": "A rich and creamy curry packed with seasonal vegetables.",
            "image": "https://source.unsplash.com/random/800x600/?curry",
            "cookingTime": "45 mins",
            "calories": "320",
            "difficulty": "Medium",
            "ingredients": [
                "2 cups mixed vegetables",
                "1 can coconut milk",
                "2 tbsp curry paste",
                "1 onion",
                "2 cloves garlic",
                "Fresh cilantro"
            ],
            "instructions": [
                "Sauté onions and garlic",
                "Add curry paste and cook until fragrant",
                "Add vegetables and coconut milk",
                "Simmer until vegetables are tender",
                "Garnish with cilantro"
            ],
            "tags": ["vegetarian", "curry", "indian"]
        },
        {
            "id": "penne-alla-vodka",
            "title": "Penne alla Vodka",
            "description": "A classic Italian pasta dish featuring a creamy tomato-vodka sauce with crispy bacon.",
            "image": "../../images/penne-alla-vodka.jpg",
            "cookingTime": "35 mins",
            "calories": "650",
            "difficulty": "Medium",
            "ingredients": [
                "454g penne pasta",
                "1/4 cup grated parmesan cheese",
                "690ml tomato sauce",
                "1 tbsp Italian seasoning",
                "1/2 pack bacon",
                "1 tsp black pepper",
                "1 tsp red pepper flakes",
                "3/4 cup heavy cream",
                "4 garlic cloves, minced",
                "1 medium onion, diced",
                "1/4 cup vodka"
            ],
            "instructions": [
                "Cook pasta according to package instructions",
                "In a large pan, cook bacon until crispy, then remove and crumble",
                "In the same pan, sauté onion and garlic until softened",
                "Add vodka and cook for 2 minutes to burn off alcohol",
                "Add tomato sauce, Italian seasoning, black pepper, and red pepper flakes",
                "Simmer for 10 minutes",
                "Stir in heavy cream and cook for 5 minutes",
                "Add cooked pasta and toss to coat",
                "Top with crumbled bacon and parmesan cheese"
            ],
            "tags": ["pasta", "italian", "creamy", "bacon"]
        }
    ]
};

console.log('Recipe data initialized with', recipeData.recipes.length, 'recipes');

// Recipe Generation
const generateButton = document.querySelector('.generate-button');
const recipeCard = document.querySelector('.recipe-card');

generateButton.addEventListener('click', async () => {
    if (ingredients.size === 0) {
        showNotification('Please add at least one ingredient', 'error');
        return;
    }

    generateButton.disabled = true;
    generateButton.textContent = 'Generating Recipe...';

    try {
        const ingredientsList = [...ingredients];
        console.log('Generating recipe for ingredients:', ingredientsList);
        
        const recipe = await generateRecipe(ingredientsList, [...selectedPreferences]);
        console.log('Generated recipe:', recipe);
        
        if (!recipe) {
            showNotification('No matching recipes found. Try different ingredients!', 'info');
            return;
        }

        await displayRecipe(recipe);
    } catch (error) {
        console.error('Error in recipe generation:', error);
        showNotification('Failed to generate recipe. Please try again.', 'error');
    } finally {
        generateButton.disabled = false;
        generateButton.textContent = 'Generate Recipe';
    }
});

// Image Generation
async function generateRecipeImage(recipeTitle) {
    // For now, just return the recipe's image if it exists
    const recipe = recipeData.recipes.find(r => r.title === recipeTitle);
    if (recipe && recipe.image) {
        return recipe.image;
    }
    
    // Fallback to a default image if no specific image is found
    return "../../images/default-recipe.jpg";
}

// Update the displayRecipe function to use the new image generation
async function displayRecipe(recipe) {
    if (!recipe) {
        console.error('No recipe provided to display');
        return;
    }

    console.log('Displaying recipe:', recipe);
    
    // Generate or fetch image for the recipe
    const recipeImage = await generateRecipeImage(recipe.title);
    
    recipeCard.innerHTML = `
        <div class="recipe-image">
            <img src="${recipeImage}" alt="${recipe.title}" loading="lazy">
        </div>
        <div class="recipe-details">
            <h3>${recipe.title}</h3>
            <p>${recipe.description}</p>
            <div class="recipe-meta">
                <span><i class="far fa-clock"></i> ${recipe.cookingTime}</span>
                <span><i class="fas fa-fire"></i> ${recipe.calories} cal</span>
                <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
            </div>
            <div class="recipe-actions">
                <button class="save-recipe">
                    <i class="far fa-bookmark"></i> Save
                </button>
                <button class="view-recipe">
                    <i class="fas fa-utensils"></i> View Recipe
                </button>
            </div>
        </div>
    `;

    // Add event listeners to new buttons
    recipeCard.querySelector('.save-recipe').addEventListener('click', () => {
        showNotification('Recipe saved to your collection!', 'success');
    });

    recipeCard.querySelector('.view-recipe').addEventListener('click', () => {
        showRecipeDetails(recipe);
    });
}

// Update the generateRecipe function to include image generation
async function generateRecipe(ingredients, preferences) {
    console.log('Generating recipe with:');
    console.log('Ingredients:', ingredients);
    console.log('Preferences:', preferences);
    console.log('Current recipe data:', recipeData);

    if (!recipeData || !recipeData.recipes) {
        console.error('Recipe data not loaded');
        showNotification('Recipe data not loaded. Please try again.', 'error');
        return null;
    }

    // Normalize ingredients for comparison
    const normalizedIngredients = ingredients.map(ing => ing.toLowerCase().trim());
    console.log('Normalized ingredients:', normalizedIngredients);

    const matchingRecipes = recipeData.recipes.filter(recipe => {
        console.log('\nChecking recipe:', recipe.title);
        console.log('Recipe ingredients:', recipe.ingredients);
        
        // Check if recipe matches dietary preferences
        if (preferences.length > 0) {
            const recipeTags = new Set(recipe.tags);
            const hasMatchingPreference = preferences.some(pref => recipeTags.has(pref));
            console.log('Recipe tags:', recipe.tags);
            console.log('Has matching preference:', hasMatchingPreference);
            if (!hasMatchingPreference) return false;
        }

        // Check if recipe contains any of the input ingredients
        const hasMatchingIngredient = recipe.ingredients.some(recipeIngredient => {
            const normalizedRecipeIngredient = recipeIngredient.toLowerCase().trim();
            const matches = normalizedIngredients.some(inputIngredient => {
                const match = normalizedRecipeIngredient.includes(inputIngredient) || 
                            inputIngredient.includes(normalizedRecipeIngredient);
                if (match) {
                    console.log(`Match found: "${normalizedRecipeIngredient}" contains "${inputIngredient}"`);
                }
                return match;
            });
            return matches;
        });
        
        console.log('Has matching ingredient:', hasMatchingIngredient);
        return hasMatchingIngredient;
    });

    console.log('\nMatching recipes found:', matchingRecipes.length);
    console.log('Matching recipes:', matchingRecipes.map(r => r.title));

    if (matchingRecipes.length === 0) {
        showNotification('No recipes found with these ingredients. Try adding more ingredients!', 'info');
        return null;
    }

    // Select a random recipe from matching recipes
    const selectedRecipe = matchingRecipes[Math.floor(Math.random() * matchingRecipes.length)];
    console.log('Selected recipe:', selectedRecipe.title);

    // Add image generation to the recipe object
    const recipe = {
        ...selectedRecipe,
        image: await generateRecipeImage(selectedRecipe.title)
    };
    
    return recipe;
}

// Recipe Details Modal
function showRecipeDetails(recipe) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-modal" aria-label="Close modal">
                <i class="fas fa-times"></i>
            </button>
            <h2>${recipe.title}</h2>
            <div class="recipe-full-details">
                <div class="ingredients-list">
                    <h3>Ingredients</h3>
                    <ul>
                        ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                    </ul>
                </div>
                <div class="instructions">
                    <h3>Instructions</h3>
                    <ol>
                        ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add('show');

    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    });
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Active Navigation Link
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 60) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
}); 