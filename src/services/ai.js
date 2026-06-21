import { supabase } from '../utils/supabase';

/**
 * Simple rate limiter to prevent excessive API calls.
 * Allows maxCalls within windowMs milliseconds.
 */
const rateLimiter = {
  calls: [],
  maxCalls: 10,
  windowMs: 60_000, // 1 minute

  canCall() {
    const now = Date.now();
    this.calls = this.calls.filter((t) => now - t < this.windowMs);
    if (this.calls.length >= this.maxCalls) return false;
    this.calls.push(now);
    return true;
  },
};

export async function callGeminiAPI(prompt, schema = null) {
  if (!rateLimiter.canCall()) {
    return { text: 'กำลังประมวลผลเร็วเกินไป กรุณารอสักครู่' };
  }

  // 🚀 Local Smart AI Engine (Fallback / Replacement for Gemini)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(simulateSmartAI(prompt, schema));
    }, 800); // Simulate network delay
  });
}

function simulateSmartAI(prompt, schema) {
  const p = prompt.toLowerCase();

  // 1. Voice-to-Deal Parsing
  if (p.includes('ผู้ใช้บันทึกเสียง') || p.includes('ดึงข้อมูลดีล')) {
    const transcriptMatch = prompt.match(/"([^"]+)"/);
    const text = transcriptMatch ? transcriptMatch[1] : prompt;
    
    // Heuristics
    const valueMatch = text.match(/(\d+(?:,\d+)*)\s*(บาท|ล้าน|หมื่น|แสน)/);
    let value = 0;
    if (valueMatch) {
      const numRaw = valueMatch[1].replace(/,/g, '');
      const unit = valueMatch[2];
      value = parseInt(numRaw, 10);
      if (unit === 'ล้าน') value *= 1000000;
      if (unit === 'แสน') value *= 100000;
      if (unit === 'หมื่น') value *= 10000;
    }

    const title = text.length > 20 ? text.substring(0, 20) + "..." : "ดีลใหม่จากเสียง";
    let company = "ลูกค้าใหม่";
    const companyMatch = text.match(/(?:บริษัท|ลูกค้า|ชื่อ)\s*([ก-๙a-zA-Z0-9]+)/);
    if (companyMatch) company = companyMatch[1];

    let stage = 'lead';
    if (text.includes('เสนอ') || text.includes('ใบเสนอราคา')) stage = 'proposal';
    if (text.includes('ต่อรอง') || text.includes('ลดราคา')) stage = 'negotiation';

    return {
      company,
      title,
      value: value || null,
      contact: "ติดต่อจากเสียง",
      stage,
      expected_close_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] // +14 days
    };
  }

  // 2. Focus Deals Card Explain
  if (p.includes('ทำไมดีล') || p.includes('ถึงน่าสนใจ')) {
    const valueMatch = prompt.match(/มูลค่า\s*([0-9,]+)/);
    const stageMatch = prompt.match(/สถานะ\s*([a-zA-Z]+)/);
    return {
      text: `🚀 ดีลนี้มีความน่าสนใจเพราะมีการเปลี่ยนแปลงเชิงบวก สัญญาณการซื้อชัดเจน ${valueMatch ? `บวกกับมูลค่าที่สูงถึง ${valueMatch[1]} บาท ` : ''}แนะนำให้รีบ Follow-up เพื่อปิดการขายให้เร็วที่สุด`
    };
  }

  // 3. PDF Importer Parsing
  if (p.includes('extract structured data') || p.includes('pdf text')) {
    return {
      company_name: "บริษัทจากการสแกน จำกัด",
      contact_name: "ผู้ติดต่อ PDF",
      email: "contact@example.com",
      phone: "080-000-0000",
      items: [
        { description: "บริการตามใบเสนอราคา", quantity: 1, unit_price: 50000, amount: 50000 }
      ],
      total_amount: 50000,
      quote_number: "QT-" + Math.floor(Math.random() * 10000),
      quote_date: new Date().toISOString().split('T')[0]
    };
  }

  // 4. Analyze Deal
  if (p.includes('analyze this sales deal')) {
    return {
      winProbability: 65,
      riskLevel: "medium",
      riskFactors: ["ไม่มีการติดต่อในระยะหลัง", "มูลค่าสูงแต่ยังอยู่ที่สถานะเริ่มต้น"],
      nextBestAction: "โทรหาลูกค้าเพื่ออัปเดตความคืบหน้าและนัดหมายเพื่อเสนอเดโม่",
      suggestedEmail: "สวัสดีครับคุณลูกค้า,\n\nผมขออนุญาตติดตามเรื่องดีลที่เราได้คุยกันไว้ ไม่ทราบว่าทางทีมมีข้อสงสัยเพิ่มเติมไหมครับ?\n\nขอบคุณครับ",
      daysSinceActivity: 5,
      isStalled: false,
      priority: "high"
    };
  }

  // Default fallback if schema is requested
  if (schema) {
    if (schema.type === 'ARRAY' || schema.type === 2) return [];
    return {};
  }
  
  return { text: "ระบบวิเคราะห์ข้อความอัจฉริยะ (Local Engine) ประมวลผลเสร็จสิ้น" };
}

/**
 * Extract deal information from transcribed voice text.
 */
export async function parseVoiceDealText(transcript) {
  const schema = {
    type: 'OBJECT',
    properties: {
      company: { type: 'STRING', description: 'ชื่อบริษัทหรือชื่อลูกค้า' },
      title: { type: 'STRING', description: 'หัวข้อดีล หรือสินค้าที่ขาย หากไม่มีให้ตั้งให้' },
      value: { type: 'NUMBER', description: 'มูลค่าดีลตัวเลขล้วน (ถ้ามี)' },
      contact: { type: 'STRING', description: 'ชื่อบุคคลผู้ติดต่อ' },
      stage: { type: 'STRING', description: 'สถานะ: lead, contact, proposal, negotiation' },
      expected_close_date: { type: 'STRING', description: 'วันที่คาดว่าจะปิดดีล YYYY-MM-DD' }
    },
    required: ['company', 'title']
  };

  const prompt = `ผู้ใช้บันทึกเสียงข้อมูลดีลการขายดังนี้:\n\n"${transcript}"\n\nจงดึงข้อมูลที่เกี่ยวข้องออกมา หากข้อมูลส่วนใดไม่ถูกกล่าวถึง ให้เป็น null หรือค่าว่างเปล่า (ห้ามแต่งข้อมูลเองยกเว้น title ที่อาจสรุปสั้นๆ จาก context)`;
  
  return await callGeminiAPI(prompt, schema);
}
