const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Test endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Clark API Server Running!',
    status: 'Ferrari engine ready 🏎️',
    agents: ['Clark', 'Nora', 'Oz', 'Sage'],
    timestamp: new Date().toISOString()
  });
});

// Clark's main endpoint
app.post('/clark/process', async (req, res) => {
  try {
    const { request, urgency = 'normal', context = '' } = req.body;
    
    // Get live data from Notion
    const familyData = await getFamilyData();
    
    // Process Clark's decision
    const response = await processClarkRequest(request, urgency, context, familyData);
    
    res.json(response);
  } catch (error) {
    console.error('Clark processing error:', error);
    res.status(500).json({ 
      error: 'Clark encountered an issue', 
      message: error.message 
    });
  }
});

// Get live family data from Notion
async function getFamilyData() {
  try {
    // Get Clark's current settings
    const clarkData = {
      name: 'Clark',
      budget_authority: 500,
      status: 'Active',
      last_updated: new Date().toISOString()
    };

    // Get active agents (we'll connect to real Notion data later)
    const agents = [
      { name: 'Nora', role: 'Nutritionist', budget_authority: 150, status: 'Active' },
      { name: 'Oz', role: 'Order Taker', budget_authority: 300, status: 'Active' },
      { name: 'Sage', role: 'Scheduler', budget_authority: 100, status: 'Active' }
    ];

    return {
      clark: clarkData,
      agents: agents,
      family_priorities: ['Safety', 'Relationships', 'Budget', 'Growth', 'Convenience'],
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching family data:', error);
    return {
      clark: { name: 'Clark', budget_authority: 500, status: 'Active' },
      agents: [],
      family_priorities: ['Safety', 'Relationships', 'Budget', 'Growth', 'Convenience'],
      last_updated: new Date().toISOString(),
      error: 'Could not fetch live data'
    };
  }
}

// Process Clark's request with live data
async function processClarkRequest(request, urgency, context, familyData) {
  const budget_limit = familyData.clark.budget_authority;
  
  return {
    clark_response: `I've received your request: "${request}". I have authority up to $${budget_limit} and can coordinate with ${familyData.agents.length} active agents.`,
    current_budget_authority: budget_limit,
    available_agents: familyData.agents,
    urgency_level: urgency,
    family_priorities: familyData.family_priorities,
    recommendations: [
      'I can handle this directly if under budget',
      'I can delegate to appropriate specialist agent',
      'I can coordinate multi-agent response if needed'
    ],
    timestamp: new Date().toISOString()
  };
}

// Start server
app.listen(PORT, () => {
  console.log(`🏎️ Clark API Server running on port ${PORT}`);
  console.log(`Ferrari engine ready for Blair Family!`);
});
