// 这个脚本用于将课程相关信息.csv转换为测试数据格式

// 读取CSV文件内容
const fs = require('fs');
const path = require('path');

// 读取CSV文件
const csvFilePath = path.join(__dirname, '课程相关信息.csv');
const csvContent = fs.readFileSync(csvFilePath, 'utf8');

// 解析CSV内容
const lines = csvContent.split('\n');
const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());

const courses = [];
let id = 1;

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue; // 跳过空行
  
  // 处理CSV行，考虑引号内的逗号
  const values = [];
  let currentValue = '';
  let insideQuotes = false;
  
  for (let j = 0; j < lines[i].length; j++) {
    const char = lines[i][j];
    
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      values.push(currentValue.replace(/"/g, '').trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  
  // 添加最后一个值
  values.push(currentValue.replace(/"/g, '').trim());
  
  // 创建课程对象
  if (values.length >= 4) {
    const title = values[0];
    const shareTitle = values[1] || title;
    const shareDescription = values[2] || '';
    const content = values[3] || '';
    
    // 从标题和描述中提取关键词
    const keywordsSet = new Set();
    const titleWords = title.split(/[,，\s、]/).filter(word => word.length >= 2);
    const descWords = shareDescription.split(/[,，\s、]/).filter(word => word.length >= 2);
    
    titleWords.forEach(word => keywordsSet.add(word));
    descWords.forEach(word => keywordsSet.add(word));
    
    // 提取关键词（最多5个）
    const keywords = Array.from(keywordsSet).slice(0, 5).join(', ');
    
    // 确定课程级别
    let level = '初级';
    if (title.includes('进阶') || title.includes('高级')) {
      level = '中级';
    } else if (title.includes('专业') || title.includes('深度')) {
      level = '高级';
    }
    
    // 确定课程时长
    let duration = 15; // 默认15分钟
    const durationMatch = title.match(/(\d+)天|(\d+)分钟/);
    if (durationMatch) {
      const days = durationMatch[1];
      const minutes = durationMatch[2];
      if (days) {
        duration = parseInt(days) * 10; // 假设每天10分钟
      } else if (minutes) {
        duration = parseInt(minutes);
      }
    }
    
    // 确定课程类别
    let category = '正念冥想';
    if (title.includes('睡眠') || title.includes('助眠') || title.includes('舒眠')) {
      category = '睡眠改善';
    } else if (title.includes('压力') || title.includes('减压') || title.includes('放松')) {
      category = '压力管理';
    } else if (title.includes('专注') || title.includes('注意力')) {
      category = '专注力';
    } else if (title.includes('情绪') || title.includes('焦虑')) {
      category = '情绪管理';
    } else if (title.includes('音乐')) {
      category = '音乐辅助';
    } else if (title.includes('基础') || title.includes('入门')) {
      category = '入门基础';
    }
    
    // 创建课程对象
    const course = {
      id,
      title,
      keywords,
      description: content || shareDescription,
      level,
      duration,
      teacher: 'Now团队',
      category
    };
    
    courses.push(course);
    id++;
  }
}

// 输出JSON格式的课程数据
console.log(JSON.stringify(courses, null, 2));

// 将结果保存到文件
fs.writeFileSync(path.join(__dirname, 'courses_data.json'), JSON.stringify(courses, null, 2));
console.log(`成功转换 ${courses.length} 个课程数据到 courses_data.json`);
