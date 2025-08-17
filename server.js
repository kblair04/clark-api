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
    console.log('🔍 Fetching family data from Notion...');
    
    // Get agent data from Roles + Policies database
    const agentsResponse = await notion.databases.query({
      database_id: process.env.ROLES_POLICIES_DB_ID,
      filter: {
        property: 'Status',
        select: {
          equals: 'Active'
        }
      }
    });

    console.log(`✅ Found ${agentsResponse.results.length} active agents`);

    // Process agent data
    const agents = agentsResponse.results.map(page => {
      const props = page.properties;
      return {
        name: props.Agent_Name?.title[0]?.text?.content || 'Unknown',
        role: props.Role_Title?.rich_text[0]?.text?.content || 'Unknown',
        budget_authority: props.Budget_Authority?.number || 0,
        authority_level: props.Authority_Level?.select?.name || 'Unknown',
        performance_rating: props['Performance Rating']?.select?.name || 'Unknown',
        escalation_triggers: props['Escalation Triggers']?.rich_text[0]?.text?.content || '',
        status: props.Status?.select?.name || 'Unknown'
      };
    });

    console.log('🎯 Agent data processed successfully');

    return {
      agents: agents,
      family_priorities: ['Safety', 'Relationships', 'Budget', 'Growth', 'Convenience'],
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error fetching family data:', error);
    console.error('Error details:', error.message);
    
    // Return fallback data on error
    return {
      agents: [
        { name: 'Clark', role: 'CEO', budget_authority: 500, performance_rating: 'Excellent', status: 'Active' },
        { name: 'Nora', role: 'Nutritionist', budget_authority: 150, performance_rating: 'Excellent', status: 'Active' },
        { name: 'Oz', role: 'Order Taker', budget_authority: 300, performance_rating: 'Excellent', status: 'Active' },
        { name: 'Sage', role: 'Scheduler', budget_authority: 100, performance_rating: 'Excellent', status: 'Active' }
      ],
      family_priorities: ['Safety', 'Relationships', 'Budget', 'Growth', 'Convenience'],
      last_updated: new Date().toISOString(),
      error: 'Using fallback data - Notion connection failed'
    };
  }

// Process Clark's request with live data
async function processClarkRequest(request, urgency, context, familyData) {
  console.log(`🎯 Processing Clark request: "${request}"`);
  
  // Find Clark's data from the agents
  const clark = familyData.agents.find(agent => agent.name === 'Clark') || { budget_authority: 500 };
  const otherAgents = familyData.agents.filter(agent => agent.name !== 'Clark');
  
  console.log(`💰 Clark's budget authority: $${clark.budget_authority}`);
  console.log(`👥 Available agents: ${otherAgents.length}`);
  
  return {
    clark_response: `I've received your request: "${request}". Based on current family data, I have authority up to $${clark.budget_authority} and can coordinate with ${otherAgents.length} active agents.`,
    current_budget_authority: clark.budget_authority,
    available_agents: otherAgents,
    urgency_level: urgency,
    family_priorities: familyData.family_priorities,
    performance_data: familyData.agents.map(agent => ({
      name: agent.name,
      role: agent.role,
      performance_rating: agent.performance_rating,
      budget_authority: agent.budget_authority,
      status: agent.status
    })),
    recommendations: [
      'I can handle this directly if under budget',
      'I can delegate to appropriate specialist agent',
      'I can coordinate multi-agent response if needed'
    ],
    data_source: familyData.error ? 'fallback' : 'live_notion',
    timestamp: new Date().toISOString()
  };
}
  
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
