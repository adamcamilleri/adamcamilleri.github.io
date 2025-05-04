// Recipe Data Management
const recipeData = {
    "recipes": [
        {
            "id": "penne-alla-vodka",
            "title": "Penne alla Vodka",
            "description": "A classic Italian pasta dish featuring a creamy tomato-vodka sauce with crispy bacon.",
            "image": "../../images/penne-alla-vodka.jpg",
            "cookingTime": "35 mins",
            "calories": "650",
            "difficulty": "Medium",
            "category": "cooking",
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
            "tags": ["pasta", "italian", "creamy", "bacon"],
            "tiktokLink": "https://tiktok.com/@yourusername/video/1234567890"
        }
    ]
};

// DOM Elements
const recipeGrid = document.querySelector('.recipe-grid');
const searchInput = document.getElementById('searchInput');
const categoryButtons = document.querySelectorAll('.category-btn');
const modal = document.getElementById('recipeModal');
const modalContent = modal.querySelector('.recipe-details');
const closeModal = modal.querySelector('.close-modal');

// Initialize the recipe grid
function initializeRecipeGrid() {
    console.log('Initializing recipe grid...');
    console.log('Recipe data:', recipeData);
    console.log('Number of recipes:', recipeData.recipes.length);
    
    if (!recipeGrid) {
        console.error('Recipe grid element not found!');
        return;
    }
    
    displayRecipes(recipeData.recipes);
}

// Display recipes in the grid
function displayRecipes(recipes) {
    console.log('Displaying recipes:', recipes);
    if (!recipeGrid) {
        console.error('Recipe grid element not found!');
        return;
    }
    
    recipeGrid.innerHTML = '';
    
    if (recipes.length === 0) {
        recipeGrid.innerHTML = '<div class="no-results">No recipes found matching your search.</div>';
        return;
    }
    
    recipes.forEach(recipe => {
        console.log('Creating card for recipe:', recipe.title);
        const recipeCard = createRecipeCard(recipe);
        recipeGrid.appendChild(recipeCard);
    });
}

// Create a recipe card element
function createRecipeCard(recipe) {
    console.log('Creating card for:', recipe.title);
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.innerHTML = `
        <div class="recipe-image">
            <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
        </div>
        <div class="recipe-content">
            <h3 data-text="${recipe.title}">${recipe.title}</h3>
            <div class="recipe-meta">
                <span><i class="far fa-clock"></i> ${recipe.cookingTime}</span>
                <span><i class="fas fa-fire"></i> ${recipe.calories} cal</span>
                <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
            </div>
            <p>${recipe.description}</p>
            <div class="recipe-tags">
                ${recipe.tags.map(tag => `<span class="recipe-tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => showRecipeDetails(recipe));
    return card;
}

// Show recipe details in modal
function showRecipeDetails(recipe) {
    modalContent.innerHTML = `
        <h2 data-text="${recipe.title}">${recipe.title}</h2>
        <img src="${recipe.image}" alt="${recipe.title}">
        <div class="recipe-meta">
            <span><i class="far fa-clock"></i> ${recipe.cookingTime}</span>
            <span><i class="fas fa-fire"></i> ${recipe.calories} cal</span>
            <span><i class="fas fa-signal"></i> ${recipe.difficulty}</span>
        </div>
        <div class="ingredients">
            <h3 data-text="Ingredients">Ingredients</h3>
            <ul>
                ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
            </ul>
        </div>
        <div class="instructions">
            <h3 data-text="Instructions">Instructions</h3>
            <ol>
                ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>
        ${recipe.tiktokLink ? `
            <div class="tiktok-link">
                <a href="${recipe.tiktokLink}" target="_blank" class="btn">
                    <i class="fab fa-tiktok"></i> Watch on TikTok
                </a>
            </div>
        ` : ''}
    `;
    
    modal.classList.add('show');
}

// Close modal
closeModal.addEventListener('click', () => {
    modal.classList.remove('show');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});

// Search and filter functionality
function filterRecipes() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = document.querySelector('.category-btn.active').dataset.category;
    
    const filteredRecipes = recipeData.recipes.filter(recipe => {
        const matchesSearch = recipe.title.toLowerCase().includes(searchTerm) ||
                            recipe.description.toLowerCase().includes(searchTerm) ||
                            recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });
    
    displayRecipes(filteredRecipes);
}

// Event listeners for search and filters
searchInput.addEventListener('input', filterRecipes);

// Category button click handlers
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        // Filter recipes
        filterRecipes();
    });
});

// Initialize the recipe grid when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    console.log('Recipe grid element:', recipeGrid);
    initializeRecipeGrid();
}); 