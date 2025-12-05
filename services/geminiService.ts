import { GoogleGenAI } from "@google/genai";
import { User } from '../types';

export const getMatchingAdvice = async (studentInput: string, teachers: User[]): Promise<string> => {
  if (!process.env.API_KEY) {
    return "系统未配置AI API Key，无法使用智能推荐功能。";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const teacherData = teachers.map(t => 
      `- ${t.name} (${t.title}): 研究方向包括 ${t.researchArea}`
    ).join('\n');

    const prompt = `
      我是一名计算机专业的学生，正在寻找毕业论文导师。
      我的情况是：${studentInput}
      
      以下是可选导师列表：
      ${teacherData}
      
      请根据我的情况，推荐最适合我的1-2位导师，并简要说明理由。
      请保持回答客观、简洁。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "无法生成建议，请稍后再试。";
  } catch (error) {
    console.error("AI Error:", error);
    return "AI服务暂时不可用，请手动浏览导师列表。";
  }
};