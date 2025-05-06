// Recipe data
const recipes = [
    {
        id: 1,
        title: "Penne alla Vodka",
        description: "Creamy, flavorful pasta with a touch of vodka",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/penne-alla-vodka.jpg",
        ingredients: [
            "454g penne pasta",
            "1/4 cup parmesan",
            "690ml passatta",
            "1 tbsp italian seasoning",
            "Half a pack of bacon, chopped",
            "1 tsp black pepper",
            "1 tsp pepper flakes",
            "3/4 cup heavy cream",
            "4 garlic cloves, diced",
            "3 small yellow onions, diced",
            "1/4 cup vodka"
        ],
        instructions: [
            "Cook penne pasta according to package instructions",
            "In a large pan, cook the chopped bacon until crispy",
            "Add diced onions and garlic, sauté until fragrant",
            "Pour in vodka and let it reduce for 2 minutes",
            "Add passatta and italian seasoning, simmer for 10 minutes",
            "Stir in heavy cream and parmesan",
            "Add black pepper and pepper flakes",
            "Combine with cooked pasta and serve hot"
        ]
    },
    {
        id: 2,
        title: "Turkey Pesto Sandwich",
        description: "A fresh and flavorful sandwich with pesto and turkey",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/turkey-pesto.jpg",
        ingredients: [
            "Ciabatta buns",
            "Pesto",
            "Mozzarella cheese",
            "Tomato slices",
            "Italian seasoning",
            "Salt",
            "Pepper",
            "Turkey slices",
            "Spinach"
        ],
        instructions: [
            "Slice the ciabatta buns in half",
            "Spread pesto on both sides of the bun",
            "Layer turkey slices on the bottom half",
            "Add tomato slices and season with salt and pepper",
            "Place mozzarella cheese on top of the tomatoes",
            "Add a generous handful of fresh spinach",
            "Sprinkle with italian seasoning",
            "Close the sandwich and enjoy!"
        ]
    },
    {
        id: 3,
        title: "BBQ Chicken Pizza",
        description: "Homemade pizza with BBQ chicken and fresh toppings",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/bbq-chicken-pizza.jpg",
        ingredients: [
            "For the dough:",
            "2 cups water",
            "1 pack active dry yeast",
            "1 tsp sugar",
            "5-6 cups flour",
            "2 tsp salt",
            "2 tbsp olive oil",
            "",
            "For the toppings:",
            "Low moisture mozzarella",
            "1/4 red onion",
            "1/4 green pepper",
            "1 chicken breast",
            "2 tbsp bbq sauce",
            "1 tsp sriracha",
            "",
            "For the tomato sauce:",
            "1 can passatta (700ml)",
            "3-4 garlic cloves",
            "1 handful chopped basil",
            "1 tsp oregano",
            "1 tsp salt",
            "1/2 tsp pepper",
            "1/2 tsp red pepper flakes",
            "1 tsp italian seasoning"
        ],
        instructions: [
            "For the dough:",
            "Mix water, yeast, and sugar. Let bloom for 5-10 minutes",
            "In a large bowl, combine flour and salt",
            "Add olive oil and bloomed yeast mixture",
            "Knead until smooth, let rise for 1 hour",
            "For the sauce:",
            "Sauté garlic until fragrant",
            "Add passatta and all seasonings",
            "Simmer for 20-30 minutes",
            "Assembly:",
            "Roll out dough and pre-bake for 5 minutes",
            "Spread tomato sauce on the base",
            "Add mozzarella cheese",
            "Top with sliced chicken, onions, and peppers",
            "Drizzle with BBQ sauce and sriracha",
            "Bake at 450°F (230°C) for 12-15 minutes"
        ]
    },
    {
        id: 4,
        title: "Buffalo Chicken Quesadilla",
        description: "Spicy and cheesy quesadillas with buffalo chicken",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/buffalo-quesadilla.jpg",
        ingredients: [
            "For 2 quesadillas:",
            "80g grated mozzarella",
            "1 diced jalapeno",
            "1 chicken breast",
            "2 medium tortillas",
            "1 tbsp cream cheese",
            "1-2 tbsp sour cream",
            "3-4 tbsp Frank's Red Hot",
            "Salt and pepper to taste"
        ],
        instructions: [
            "Cook and dice the chicken breast",
            "Mix the diced chicken with Frank's Red Hot sauce",
            "Spread cream cheese on one side of each tortilla",
            "Layer half the mozzarella on each tortilla",
            "Add the buffalo chicken mixture",
            "Sprinkle with diced jalapeno",
            "Add remaining mozzarella",
            "Fold tortillas in half",
            "Cook in a pan until golden and crispy on both sides",
            "Serve with sour cream for dipping"
        ]
    },
    {
        id: 5,
        title: "Ragu with Pappardelle",
        description: "Classic Italian beef ragu with wide pasta ribbons",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/beef-ragu.jpg",
        ingredients: [
            "1 large onion, diced",
            "1 celery stalk, cut into 3-4 wedges",
            "3-4 carrots, diced",
            "1 can tomato paste",
            "1 and 1/2 cup beef stock",
            "1.2lbs beef shank",
            "660ml passatta",
            "Butter for finishing",
            "Parmesan for garnish",
            "Pappardelle pasta",
            "Seasonings of choice (salt, pepper, herbs)"
        ],
        instructions: [
            "In a large pot, sauté the onion until translucent",
            "Add celery wedges and carrots, cook until softened",
            "Make a well in the center and add tomato paste",
            "Fry the tomato paste for 2-3 minutes before stirring into vegetables",
            "Add beef stock and stir well",
            "Add beef shank and passatta",
            "Season to taste with your choice of seasonings",
            "Simmer for 2-4 hours, stirring occasionally",
            "Finish by stirring in butter until melted",
            "Cook pappardelle according to package instructions",
            "Serve ragu over pappardelle",
            "Garnish with freshly grated parmesan"
        ]
    },
    {
        id: 6,
        title: "Rosé Pasta with Bacon",
        description: "Creamy tomato pasta with crispy bacon",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/rose-pasta.jpg",
        ingredients: [
            "500g tubetti pasta",
            "1 medium yellow onion, diced",
            "1 package of bacon (roughly 12 slices), chopped",
            "5 garlic cloves, minced",
            "1/4 cup parmesan",
            "2 cups tomato puree / sauce",
            "150ml cream"
        ],
        instructions: [
            "Cook tubetti pasta according to package instructions",
            "In a large pan, cook the chopped bacon until crispy",
            "Remove bacon and set aside, leaving the fat in the pan",
            "Sauté diced onion in the bacon fat until translucent",
            "Add minced garlic and cook until fragrant",
            "Pour in tomato puree and simmer for 5 minutes",
            "Stir in cream and let it simmer for 2-3 minutes",
            "Add cooked pasta and toss to coat",
            "Stir in parmesan cheese",
            "Top with crispy bacon and serve hot"
        ]
    },
    {
        id: 7,
        title: "Easy 4 Ingredient Pasta",
        description: "Simple and delicious pasta with cherry tomatoes and basil",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/easy-pasta.jpg",
        ingredients: [
            "Per portion:",
            "1 pint of cherry tomatoes",
            "A generous handful of basil (fresh preferred, dried works too)",
            "1/4 cup parmesan",
            "4 cloves of garlic",
            "170g spaghettini",
            "Salt and pepper to taste",
            "Olive oil for cooking"
        ],
        instructions: [
            "Boil pasta in salted water according to package directions",
            "Add olive oil to a pan and fry garlic until fragrant",
            "Add whole cherry tomatoes and let them blister",
            "When tomatoes are soft enough to easily mash, thoroughly mash or blend them into a sauce",
            "Add basil, cooked pasta, and a splash of pasta water",
            "Stir in half of the parmesan",
            "Toss everything to combine",
            "Plate and garnish with remaining parmesan"
        ]
    },
    {
        id: 8,
        title: "Pesto and Sundried Tomato Pasta",
        description: "A Barcelona-inspired pasta dish with pesto and sundried tomatoes",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/pesto-tomato-pasta.jpg",
        ingredients: [
            "1 lb pasta of choice",
            "6-7 sundried tomatoes in oil",
            "1 yellow onion, diced",
            "5 large garlic cloves, minced",
            "2 chicken breasts, sliced",
            "3-4 tbsp pesto",
            "1 small bunch basil",
            "1/2 cup cream",
            "1 can tomato paste",
            "Italian seasoning, to taste",
            "Oregano, to taste",
            "Pepper flakes, to taste",
            "Parmesan cheese, to taste"
        ],
        instructions: [
            "Cook pasta according to package instructions",
            "In a large pan, sauté diced onion until translucent",
            "Add minced garlic and cook until fragrant",
            "Add sliced chicken breasts and cook until golden",
            "Stir in tomato paste and cook for 2-3 minutes",
            "Add sundried tomatoes and their oil",
            "Pour in cream and stir well",
            "Add pesto and mix until combined",
            "Season with italian seasoning, oregano, and pepper flakes",
            "Add cooked pasta and toss to coat",
            "Garnish with fresh basil and parmesan cheese",
            "Serve hot and enjoy this Barcelona-inspired dish!"
        ]
    },
    {
        id: 9,
        title: "Easy Spanish Rice",
        description: "Flavorful basmati rice with fresh vegetables and spices",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/spanish-rice.jpg",
        ingredients: [
            "For the vegetables:",
            "1 red onion, diced",
            "1 jalapeno, diced",
            "5 garlic cloves, diced",
            "1 tomato, diced",
            "2 tbsp olive oil",
            "",
            "For the rice:",
            "2 and 1/2 cups basmati rice",
            "2 cups tomato sauce/puree",
            "3 cups chicken stock",
            "",
            "Seasonings:",
            "Oregano, to taste",
            "Cumin, to taste",
            "Chili powder, to taste",
            "Cajun seasoning, to taste",
            "Salt, to taste"
        ],
        instructions: [
            "Heat olive oil in a large pot over medium heat",
            "Sauté diced red onion until translucent",
            "Add diced jalapeno and cook for 2 minutes",
            "Add diced garlic and cook until fragrant",
            "Stir in diced tomato and cook for 2-3 minutes",
            "Add basmati rice and stir to coat with oil",
            "Pour in tomato sauce/puree and chicken stock",
            "Season with oregano, cumin, chili powder, cajun, and salt",
            "Bring to a boil, then reduce heat to low",
            "Cover and simmer for 15-20 minutes until rice is cooked",
            "Fluff rice with a fork and serve hot"
        ]
    },
    {
        id: 10,
        title: "Seared Chicken with Mushroom Pan Sauce",
        description: "Elegant chicken dish with creamy mushroom sauce and sides",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/chicken-mushroom.jpg",
        ingredients: [
            "For the main dish:",
            "2 chicken breasts, seasoned",
            "10-15 medium cremini mushrooms, sliced",
            "Half a large white onion, diced",
            "8 medium-small garlic cloves, minced",
            "Small handful of parsley, chopped",
            "",
            "For the sauce:",
            "1 cup chicken stock",
            "1 cup heavy cream",
            "1-2 tbsp fresh grated parmesan",
            "",
            "For the sides:",
            "7-12 fingerling potatoes",
            "10-12 asparagus spears",
            "",
            "Seasonings to taste"
        ],
        instructions: [
            "Season chicken breasts with salt and pepper",
            "In a large pan, sear chicken breasts until golden on both sides",
            "Remove chicken and set aside",
            "In the same pan, sauté diced onion until translucent",
            "Add sliced mushrooms and cook until golden",
            "Add minced garlic and cook until fragrant",
            "Pour in chicken stock and scrape up any browned bits",
            "Add heavy cream and simmer until sauce thickens",
            "Stir in parmesan cheese",
            "Return chicken to the pan and simmer until cooked through",
            "Meanwhile, roast fingerling potatoes until crispy",
            "Steam or roast asparagus until tender-crisp",
            "Garnish with chopped parsley and serve hot"
        ]
    },
    {
        id: 11,
        title: "Creamy Mushroom Fettuccine",
        description: "Rich and creamy pasta with mushrooms and chicken",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/mushroom-fettuccine.jpg",
        ingredients: [
            "227g mushrooms, sliced",
            "250ml heavy cream",
            "6 garlic cloves, minced",
            "1 chicken breast, sliced",
            "1 tbsp butter",
            "2 tbsp parmesan",
            "1 cup spinach",
            "Fettuccine pasta",
            "Salt and pepper to taste"
        ],
        instructions: [
            "Cook fettuccine according to package instructions",
            "In a large pan, melt butter over medium heat",
            "Add sliced chicken and cook until golden",
            "Add sliced mushrooms and cook until they release their moisture",
            "Add minced garlic and cook until fragrant",
            "Pour in heavy cream and simmer until slightly thickened",
            "Add spinach and stir until wilted",
            "Stir in parmesan cheese",
            "Add cooked pasta and toss to coat",
            "Season with salt and pepper to taste",
            "Serve hot with extra parmesan if desired"
        ]
    },
    {
        id: 12,
        title: "Sushi Style Salmon and Rice",
        description: "Air-fried salmon with seasoned sushi rice",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/sushi-salmon.jpg",
        ingredients: [
            "For the salmon:",
            "2 tsp sugar",
            "1 tsp sesame oil",
            "2 tbsp sriracha",
            "1 tbsp soy sauce",
            "Salmon fillet",
            "",
            "For the rice:",
            "Sushi rice, cooked",
            "1 tbsp soy sauce",
            "1/2 tsp sesame oil",
            "1-2 tbsp sriracha",
            "2-3 tbsp kewpie mayo",
            "Wasabi to taste",
            "Furikake for garnish"
        ],
        instructions: [
            "For the salmon:",
            "Mix sugar, sesame oil, sriracha, and soy sauce in a bowl",
            "Coat salmon fillet with the mixture",
            "Place in air fryer and cook until desired doneness",
            "For the rice:",
            "Cook sushi rice according to package instructions",
            "Once cooked, mix in soy sauce and sesame oil",
            "Add sriracha and kewpie mayo, mix well",
            "Add wasabi to taste",
            "Assembly:",
            "Place seasoned rice in a bowl",
            "Top with air-fried salmon",
            "Garnish with furikake",
            "Serve immediately"
        ]
    },
    {
        id: 13,
        title: "Mashed Potato Au Gratin",
        description: "Creamy mashed potatoes topped with a cheesy gratin layer",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/mashed-gratin.jpg",
        ingredients: [
            "Total: 8 medium sized potatoes, peeled",
            "",
            "For the mashed potatoes:",
            "5 potatoes, boiled and mashed",
            "7 cloves of garlic, diced and cooked down in olive oil",
            "1 cup milk",
            "1 tbsp unsalted butter",
            "100g smoked gouda, shredded",
            "100g mozzarella, shredded",
            "1 tsp cayenne",
            "",
            "For the gratin topping:",
            "3 potatoes, thinly sliced with mandoline",
            "100g smoked gouda, shredded",
            "100g mozzarella, shredded",
            "2-3 tbsp parmesan cheese",
            "1-2 tbsp smoked paprika"
        ],
        instructions: [
            "For the mashed potatoes:",
            "Peel and boil 5 potatoes until tender",
            "While potatoes are cooking, sauté diced garlic in olive oil until fragrant",
            "Drain potatoes and mash until smooth",
            "Add milk, butter, and cooked garlic",
            "Stir in shredded smoked gouda and mozzarella",
            "Add cayenne and mix well",
            "For the gratin topping:",
            "Using a mandoline, thinly slice the remaining 3 potatoes",
            "Layer the sliced potatoes over the mashed potatoes",
            "Sprinkle with shredded smoked gouda and mozzarella",
            "Top with parmesan cheese",
            "Dust with smoked paprika",
            "Baking:",
            "Bake in a preheated oven at 375°F (190°C)",
            "Cook until the top is golden and crispy",
            "Let rest for 5 minutes before serving"
        ]
    },
    {
        id: 14,
        title: "Lasagna Bolognese with Bechamel",
        description: "Classic lasagna with homemade noodles and rich bolognese sauce",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/lasagna-bolognese.jpg",
        ingredients: [
            "For the fresh lasagna noodles:",
            "2 cups flour",
            "4 eggs",
            "Water as needed",
            "",
            "For the bolognese sauce:",
            "4 small onions, diced",
            "7 medium-large cremini mushrooms, diced",
            "200g carrots, diced",
            "5-6 mini tomatoes, diced",
            "6 cloves garlic, diced",
            "200g mozzarella cheese, grated",
            "Handful of basil, chiffonade",
            "Handful of parsley, diced",
            "1/4 cup red wine",
            "1 can tomato paste",
            "690ml tomato passata",
            "",
            "For the bechamel sauce:",
            "2 tbsp butter",
            "2 tbsp flour",
            "2 cups milk",
            "Salt and nutmeg to taste"
        ],
        instructions: [
            "For the fresh lasagna noodles:",
            "Mix flour and eggs in a bowl",
            "Add water as needed to form a smooth dough",
            "Knead until elastic, about 10 minutes",
            "Let rest for 30 minutes",
            "Roll out thinly and cut into lasagna sheets",
            "For the bolognese sauce:",
            "Sauté diced onions until translucent",
            "Add diced mushrooms and carrots, cook until softened",
            "Add diced tomatoes and garlic, cook until fragrant",
            "Pour in red wine and let it reduce",
            "Add tomato paste and passata",
            "Simmer for 1-2 hours, stirring occasionally",
            "Add fresh herbs towards the end of cooking",
            "For the bechamel sauce:",
            "Melt butter in a pan",
            "Add flour and cook for 1-2 minutes",
            "Gradually whisk in milk",
            "Cook until thickened",
            "Season with salt and nutmeg",
            "Assembly:",
            "Layer lasagna sheets, bolognese sauce, and bechamel",
            "Top with grated mozzarella",
            "Bake at 375°F (190°C) for 30-40 minutes",
            "Let rest for 10 minutes before serving"
        ]
    },
    {
        id: 15,
        title: "Sausage and Tortellini Soup",
        description: "Creamy and hearty soup with Italian sausage and cheese tortellini",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/sausage-tortellini-soup.jpg",
        ingredients: [
            "6 cups water/stock",
            "500g Italian sausage",
            "1 cup heavy cream",
            "1/4 cup parmesan",
            "1/4 cup flour",
            "1 chicken bouillon cube",
            "1 tbsp Italian seasoning",
            "1 tsp red chili flakes",
            "400g carrots (canned or fresh)",
            "1 medium onion, diced (yellow preferred)",
            "3-5 garlic cloves, minced",
            "1 can tomato paste",
            "Cheese tortellini",
            "Parmesan and parsley for garnish"
        ],
        instructions: [
            "In a large pot, brown the Italian sausage until cooked through",
            "Remove sausage and set aside, leaving the fat in the pot",
            "Sauté diced onion until translucent",
            "Add minced garlic and cook until fragrant",
            "Add carrots and cook for 2-3 minutes",
            "Stir in flour and cook for 1 minute",
            "Add water/stock and chicken bouillon cube",
            "Add Italian seasoning and red chili flakes",
            "Stir in tomato paste and bring to a simmer",
            "Add heavy cream and parmesan",
            "Return sausage to the pot",
            "Add tortellini and cook according to package instructions",
            "Garnish with additional parmesan and fresh parsley",
            "Serve hot"
        ]
    },
    {
        id: 16,
        title: "Spicy Garlic Shrimp",
        description: "Quick and flavorful shrimp dish with a spicy garlic sauce",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/spicy-shrimp.jpg",
        ingredients: [
            "150g frozen shrimp",
            "1 tsp sriracha",
            "1 tbsp soy sauce",
            "1 tbsp oyster sauce",
            "1 tsp chili powder",
            "1 tsp black pepper",
            "1 medium red onion, diced",
            "Small handful of chopped cilantro",
            "Furikake for garnish",
            "5 garlic cloves, minced",
            "2-3 Thai chilis, sliced",
            "",
            "Optional for sweeter sauce:",
            "2-3 tbsp ketchup",
            "Water as needed"
        ],
        instructions: [
            "Thaw and pat dry the shrimp",
            "In a bowl, mix sriracha, soy sauce, oyster sauce, chili powder, and black pepper",
            "Heat oil in a pan over medium-high heat",
            "Add minced garlic and Thai chilis, cook until fragrant",
            "Add diced red onion and cook until softened",
            "Add shrimp and cook until pink and opaque",
            "Pour in the sauce mixture and stir well",
            "Optional: Add ketchup and water for a sweeter sauce",
            "Cook until sauce thickens slightly",
            "Garnish with chopped cilantro and furikake",
            "Serve hot over rice or noodles"
        ]
    },
    {
        id: 17,
        title: "Carbonara with Garlic",
        description: "Classic carbonara with a garlic twist, using egg yolks for extra creaminess",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/carbonara-garlic.jpg",
        ingredients: [
            "200-300g spaghettini",
            "2-3 egg yolks",
            "Half a pack of bacon (guanciale is traditional)",
            "3 cloves garlic, finely diced",
            "1/4 cup parmesan",
            "1-2 tsp black pepper",
            "1/2 tsp red pepper flakes",
            "1 cup pasta water"
        ],
        instructions: [
            "Cook spaghettini in salted water according to package instructions",
            "Reserve 1 cup of pasta water before draining",
            "In a large pan, cook bacon until crispy",
            "Remove bacon and set aside, leaving the fat in the pan",
            "Add diced garlic to the bacon fat and cook until fragrant",
            "In a bowl, whisk together egg yolks, parmesan, black pepper, and red pepper flakes",
            "Add hot pasta to the pan with garlic and bacon fat",
            "Remove pan from heat and quickly stir in the egg mixture",
            "Add pasta water gradually while stirring to create a creamy sauce",
            "Crumble bacon and stir into the pasta",
            "Serve immediately with extra parmesan and black pepper if desired"
        ]
    },
    {
        id: 18,
        title: "Creamy Chicken with Spinach",
        description: "A comforting and flavorful dish that got me through a year of university. Inspired by @Jalalsamfit",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/creamy-chicken-spinach.jpg",
        ingredients: [
            "For the sauce:",
            "1/2 block of cream cheese",
            "1 cup cream (1 and 1/2 cups if using milk)",
            "1/2 to 1 cup water or stock (add as needed)",
            "1 cup spinach (fresh is better)",
            "1 tsp smoked paprika",
            "1 tsp Italian seasoning",
            "1 tsp onion powder",
            "1 tsp garlic powder",
            "1 tsp red pepper flakes",
            "1 tsp oregano",
            "1/4 cup parmesan cheese",
            "1 tsp pepper",
            "Salt to taste",
            "",
            "For the marinade:",
            "4 medium-large chicken thighs",
            "1 small bunch of parsley",
            "2 tbsp olive oil",
            "2 tbsp lemon juice",
            "1 tbsp pesto",
            "1 tsp onion powder",
            "1 tsp garlic powder",
            "2 tsp Italian seasoning",
            "1 tsp oregano",
            "1/2 tsp chili powder",
            "2 tsp smoked paprika",
            "1 tsp red pepper flakes"
        ],
        instructions: [
            "For the marinade:",
            "Mix all marinade ingredients in a bowl",
            "Coat chicken thighs with the marinade",
            "Let marinate for at least 30 minutes, preferably overnight",
            "For the sauce:",
            "In a large pan, cook marinated chicken thighs until golden and cooked through",
            "Remove chicken and set aside",
            "In the same pan, add cream cheese and let it melt",
            "Pour in cream (or milk) and stir until smooth",
            "Add water or stock as needed to reach desired consistency",
            "Add all seasonings and stir well",
            "Add spinach and let it wilt",
            "Stir in parmesan cheese",
            "Return chicken to the pan",
            "Simmer until sauce thickens slightly",
            "Season with salt and pepper to taste",
            "Serve hot over rice or pasta"
        ]
    },
    {
        id: 19,
        title: "Sesame Chicken",
        description: "Crispy fried chicken in a sweet and savory sesame sauce. Inspired by @khinskitchen",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/sesame-chicken.jpg",
        ingredients: [
            "For the chicken:",
            "6 chicken thighs",
            "1 cup corn starch",
            "2 tbsp toasted sesame seeds",
            "3 scallions, chopped",
            "1 egg",
            "",
            "For the marinade:",
            "1 tsp sesame oil",
            "1-2 tbsp soy sauce",
            "1 tsp garlic powder",
            "1 tsp onion powder",
            "1 tsp baking powder",
            "1 tsp sugar",
            "1/2 tsp black pepper",
            "",
            "For the sauce:",
            "2 tbsp honey",
            "1 tbsp sugar",
            "2 tbsp ketchup",
            "1 tbsp sesame oil",
            "1 tbsp rice wine vinegar",
            "2 tbsp water"
        ],
        instructions: [
            "For the marinade:",
            "Mix all marinade ingredients in a bowl",
            "Cut chicken thighs into bite-sized pieces",
            "Coat chicken with marinade and let sit for 30 minutes",
            "For the coating:",
            "Beat egg in a separate bowl",
            "Place corn starch in another bowl",
            "Dip marinated chicken in egg, then coat with corn starch",
            "Cooking:",
            "Heat oil in a pan or deep fryer",
            "Fry chicken pieces until golden and crispy",
            "Remove and drain on paper towels",
            "For the sauce:",
            "Mix all sauce ingredients in a bowl",
            "In a clean pan, heat the sauce until it thickens slightly",
            "Add fried chicken and toss to coat",
            "Garnish with toasted sesame seeds and chopped scallions",
            "Serve hot over rice"
        ]
    },
    {
        id: 20,
        title: "Cilantro Lime Noodles",
        description: "Quick and flavorful noodles with a bright cilantro-lime sauce",
        videoUrl: "https://www.tiktok.com/@adamcamilleri/video/1234567890",
        thumbnail: "../../images/cilantro-lime-noodles.jpg",
        ingredients: [
            "1/2 cup cilantro, chopped",
            "3 cloves garlic, minced",
            "1 small red onion, diced",
            "1 tbsp sugar",
            "1 tsp turmeric",
            "1 tsp chili powder",
            "1/4 cup vegetable or olive oil",
            "1 tbsp oyster sauce",
            "2 tsp soy sauce",
            "126g ramen noodles (wide noodles preferred)",
            "Lime juice to taste",
            "Salt to taste"
        ],
        instructions: [
            "Cook noodles according to package instructions",
            "In a food processor or blender, combine cilantro, garlic, and a splash of oil",
            "Blend until smooth to create a cilantro paste",
            "Heat remaining oil in a large pan over medium heat",
            "Sauté diced red onion until softened",
            "Add the cilantro paste and cook for 1-2 minutes",
            "Add sugar, turmeric, and chili powder, stir well",
            "Add oyster sauce and soy sauce",
            "Add cooked noodles and toss to coat",
            "Squeeze fresh lime juice over the noodles",
            "Season with salt if needed",
            "Serve hot with extra cilantro and lime wedges if desired"
        ]
    }
    // Add more recipes here
];

// DOM Elements
const recipeFeed = document.querySelector('.recipe-feed');
const recipeModal = document.getElementById('recipeModal');
const closeModal = document.querySelector('.close-modal');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// Initialize the app
function init() {
    renderRecipes();
    setupEventListeners();
    setupSearch();
}

// Render recipe cards
function renderRecipes() {
    recipeFeed.innerHTML = recipes.map(recipe => `
        <div class="recipe-card" data-id="${recipe.id}">
            <img src="${recipe.thumbnail}" alt="${recipe.title}" class="recipe-thumbnail">
            <div class="recipe-info">
                <h3 class="recipe-title">${recipe.title}</h3>
                <p class="recipe-description">${recipe.description}</p>
            </div>
        </div>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Recipe card clicks
    recipeFeed.addEventListener('click', (e) => {
        const recipeCard = e.target.closest('.recipe-card');
        if (recipeCard) {
            const recipeId = parseInt(recipeCard.dataset.id);
            showRecipeModal(recipeId);
        }
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        recipeModal.style.display = 'none';
    });

    // Close modal when clicking outside
    recipeModal.addEventListener('click', (e) => {
        if (e.target === recipeModal) {
            recipeModal.style.display = 'none';
        }
    });
}

// Show recipe modal
function showRecipeModal(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const modal = document.getElementById('recipeModal');
    const title = modal.querySelector('.recipe-title');
    const video = modal.querySelector('.recipe-video');
    const ingredientsList = modal.querySelector('.ingredients-list');
    const instructionsList = modal.querySelector('.instructions-list');

    // Update modal content
    title.textContent = recipe.title;
    
    // Show recipe thumbnail
    video.innerHTML = `
        <img src="${recipe.thumbnail}" alt="${recipe.title}" class="recipe-thumbnail-large">
    `;

    // Update ingredients
    ingredientsList.innerHTML = recipe.ingredients
        .map(ingredient => `<li>${ingredient}</li>`)
        .join('');

    // Update instructions
    instructionsList.innerHTML = recipe.instructions
        .map(instruction => `<li>${instruction}</li>`)
        .join('');

    // Show modal
    modal.style.display = 'block';
}

// Setup search functionality
function setupSearch() {
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim().toLowerCase();

        if (query.length < 2) {
            searchResults.classList.remove('active');
            return;
        }

        searchTimeout = setTimeout(() => {
            const results = recipes.filter(recipe => 
                recipe.title.toLowerCase().includes(query) ||
                recipe.description.toLowerCase().includes(query) ||
                recipe.ingredients.some(ingredient => 
                    ingredient.toLowerCase().includes(query)
                )
            );

            displaySearchResults(results);
        }, 300);
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
}

// Display search results
function displaySearchResults(results) {
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No recipes found</div>';
    } else {
        searchResults.innerHTML = results.map(recipe => `
            <div class="search-result-item" data-id="${recipe.id}">
                <img src="${recipe.thumbnail}" alt="${recipe.title}" class="search-result-thumbnail">
                <div class="search-result-info">
                    <div class="search-result-title">${recipe.title}</div>
                    <div class="search-result-description">${recipe.description}</div>
                </div>
            </div>
        `).join('');
    }
    searchResults.classList.add('active');

    // Add click handlers to search results
    searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const recipeId = parseInt(item.dataset.id);
            showRecipeModal(recipeId);
            searchResults.classList.remove('active');
            searchInput.value = '';
        });
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);