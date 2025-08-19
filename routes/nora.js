const express = require('express');
const router = express.Router();
const { Client } = require('@notionhq/client');

// Initialize Notion client
const notion = new Client({
    auth: process.env.NOTION_TOKEN
});

// Database IDs from environment variables
const RECIPES_DB = process.env.RECIPES_DATABASE_ID;
const MEAL_PLANS_DB = process.env.MEAL_PLANS_DATABASE_ID;
const GROCERY_DB = process.env.GROCERY_DATABASE_ID;

// GET all recipes from Notion
router.get('/recipes', async (req, res) => {
    try {
        console.log('Fetching recipes from Notion...');
        
        const response = await notion.databases.query({
            database_id: '25216c6cc64080bc8599c30200dd1f77'  // Hardcode it first to test
        });
        
        console.log('Got response:', response.results.length, 'recipes');
        
        const recipes = response.results.map(page => ({
            id: page.id,
            // Use optional chaining for safety
            name: page.properties?.Recipe?.title?.[0]?.text?.content || 'Unnamed',
            category: page.properties?.Category?.select?.name || '',
            prepTime: page.properties?.['Prep Time']?.number || 0,
        }));
        
        res.json({
            success: true,
            count: recipes.length,
            recipes
        });
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code,
            status: error.status
        });
    }
});

// GET family preferences
router.get('/preferences', async (req, res) => {
    try {
        const preferences = {
            dietaryRestrictions: [],
            favoriteCuisines: ["Italian", "Mexican", "American", "Asian"],
            dislikedIngredients: ["mushrooms", "olives"],
            weeklyBudget: 200,
            healthGoals: ["balanced nutrition", "more vegetables"],
            familySize: 4
        };
        
        res.json({
            success: true,
            preferences
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// POST save meal plan
router.post('/meal-plan', async (req, res) => {
    try {
        const { weekStart, meals, totalCost, nutritionSummary } = req.body;
        
        // Format meals text properly
        let mealText = 'Meal plan to be determined';
        if (meals) {
            if (typeof meals === 'object') {
                // Format the meals object into readable text
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                mealText = days.map(day => {
                    if (meals[day]) {
                        return `${day} - B: ${meals[day].breakfast || 'TBD'}, L: ${meals[day].lunch || 'TBD'}, D: ${meals[day].dinner || 'TBD'}`;
                    }
                    return `${day} - TBD`;
                }).join(' | ');
            } else {
                mealText = String(meals);
            }
        }
        
        // Log what we received for debugging
        console.log('Received meal plan data:', { weekStart, meals, totalCost, nutritionSummary });
        
        const formattedDate = weekStart || new Date().toISOString().split('T')[0];
        
        const response = await notion.pages.create({
            parent: { database_id: MEAL_PLANS_DB },
            properties: {
                'Week Name': {
                    title: [{ 
                        text: { 
                            content: `Week of ${formattedDate}` 
                        } 
                    }]
                },
                'Week Start': { 
                    date: { 
                        start: formattedDate 
                    } 
                },
                'Status': { 
                    select: { 
                        name: 'Planning' 
                    } 
                },
                'Total Cost': { 
                    number: totalCost || 150 
                },
                'Meals': { 
                    rich_text: [{ 
                        text: { 
                            content: mealText
                        } 
                    }] 
                },
                'Nutrition Summary': {
                    rich_text: [{ 
                        text: { 
                            content: nutritionSummary || 'Balanced nutrition planned' 
                        } 
                    }]
                }
            }
        });
        
        res.json({ 
            success: true, 
            mealPlanId: response.id,
            message: 'Meal plan saved successfully!'
        });
    } catch (error) {
        console.error('Error saving meal plan - Full error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message,
            details: error
        });
    }
});

// POST generate grocery list
router.post('/grocery-list', async (req, res) => {
    try {
        const { weekStart } = req.body;
        
        // Simplified grocery list generation
        const groceryList = {
            produce: ["Lettuce", "Tomatoes", "Onions", "Peppers"],
            proteins: ["Chicken", "Beef", "Salmon", "Eggs"],
            dairy: ["Milk", "Cheese", "Yogurt"],
            pantry: ["Rice", "Pasta", "Oil", "Spices"]
        };
        
        const response = await notion.pages.create({
            parent: { database_id: GROCERY_DB },
            properties: {
                'Name': {  // Changed from 'List Name' to 'Name'
                    title: [{ text: { content: `Groceries - ${weekStart}` } }]
                },
                'Meal Plan Week': {  // Added this field
                    rich_text: [{ text: { content: `Week of ${weekStart}` } }]
                },
                'Items By Section': {  // Changed from 'Items'
                    rich_text: [{ text: { content: JSON.stringify(groceryList) } }]
                },
                'Estimated Total': { 
                    number: 185 
                },
                'Status': { 
                    select: { name: 'Draft' }  // Changed from 'Ready' to 'Draft'
                }
            }
        });
        
        res.json({
            success: true,
            groceryListId: response.id,
            items: groceryList,
            estimatedTotal: 185
        });
    } catch (error) {
        console.error('Error creating grocery list:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// POST coordinate with Clark
router.post('/coordinate-clark', async (req, res) => {
    try {
        const { groceryListId, preferredDelivery } = req.body;
        
        res.json({
            success: true,
            message: `Sent to Clark for ${preferredDelivery || 'Thursday'} delivery`,
            status: 'handed_off'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

module.exports = router;
