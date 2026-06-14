const fs = require('fs');

const mockDataCode = `// Showcase Mock Data for Guest Mode

export const mockCustomers = [
  { id: 'cust-1', company_name: 'TechFlow Solutions', contact_name: 'Somchai Jaidee', position: 'CTO', email: 'somchai@techflow.co.th', phone: '081-234-5678', customer_grade: 'A', status: 'active', health_score: 95 },
  { id: 'cust-2', company_name: 'Siam Retail Group', contact_name: 'Somsri Rakthai', position: 'Procurement Manager', email: 'somsri@siamretail.com', phone: '089-876-5432', customer_grade: 'B', status: 'active', health_score: 80 },
  { id: 'cust-3', company_name: 'Bangkok Logistics', contact_name: 'Wichai Transport', position: 'Director', email: 'wichai@bkklogistics.net', phone: '082-345-6789', customer_grade: 'C', status: 'inactive', health_score: 40 },
  { id: 'cust-4', company_name: 'Phuket Resorts Ltd', contact_name: 'Nadech K.', position: 'General Manager', email: 'nadech@phuketresorts.co.th', phone: '088-765-4321', customer_grade: 'A', status: 'active', health_score: 90 },
  { id: 'cust-5', company_name: 'Chiang Mai Tech', contact_name: 'Yaya U.', position: 'CEO', email: 'yaya@cmtech.io', phone: '083-456-7890', customer_grade: 'A', status: 'active', health_score: 85 }
];

export const mockDeals = [
  { id: 'deal-1', title: 'Q3 Software Licensing', company_name: 'TechFlow Solutions', contact_name: 'Somchai Jaidee', value: 450000, stage: 'negotiation', expected_close_date: new Date(Date.now() + 5*86400000).toISOString(), probability: 80, is_urgent: true, customer_id: 'cust-1' },
  { id: 'deal-2', title: 'POS System Upgrade', company_name: 'Siam Retail Group', contact_name: 'Somsri Rakthai', value: 850000, stage: 'proposal', expected_close_date: new Date(Date.now() + 15*86400000).toISOString(), probability: 50, customer_id: 'cust-2' },
  { id: 'deal-3', title: 'Cloud Infrastructure', company_name: 'Bangkok Logistics', contact_name: 'Wichai Transport', value: 1200000, stage: 'lost', expected_close_date: new Date(Date.now() - 10*86400000).toISOString(), probability: 0, customer_id: 'cust-3' },
  { id: 'deal-4', title: 'Enterprise CRM Setup', company_name: 'Phuket Resorts Ltd', contact_name: 'Nadech K.', value: 2500000, stage: 'won', expected_close_date: new Date(Date.now() - 2*86400000).toISOString(), actual_close_date: new Date(Date.now() - 2*86400000).toISOString(), probability: 100, customer_id: 'cust-4' },
  { id: 'deal-5', title: 'Annual Security Audit', company_name: 'Chiang Mai Tech', contact_name: 'Yaya U.', value: 320000, stage: 'contact', expected_close_date: new Date(Date.now() + 20*86400000).toISOString(), probability: 30, customer_id: 'cust-5' },
  { id: 'deal-6', title: 'Network Expansion', company_name: 'TechFlow Solutions', contact_name: 'Somchai Jaidee', value: 150000, stage: 'lead', expected_close_date: new Date(Date.now() + 45*86400000).toISOString(), probability: 10, customer_id: 'cust-1' },
  { id: 'deal-7', title: 'Data Analytics Platform', company_name: 'Siam Retail Group', contact_name: 'Somsri Rakthai', value: 670000, stage: 'won', expected_close_date: new Date(Date.now() - 20*86400000).toISOString(), actual_close_date: new Date(Date.now() - 20*86400000).toISOString(), probability: 100, customer_id: 'cust-2' },
  { id: 'deal-8', title: 'HR Software Implementation', company_name: 'Chiang Mai Tech', contact_name: 'Yaya U.', value: 890000, stage: 'negotiation', expected_close_date: new Date(Date.now() + 2*86400000).toISOString(), probability: 85, customer_id: 'cust-5' }
];

export const mockActivities = [
  { id: 'act-1', type: 'call', title: 'Initial Discovery Call', description: 'Discussed their current pain points.', deal_id: 'deal-1', created_at: new Date(Date.now() - 5*86400000).toISOString() },
  { id: 'act-2', type: 'meeting', title: 'Product Demo', description: 'Showed the POS system to the procurement team.', deal_id: 'deal-2', created_at: new Date(Date.now() - 3*86400000).toISOString() },
  { id: 'act-3', type: 'email', title: 'Sent Proposal', description: 'Sent the updated pricing proposal for review.', deal_id: 'deal-8', created_at: new Date(Date.now() - 1*86400000).toISOString() },
  { id: 'act-4', type: 'note', title: 'Closing Requirements', description: 'Need to get legal approval on the MSA before signing.', deal_id: 'deal-4', created_at: new Date(Date.now() - 4*86400000).toISOString() }
];
`;

fs.writeFileSync('src/lib/mockData.js', mockDataCode);
console.log('mockData.js created');
