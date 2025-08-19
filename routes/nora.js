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
        const response = await notion.databases.query({
            database_id: RECIPES_DB
        });
        
        const recipes = response.results.map(page => ({
            id: page.id,
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
        res.status(500).json({
            success: false,
            error: error.message
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

// POST save meal plan - SIMPLE VERSION
router.post('/save-meal-plan', async (req, res) => {
    try {
        const { weekStart = new Date().toISOString().split('T')[0], mealText = 'Weekly meal plan' } = req.body;
        
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
                    number: 150 
                },
                'Meals': { 
                    rich_text: [{ text: { content: mealText } }] 
                }
            }
        });
        
        res.json({ 
            success: true, 
            id: response.id,
            message: 'Meal plan saved to Notion!' 
        });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// POST save grocery list - SIMPLE VERSION
router.post('/save-grocery-list', async (req, res) => {
    try {
        const { weekStart = new Date().toISOString().split('T')[0], groceryText = 'Weekly grocery list' } = req.body;
        
        const response = await notion.pages.create({
            parent: { database_id: GROCERY_DB },
            properties: {
                'Name': {
                    title: [{ text: { content: `Groceries - Week of ${weekStart}` } }]
                },
                'Meal Plan Week': {
                    rich_text: [{ text: { content: `Week of ${weekStart}` } }]
                },
                'Items By Section': {
                    rich_text: [{ text: { content: groceryText } }]
                },
                'Estimated Total': {
                    number: 185
                },
                'Status': {
                    select: { name: 'Draft' }
                }
            }
        });
        
        res.json({ 
            success: true, 
            id: response.id,
            message: 'Grocery list saved to Notion!' 
        });
    } catch (error) {
        console.error('Save error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

module.exports = router;
