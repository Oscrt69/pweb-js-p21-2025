// Global state
let allRecipes = []
let filteredRecipes = []
let displayedRecipes = 0
const recipesPerPage = 6
let searchTimeout = null

// Check authentication on recipes page
if (window.location.pathname.includes("recipes.html")) {
  const user = localStorage.getItem("firstName")
  if (!user) {
    window.location.href = "index.html"
  } else {
    initRecipesPage()
  }
}

// Login Page Logic
if (window.location.pathname.includes("index.html") || window.location.pathname === "/") {
  const loginForm = document.getElementById("loginForm")

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }
}

async function handleLogin(e) {
  e.preventDefault()

  const username = document.getElementById("username").value.trim()
  const password = document.getElementById("password").value
  const errorMessage = document.getElementById("errorMessage")
  const successMessage = document.getElementById("successMessage")
  const loginButton = document.getElementById("loginButton")
  const buttonText = document.getElementById("buttonText")
  const loadingSpinner = document.getElementById("loadingSpinner")

  // Hide previous messages
  errorMessage.classList.add("hidden")
  successMessage.classList.add("hidden")

  // Validate inputs
  if (!username || !password) {
    showError("Please enter both username and password")
    return
  }

  // Show loading state
  loginButton.disabled = true
  buttonText.classList.add("hidden")
  loadingSpinner.classList.remove("hidden")

  try {
    // Fetch users data
    const response = await fetch("dummyusers.txt")

    if (!response.ok) {
      throw new Error("Failed to fetch user data")
    }

    const data = await response.json()
    const users = data.users

    // Find matching user
    const user = users.find((u) => u.username === username)

    if (!user) {
      showError("Invalid username or password")
      resetLoginButton()
      return
    }

    // Check password
    if (user.password !== password) {
      showError("Invalid username or password")
      resetLoginButton()
      return
    }

    // Login successful
    localStorage.setItem("firstName", user.firstName)
    successMessage.textContent = `Welcome, ${user.firstName}! Redirecting...`
    successMessage.classList.remove("hidden")

    // Redirect after short delay
    setTimeout(() => {
      window.location.href = "recipes.html"
    }, 1500)
  } catch (error) {
    console.error("[v0] Login error:", error)
    showError("Connection error. Please try again later.")
    resetLoginButton()
  }

  function showError(message) {
    errorMessage.textContent = message
    errorMessage.classList.remove("hidden")
  }

  function resetLoginButton() {
    loginButton.disabled = false
    buttonText.classList.remove("hidden")
    loadingSpinner.classList.add("hidden")
  }
}

// Recipes Page Logic
async function initRecipesPage() {
  const userName = document.getElementById("userName")
  const logoutButton = document.getElementById("logoutButton")
  const searchInput = document.getElementById("searchInput")
  const cuisineFilter = document.getElementById("cuisineFilter")
  const showMoreButton = document.getElementById("showMoreButton")

  // Display user name
  const firstName = localStorage.getItem("firstName")
  if (userName) {
    userName.textContent = `Welcome, ${firstName}!`
  }

  // Logout functionality
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("firstName")
      window.location.href = "index.html"
    })
  }

  // Load recipes
  await loadRecipes()

  // Search with debouncing
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        handleSearch(e.target.value)
      }, 300) // 300ms debounce
    })
  }

  // Cuisine filter
  if (cuisineFilter) {
    cuisineFilter.addEventListener("change", (e) => {
      handleCuisineFilter(e.target.value)
    })
  }

  // Show more button
  if (showMoreButton) {
    showMoreButton.addEventListener("click", () => {
      displayedRecipes += recipesPerPage
      renderRecipes()
    })
  }
}

async function loadRecipes() {
  const loadingState = document.getElementById("loadingState")
  const errorState = document.getElementById("errorState")
  const recipesGrid = document.getElementById("recipesGrid")

  loadingState.classList.remove("hidden")
  errorState.classList.add("hidden")
  recipesGrid.innerHTML = ""

  try {
    const response = await fetch("dummyrecipes.txt")

    if (!response.ok) {
      throw new Error("Failed to fetch recipes")
    }

    const data = await response.json()
    allRecipes = data.recipes
    filteredRecipes = [...allRecipes]

    // Populate cuisine filter
    populateCuisineFilter()

    // Initial render
    displayedRecipes = recipesPerPage
    renderRecipes()

    loadingState.classList.add("hidden")
  } catch (error) {
    console.error("[v0] Error loading recipes:", error)
    loadingState.classList.add("hidden")
    errorState.classList.remove("hidden")
  }
}

function populateCuisineFilter() {
  const cuisineFilter = document.getElementById("cuisineFilter")
  const cuisines = [...new Set(allRecipes.map((recipe) => recipe.cuisine))].sort()

  cuisines.forEach((cuisine) => {
    const option = document.createElement("option")
    option.value = cuisine
    option.textContent = cuisine
    cuisineFilter.appendChild(option)
  })
}

function handleSearch(searchTerm) {
  const term = searchTerm.toLowerCase().trim()

  if (!term) {
    filteredRecipes = [...allRecipes]
  } else {
    filteredRecipes = allRecipes.filter((recipe) => {
      // Search in name
      if (recipe.name.toLowerCase().includes(term)) return true

      // Search in cuisine
      if (recipe.cuisine.toLowerCase().includes(term)) return true

      // Search in ingredients
      if (recipe.ingredients.some((ing) => ing.toLowerCase().includes(term))) return true

      // Search in tags
      if (recipe.tags.some((tag) => tag.toLowerCase().includes(term))) return true

      return false
    })
  }

  // Apply cuisine filter if active
  const cuisineFilter = document.getElementById("cuisineFilter")
  if (cuisineFilter.value) {
    filteredRecipes = filteredRecipes.filter((recipe) => recipe.cuisine === cuisineFilter.value)
  }

  displayedRecipes = recipesPerPage
  renderRecipes()
}

function handleCuisineFilter(cuisine) {
  const searchInput = document.getElementById("searchInput")
  const searchTerm = searchInput.value.toLowerCase().trim()

  if (!cuisine) {
    filteredRecipes = [...allRecipes]
  } else {
    filteredRecipes = allRecipes.filter((recipe) => recipe.cuisine === cuisine)
  }

  // Apply search filter if active
  if (searchTerm) {
    filteredRecipes = filteredRecipes.filter((recipe) => {
      if (recipe.name.toLowerCase().includes(searchTerm)) return true
      if (recipe.cuisine.toLowerCase().includes(searchTerm)) return true
      if (recipe.ingredients.some((ing) => ing.toLowerCase().includes(searchTerm))) return true
      if (recipe.tags.some((tag) => tag.toLowerCase().includes(searchTerm))) return true
      return false
    })
  }

  displayedRecipes = recipesPerPage
  renderRecipes()
}

function renderRecipes() {
  const recipesGrid = document.getElementById("recipesGrid")
  const showMoreContainer = document.getElementById("showMoreContainer")

  recipesGrid.innerHTML = ""

  if (filteredRecipes.length === 0) {
    recipesGrid.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No recipes found. Try a different search term.</p>'
    showMoreContainer.classList.add("hidden")
    return
  }

  const recipesToShow = filteredRecipes.slice(0, displayedRecipes)

  recipesToShow.forEach((recipe) => {
    const card = createRecipeCard(recipe)
    recipesGrid.appendChild(card)
  })

  // Show/hide "Show More" button
  if (displayedRecipes < filteredRecipes.length) {
    showMoreContainer.classList.remove("hidden")
  } else {
    showMoreContainer.classList.add("hidden")
  }
}

function createRecipeCard(recipe) {
  const card = document.createElement("div")
  card.className = "recipe-card"

  const stars = generateStars(recipe.rating)
  const ingredients = recipe.ingredients.slice(0, 3).join(", ") + (recipe.ingredients.length > 3 ? "..." : "")

  card.innerHTML = `
        <img src="${recipe.image}" alt="${recipe.name}" class="recipe-image" onerror="this.src='https://via.placeholder.com/300x200?text=Recipe+Image'">
        <div class="recipe-content">
            <div class="recipe-header">
                <h3 class="recipe-name">${recipe.name}</h3>
                <span class="recipe-cuisine">${recipe.cuisine}</span>
            </div>
            <div class="recipe-meta">
                <span class="meta-item">⏱️ ${recipe.cookTimeMinutes} min</span>
                <span class="meta-item">👨‍🍳 ${recipe.difficulty}</span>
                <span class="meta-item">🍽️ ${recipe.servings} servings</span>
            </div>
            <div class="recipe-rating">
                <span class="stars">${stars}</span>
                <span class="rating-text">${recipe.rating} (${recipe.reviewCount} reviews)</span>
            </div>
            <div class="recipe-ingredients">
                <h4>Key Ingredients:</h4>
                <p class="ingredients-list">${ingredients}</p>
            </div>
            <div class="recipe-footer">
                <button class="btn-view-recipe" onclick="showRecipeDetail(${recipe.id})">
                    View Full Recipe
                </button>
            </div>
        </div>
    `

  return card
}

function generateStars(rating) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  let stars = ""

  for (let i = 0; i < fullStars; i++) {
    stars += "★"
  }

  if (hasHalfStar) {
    stars += "☆"
  }

  const emptyStars = 5 - Math.ceil(rating)
  for (let i = 0; i < emptyStars; i++) {
    stars += "☆"
  }

  return stars
}

function showRecipeDetail(recipeId) {
  const recipe = allRecipes.find((r) => r.id === recipeId)
  if (!recipe) return

  const modal = document.getElementById("recipeModal")
  const recipeDetail = document.getElementById("recipeDetail")

  const stars = generateStars(recipe.rating)

  recipeDetail.innerHTML = `
        <div class="recipe-detail-header">
            <img src="${recipe.image}" alt="${recipe.name}" class="recipe-detail-image" onerror="this.src='https://via.placeholder.com/800x300?text=Recipe+Image'">
            <h2 class="recipe-detail-title">${recipe.name}</h2>
            <div class="recipe-detail-meta">
                <div class="detail-meta-item">
                    <span class="detail-meta-label">Prep Time</span>
                    <span class="detail-meta-value">${recipe.prepTimeMinutes} min</span>
                </div>
                <div class="detail-meta-item">
                    <span class="detail-meta-label">Cook Time</span>
                    <span class="detail-meta-value">${recipe.cookTimeMinutes} min</span>
                </div>
                <div class="detail-meta-item">
                    <span class="detail-meta-label">Servings</span>
                    <span class="detail-meta-value">${recipe.servings}</span>
                </div>
                <div class="detail-meta-item">
                    <span class="detail-meta-label">Difficulty</span>
                    <span class="detail-meta-value">${recipe.difficulty}</span>
                </div>
                <div class="detail-meta-item">
                    <span class="detail-meta-label">Cuisine</span>
                    <span class="detail-meta-value">${recipe.cuisine}</span>
                </div>
                <div class="detail-meta-item">
                    <span class="detail-meta-label">Calories</span>
                    <span class="detail-meta-value">${recipe.caloriesPerServing}</span>
                </div>
            </div>
            <div class="recipe-rating">
                <span class="stars">${stars}</span>
                <span class="rating-text">${recipe.rating} out of 5 (${recipe.reviewCount} reviews)</span>
            </div>
        </div>
        
        <div class="recipe-detail-section">
            <h3>Ingredients</h3>
            <ul class="detail-ingredients-list">
                ${recipe.ingredients.map((ing) => `<li>${ing}</li>`).join("")}
            </ul>
        </div>
        
        <div class="recipe-detail-section">
            <h3>Instructions</h3>
            <ol class="detail-instructions-list">
                ${recipe.instructions.map((inst) => `<li>${inst}</li>`).join("")}
            </ol>
        </div>
        
        <div class="recipe-detail-section">
            <h3>Tags</h3>
            <div class="recipe-tags">
                ${recipe.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
            </div>
        </div>
    `

  modal.classList.remove("hidden")
  document.body.style.overflow = "hidden"
}

// Close modal functionality
if (window.location.pathname.includes("recipes.html")) {
  const closeModal = document.getElementById("closeModal")
  const modal = document.getElementById("recipeModal")
  const modalOverlay = modal?.querySelector(".modal-overlay")

  if (closeModal) {
    closeModal.addEventListener("click", () => {
      modal.classList.add("hidden")
      document.body.style.overflow = "auto"
    })
  }

  if (modalOverlay) {
    modalOverlay.addEventListener("click", () => {
      modal.classList.add("hidden")
      document.body.style.overflow = "auto"
    })
  }
}
