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

// ADD THIS NEW TEST ENDPOINT HERE (starting around line 50)
router.get('/test-auth', async (req, res) => {
    try {
        // Test 1: Can we authenticate?
        const me = await notion.users.me();
        
        // Test 2: Can we list users?
        const users = await notion.users.list();
        
        // Test 3: Can we retrieve the specific database?
        let dbTest = { success: false };
        try {
            const db = await notion.databases.retrieve({
                database_id: '25216c6cc64080bc8599c30200dd1f77'
            });
            dbTest = {
                success: true,
                title: db.title[0]?.plain_text || 'No title'
            };
        } catch (dbError) {
            dbTest = {
                success: false,
                error: dbError.message,
                code: dbError.code
            };
        }
        
        res.json({ 
            auth: {
                success: true,
                workspace: me.bot?.workspace_name || 'Unknown',
                type: me.type
            },
            users: {
                count: users.results.length
            },
            database: dbTest
        });
    } catch (error) {
        res.json({ 
            auth: {
                success: false,
                error: error.message,
                code: error.code
            }
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
        
        const response = await notion.pages.create({
            parent: { database_id: MEAL_PLANS_DB },
            properties: {
                'Week Name': {
                    title: [{ text: { content: `Week of ${weekStart}` } }]
                },
                'Week Start': { 
                    date: { start: weekStart } 
                },
                'Status': { 
                    select: { name: 'Planning' } 
                },
                'Total Cost': { 
                    number: totalCost || 0
                },
                'Meals': { 
                    rich_text: [{ text: { content: JSON.stringify(meals) } }] 
                }
            }
        });
        
        res.json({ 
            success: true, 
            mealPlanId: response.id,
            message: 'Meal plan saved successfully!'
        });
    } catch (error) {
        console.error('Error saving meal plan:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
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
                'List Name': {
                    title: [{ text: { content: `Groceries - ${weekStart}` } }]
                },
                'Estimated Total': { number: 185 },
                'Status': { select: { name: 'Ready' } }
            }
        });
        
        res.json({
            success: true,
            groceryListId: response.id,
            items: groceryList,
            estimatedTotal: 185
        });
    } catch (error) {
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
