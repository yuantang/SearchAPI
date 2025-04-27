/**
 * Meditation Search JavaScript.
 *
 * Provides the frontend functionality for the meditation search feature.
 */

// API configuration.
// 在开发环境中，我们直接使用相对路径访问JSON数据
const API_BASE_URL = '';
const USE_LOCAL_DATA = true; // 使用本地数据而不是API

// Global variables.
let searchInput;
let searchButton;
let suggestionsContainer;
let historyContainer;
let semanticSearchCheckbox;
let fuzzyMatchCheckbox;
let highlightMatchesCheckbox;
let searchResultsContainer;
let searchInsightsContainer;
let loadingIndicator;

// Search history.
let searchHistory = JSON.parse(localStorage.getItem('meditationSearchHistory')) || [];

// Semantic relationships for client-side suggestions.
const semanticMap = {
  // 同义词映射
  '正念': ['觉知', '专注', '当下', '静心', 'mindfulness'],
  '冥想': ['打坐', '静坐', '禅修', '静心', 'meditation'],
  '呼吸': ['呼吸法', '气息', '吸气', '呼气', '呼吸节奏'],
  '专注': ['集中', '注意力', '专心', '聚焦'],
  '放松': ['减压', '舒缓', '松弛', '舒眠', '平和'],
  '压力': ['焦虑', '紧张', '不安', '烦躁'],
  '睡眠': ['入睡', '失眠', '休息', '舒眠', '助眠'],
  '感恩': ['幸福', '感谢', '珍惜', '美好'],
  '身体': ['身心', '躯体', '感受', '觉察'],
  '自我': ['自己', '内心', '内在', '本我'],

  // 概念关系映射
  '入门': ['基础', '简单', '初级', '学前', '0基础'],
  '进阶': ['高级', '深入', '资深', '中级', '提升'],
  '短时间': ['快速', '简短', '7天', '5分钟', '10分钟'],
  '长时间': ['深度', '完整', '21天', '30天', '进阶'],

  // 目的映射
  '减压': ['压力管理', '放松', '舒缓压力', '平和心境'],
  '睡眠改善': ['失眠', '睡眠质量', '助眠', '舒眠', '深度睡眠'],
  '专注力提升': ['注意力', '集中精神', '工作效率', '专注冥想'],
  '情绪平衡': ['情绪管理', '心情', '平静心灵', '缓解焦虑'],
  '灵性成长': ['觉醒', '意识拓展', '精神成长', '禅修'],
  '自我成长': ['接纳自我', '和解', '自我认知', '自我关爱'],
  '幸福感': ['幸福冥想', '感恩', '快乐', '满足'],

  // 课程类型映射
  '基础课程': ['7天基础冥想', '冥想学前课', '入门必修课'],
  '进阶课程': ['21天进阶冥想', '8天禅修冥想', '正念静心之旅'],
  '专注系列': ['7天专注冥想', '专注力冥想', '工作专注力'],
  '睡眠系列': ['7天舒眠冥想', '睡眠冥想', '助眠冥想'],
  '情绪系列': ['缓解焦虑', '平和心境', '情绪管理'],
  '音乐辅助': ['冥想纯音乐', '脑波音乐', '放松音乐']
};

/**
 * Initializes the search functionality.
 */
function initSearch() {
  // Initialize DOM elements.
  searchInput = document.getElementById('search-input');
  searchButton = document.getElementById('search-button');
  suggestionsContainer = document.getElementById('search-suggestions');
  historyContainer = document.getElementById('history-items');
  searchResultsContainer = document.getElementById('search-results');
  searchInsightsContainer = document.getElementById('search-insights');
  loadingIndicator = document.getElementById('loading-indicator');

  // Search options.
  semanticSearchCheckbox = document.getElementById('semantic-search');
  fuzzyMatchCheckbox = document.getElementById('fuzzy-match');
  highlightMatchesCheckbox = document.getElementById('highlight-matches');

  // Search button click event.
  searchButton.addEventListener('click', performSearch);

  // Input field events.
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  // Input field input event - show suggestions.
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();

    if (query.length >= 2) {
      const suggestions = generateSuggestions(query);
      displaySuggestions(suggestions);
    } else {
      suggestionsContainer.style.display = 'none';
    }
  });

  // Click outside suggestions to hide them.
  document.addEventListener('click', (e) => {
    if (!suggestionsContainer.contains(e.target) && e.target !== searchInput) {
      suggestionsContainer.style.display = 'none';
    }
  });

  // Tab switching.
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs.
      tabs.forEach(t => t.classList.remove('active'));
      // Add active class to current tab.
      tab.classList.add('active');

      // Hide all content.
      const contents = document.querySelectorAll('.tab-content');
      contents.forEach(content => content.classList.remove('active'));

      // Show current content.
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Initialize search history.
  displaySearchHistory();
}

/**
 * Performs a search.
 */
async function performSearch() {
  const query = searchInput.value.trim();

  if (!query) {
    searchResultsContainer.innerHTML = '';
    searchInsightsContainer.style.display = 'none';
    return;
  }

  // Show loading indicator.
  showLoading(true);

  // Get search options.
  const options = {
    semantic: semanticSearchCheckbox.checked,
    fuzzy: fuzzyMatchCheckbox.checked,
    highlight: highlightMatchesCheckbox.checked
  };

  try {
    // Call the API.
    const searchResult = await searchAPI(query, options);

    // Display results.
    displayResults(searchResult, query, options);

    // Generate insights for semantic search.
    if (options.semantic && searchResult.expandedTerms) {
      generateSearchInsights(query, searchResult.items, searchResult.expandedTerms);
    } else {
      searchInsightsContainer.style.display = 'none';
    }

    // Add to search history.
    addToSearchHistory(query);

    // Hide suggestions.
    suggestionsContainer.style.display = 'none';
  } catch (error) {
    console.error('Search error:', error);

    // 提供更友好的错误信息
    let errorMessage = '无法完成搜索，请稍后再试。';
    let errorDetails = '';

    if (error.message) {
      if (error.message.includes('Failed to fetch') ||
          error.message.includes('无法加载') ||
          error.message.includes('NetworkError')) {
        errorMessage = '无法加载课程数据。请检查您的网络连接，或者数据文件是否存在。';
        errorDetails = '您可以点击"使用测试数据"按钮来使用内置的示例数据进行搜索。';
      } else if (error.message.includes('JSON')) {
        errorMessage = '课程数据格式不正确。';
        errorDetails = '数据文件可能已损坏，请联系管理员修复或使用测试数据。';
      } else {
        errorMessage = error.message;
      }
    }

    searchResultsContainer.innerHTML = `
      <div class="error-message">
        <h3>搜索出错</h3>
        <p>${errorMessage}</p>
        ${errorDetails ? `<p class="error-details">${errorDetails}</p>` : ''}
        <div class="error-actions">
          <button id="retry-search" class="search-button">重试</button>
          <button id="use-test-data" class="search-button secondary">使用测试数据</button>
        </div>
      </div>
    `;

    // 添加重试按钮事件
    const retryButton = document.getElementById('retry-search');
    if (retryButton) {
      retryButton.addEventListener('click', performSearch);
    }

    // 添加使用测试数据按钮事件
    const useTestDataButton = document.getElementById('use-test-data');
    if (useTestDataButton) {
      useTestDataButton.addEventListener('click', () => {
        // 强制使用测试数据
        window.forceUseTestData = true;
        performSearch();
      });
    }

    searchInsightsContainer.style.display = 'none';
  } finally {
    // Hide loading indicator.
    showLoading(false);
  }
}

/**
 * Calls the search API or uses local data in development environment.
 *
 * @param {string} query - The search query.
 * @param {Object} options - The search options.
 * @returns {Promise<Object>} - The search results.
 */
async function searchAPI(query, options = {}) {
  if (USE_LOCAL_DATA) {
    // 在开发环境中，直接使用本地数据进行搜索
    console.log('使用本地数据进行搜索:', query, options);

    try {
      // 加载课程数据
      let courses = [];

      // 检查是否强制使用测试数据
      let useTestData = window.forceUseTestData === true;

      if (!useTestData) {
        try {
          // 首先尝试加载正式数据
          console.log('尝试加载正式数据...');
          const response = await fetch('courses_data.json');
          if (!response.ok) {
            throw new Error(`无法加载课程数据: ${response.status} ${response.statusText}`);
          }
          courses = await response.json();
          console.log(`成功加载 ${courses.length} 个课程数据`);
        } catch (error) {
          console.warn('加载正式数据失败，尝试加载测试数据:', error);
          useTestData = true;
        }
      }
      // 执行本地搜索
      let results = [];
      let expandedTerms = [query];

      // 基础搜索
      if (!query.trim()) {
        return {
          total: 0,
          items: [],
          query: query,
          semantic: options.semantic,
          fuzzy: options.fuzzy,
          limit: options.limit || 20,
          offset: options.offset || 0
        };
      }

      // 执行搜索
      results = performLocalSearch(query, courses, options);

      // 如果启用了语义搜索，生成扩展词
      if (options.semantic) {
        expandedTerms = generateExpandedTerms(query);
      }

      // 应用分页
      const total = results.length;
      const limit = options.limit || 20;
      const offset = options.offset || 0;
      const paginatedResults = results.slice(offset, offset + limit);

      // 构建响应
      const searchResult = {
        total: total,
        items: paginatedResults,
        query: query,
        semantic: options.semantic,
        fuzzy: options.fuzzy,
        limit: limit,
        offset: offset
      };

      // 添加扩展词
      if (options.semantic) {
        searchResult.expandedTerms = expandedTerms;
      }

      return searchResult;
    } catch (error) {
      console.error('本地搜索错误:', error);
      throw error;
    }
  } else {
    // 使用API进行搜索
    try {
      // 构建API URL
      const url = new URL(`${API_BASE_URL}/search`, window.location.origin);

      // 添加查询参数
      url.searchParams.append('q', query);

      if (options.semantic !== undefined) {
        url.searchParams.append('semantic', options.semantic ? '1' : '0');
      }

      if (options.fuzzy !== undefined) {
        url.searchParams.append('fuzzy', options.fuzzy ? '1' : '0');
      }

      // 添加分页参数
      url.searchParams.append('limit', options.limit || 20);
      url.searchParams.append('offset', options.offset || 0);

      // 发起API请求
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`API错误: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  }
}

/**
 * 在本地执行搜索（开发环境使用）
 *
 * @param {string} query - 搜索查询
 * @param {Array} courses - 课程数据
 * @param {Object} options - 搜索选项
 * @returns {Array} - 搜索结果
 */
function performLocalSearch(query, courses, options = {}) {
  const results = [];
  const fuzzyMatch = options.fuzzy !== undefined ? options.fuzzy : true;

  courses.forEach(course => {
    let score = 0;
    let matchTypes = [];

    // 精确匹配搜索
    // 搜索标题（最高权重）
    if (course.title.toLowerCase().includes(query.toLowerCase())) {
      score += 8;
      matchTypes.push('标题匹配');
    }

    // 搜索关键词（中等权重）
    if (course.keywords.toLowerCase().includes(query.toLowerCase())) {
      score += 5;
      matchTypes.push('关键词匹配');
    }

    // 搜索描述（最低权重）
    if (course.description.toLowerCase().includes(query.toLowerCase())) {
      score += 3;
      matchTypes.push('描述匹配');
    }

    // 模糊匹配搜索
    if (fuzzyMatch && score === 0) {
      // 分词搜索
      const queryWords = query.toLowerCase().split(/\s+|,|，/);

      queryWords.forEach(word => {
        if (word.length < 2) return; // 忽略太短的词

        if (course.title.toLowerCase().includes(word)) {
          score += 4; // 标题中的部分匹配
          matchTypes.push('标题部分匹配');
        }

        if (course.keywords.toLowerCase().includes(word)) {
          score += 2.5; // 关键词中的部分匹配
          matchTypes.push('关键词部分匹配');
        }

        if (course.description.toLowerCase().includes(word)) {
          score += 1.5; // 描述中的部分匹配
          matchTypes.push('描述部分匹配');
        }
      });
    }

    // 语义搜索
    if (options.semantic && score === 0) {
      const expandedTerms = generateExpandedTerms(query);

      expandedTerms.forEach(term => {
        if (term === query) return; // 跳过原始查询词

        if (course.title.toLowerCase().includes(term.toLowerCase())) {
          score += 4 * 0.7; // 降低语义匹配的得分
          matchTypes.push('语义标题匹配');
        }

        if (course.keywords.toLowerCase().includes(term.toLowerCase())) {
          score += 2.5 * 0.7;
          matchTypes.push('语义关键词匹配');
        }

        if (course.description.toLowerCase().includes(term.toLowerCase())) {
          score += 1.5 * 0.7;
          matchTypes.push('语义描述匹配');
        }
      });
    }

    if (score > 0) {
      const result = {
        ...course,
        score,
        matchTypes: [...new Set(matchTypes)] // 去重
      };

      // 如果是语义匹配，添加标记
      if (matchTypes.some(type => type.startsWith('语义'))) {
        result.semanticMatch = true;
      }

      results.push(result);
    }
  });

  // 按得分排序
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * 生成扩展查询词（用于语义搜索）
 *
 * @param {string} query - 原始查询词
 * @returns {Array} - 扩展后的查询词列表
 */
function generateExpandedTerms(query) {
  const expandedTerms = [query]; // 始终包含原始查询

  // 检查语义映射
  for (const [key, synonyms] of Object.entries(semanticMap)) {
    // 如果查询包含关键词或关键词包含查询
    if (query.includes(key) || key.includes(query)) {
      expandedTerms.push(key, ...synonyms);
    }

    // 检查同义词是否匹配
    synonyms.forEach(synonym => {
      if (query.includes(synonym) || synonym.includes(query)) {
        expandedTerms.push(key, ...synonyms);
      }
    });
  }

  // 分词处理
  const queryWords = query.split(/\s+|,|，/);
  queryWords.forEach(word => {
    if (word.length < 2) return; // 忽略太短的词

    for (const [key, synonyms] of Object.entries(semanticMap)) {
      if (key.includes(word) || word.includes(key)) {
        expandedTerms.push(key, ...synonyms);
      }

      synonyms.forEach(synonym => {
        if (synonym.includes(word) || word.includes(synonym)) {
          expandedTerms.push(key, ...synonyms);
        }
      });
    }
  });

  // 去重并返回
  return [...new Set(expandedTerms)];
}

/**
 * Shows or hides the loading indicator.
 *
 * @param {boolean} show - Whether to show the loading indicator.
 */
function showLoading(show) {
  if (loadingIndicator) {
    loadingIndicator.style.display = show ? 'block' : 'none';
  }
}

/**
 * Displays the search history.
 */
function displaySearchHistory() {
  if (!historyContainer) {
    return;
  }

  if (searchHistory.length === 0) {
    historyContainer.innerHTML = '<span class="history-empty">无搜索历史</span>';
    return;
  }

  let html = '';
  // Only show the most recent 5 items.
  const recentHistory = searchHistory.slice(-5).reverse();

  recentHistory.forEach(item => {
    html += `<span class="history-item" data-query="${item}">${item}</span>`;
  });

  historyContainer.innerHTML = html;

  // Add click events.
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      searchInput.value = item.dataset.query;
      performSearch();
    });
  });
}

/**
 * Adds a query to the search history.
 *
 * @param {string} query - The search query.
 */
function addToSearchHistory(query) {
  if (!query || query.trim() === '') return;

  // Remove if already exists.
  const index = searchHistory.indexOf(query);
  if (index !== -1) {
    searchHistory.splice(index, 1);
  }

  // Add to the end.
  searchHistory.push(query);

  // Limit history size.
  if (searchHistory.length > 20) {
    searchHistory = searchHistory.slice(-20);
  }

  // Save to local storage.
  localStorage.setItem('meditationSearchHistory', JSON.stringify(searchHistory));

  // Update display.
  displaySearchHistory();
}

/**
 * Generates search suggestions.
 *
 * @param {string} query - The search query.
 * @returns {Array} - The search suggestions.
 */
function generateSuggestions(query) {
  if (!query || query.length < 2) return [];

  const suggestions = [];

  // 1. From search history.
  searchHistory.forEach(item => {
    if (item.toLowerCase().includes(query.toLowerCase())) {
      suggestions.push({
        text: item,
        type: 'history'
      });
    }
  });

  // 2. From semantic map.
  for (const [key, synonyms] of Object.entries(semanticMap)) {
    if (key.toLowerCase().includes(query.toLowerCase())) {
      suggestions.push({
        text: key,
        type: 'semantic'
      });
    }

    synonyms.forEach(synonym => {
      if (synonym.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          text: synonym,
          type: 'semantic'
        });
      }
    });
  }

  // Remove duplicates.
  const uniqueSuggestions = [];
  const seenTexts = new Set();

  suggestions.forEach(suggestion => {
    if (!seenTexts.has(suggestion.text)) {
      uniqueSuggestions.push(suggestion);
      seenTexts.add(suggestion.text);
    }
  });

  // Limit and sort.
  return uniqueSuggestions
    .slice(0, 8)
    .sort((a, b) => {
      // History first, then semantic.
      const typeOrder = { 'history': 0, 'semantic': 1 };
      return typeOrder[a.type] - typeOrder[b.type];
    });
}

/**
 * Displays search suggestions.
 *
 * @param {Array} suggestions - The search suggestions.
 */
function displaySuggestions(suggestions) {
  if (!suggestionsContainer) {
    return;
  }

  if (!suggestions || suggestions.length === 0) {
    suggestionsContainer.style.display = 'none';
    return;
  }

  let html = '';

  suggestions.forEach(suggestion => {
    let typeLabel = '';
    switch (suggestion.type) {
      case 'history':
        typeLabel = '<span class="suggestion-type">历史</span>';
        break;
      case 'semantic':
        typeLabel = '<span class="suggestion-type">相关</span>';
        break;
    }

    html += `<div class="suggestion-item" data-text="${suggestion.text}">${suggestion.text} ${typeLabel}</div>`;
  });

  suggestionsContainer.innerHTML = html;
  suggestionsContainer.style.display = 'block';

  // Add click events.
  document.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      searchInput.value = item.dataset.text;
      suggestionsContainer.style.display = 'none';
      performSearch();
    });
  });
}

/**
 * Generates search insights.
 *
 * @param {string} query - The search query.
 * @param {Array} results - The search results.
 * @param {Array} expandedTerms - The expanded terms.
 */
function generateSearchInsights(query, results, expandedTerms) {
  if (!searchInsightsContainer) {
    return;
  }

  if (!query || !results || results.length === 0) {
    searchInsightsContainer.style.display = 'none';
    return;
  }

  let html = '<h3>搜索洞察</h3>';

  // Add expanded terms.
  if (expandedTerms && expandedTerms.length > 1) {
    html += '<p>您的搜索被扩展为以下相关概念：</p>';
    html += '<div class="related-terms">';

    expandedTerms.forEach(term => {
      if (term !== query) {
        html += `<span class="related-term" data-term="${term}">${term}</span>`;
      }
    });

    html += '</div>';
  }

  // Add category statistics.
  const categories = {};
  results.forEach(result => {
    if (result.category) {
      categories[result.category] = (categories[result.category] || 0) + 1;
    }
  });

  if (Object.keys(categories).length > 0) {
    html += '<p>搜索结果分类：</p>';
    html += '<div class="related-terms">';

    for (const [category, count] of Object.entries(categories)) {
      html += `<span class="related-term" data-term="${category}">${category} (${count})</span>`;
    }

    html += '</div>';
  }

  // Add level statistics.
  const levels = {};
  results.forEach(result => {
    if (result.level) {
      levels[result.level] = (levels[result.level] || 0) + 1;
    }
  });

  if (Object.keys(levels).length > 0) {
    html += '<p>难度级别分布：</p>';
    html += '<div class="related-terms">';

    for (const [level, count] of Object.entries(levels)) {
      html += `<span class="related-term" data-term="${level}">${level} (${count})</span>`;
    }

    html += '</div>';
  }

  searchInsightsContainer.innerHTML = html;
  searchInsightsContainer.style.display = 'block';

  // Add click events for related terms.
  document.querySelectorAll('.related-term').forEach(term => {
    term.addEventListener('click', () => {
      searchInput.value = term.dataset.term;
      performSearch();
    });
  });
}

/**
 * Highlights text.
 *
 * @param {string} text - The text to highlight.
 * @param {string} query - The search query.
 * @param {Object} options - The highlight options.
 * @returns {string} - The highlighted text.
 */
function highlightText(text, query, options = {}) {
  if (!text || !query || !query.trim() || !options.highlight) {
    return text || '';
  }

  // 处理语义搜索
  if (options.semantic && options.expandedTerms && options.expandedTerms.length > 0) {
    let highlightedText = text;

    // 先高亮原始查询
    try {
      const queryRegex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
      highlightedText = highlightedText.replace(queryRegex, '<span class="highlight">$1</span>');

      // 再高亮扩展词
      options.expandedTerms.forEach(term => {
        if (term !== query && term.length > 1) {
          try {
            const termRegex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
            highlightedText = highlightedText.replace(termRegex, '<span class="semantic-highlight">$1</span>');
          } catch (e) {
            console.warn('高亮扩展词错误:', e);
          }
        }
      });
    } catch (e) {
      console.warn('高亮文本错误:', e);
      return text;
    }

    return highlightedText;
  }

  // 基础高亮
  try {
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
  } catch (e) {
    console.warn('基础高亮错误:', e);
    return text;
  }
}

/**
 * Escapes special characters in a string for use in a regular expression.
 *
 * @param {string} string - The string to escape.
 * @returns {string} - The escaped string.
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Displays search results.
 *
 * @param {Object} searchResult - The search result object.
 * @param {string} query - The search query.
 * @param {Object} options - The display options.
 */
function displayResults(searchResult, query, options = {}) {
  if (!searchResultsContainer) {
    return;
  }

  const results = searchResult.items || [];

  if (!results || results.length === 0) {
    searchResultsContainer.innerHTML = '<div class="result-count">没有找到匹配的结果</div>';
    return;
  }

  let html = `<div class="result-count">找到 ${searchResult.total} 个结果</div>`;

  results.forEach(result => {
    // 提取关键词
    const keywords = result.keywords ? result.keywords.split(/,\s*/) : [];
    let keywordsHtml = '';

    keywords.forEach(keyword => {
      keywordsHtml += `<span class="result-keyword">${highlightText(keyword, query, {
        ...options,
        expandedTerms: searchResult.expandedTerms
      })}</span>`;
    });

    // 构建结果项
    html += `
      <div class="result-item">
        <h3 class="result-title">${highlightText(result.title, query, {
          ...options,
          expandedTerms: searchResult.expandedTerms
        })}</h3>

        <div class="result-meta">
          <span class="result-score">相关度: ${Math.round(result.score * 10) / 10}</span>
          <span class="result-match-type">${result.semanticMatch ? '语义匹配' : '直接匹配'}</span>
          <span>${result.level || '不限'} · ${result.duration || '--'}分钟 · ${result.teacher || 'Now团队'}</span>
        </div>

        <div class="result-keywords">
          ${keywordsHtml}
        </div>

        <div class="result-description">
          ${highlightText(result.description, query, {
            ...options,
            expandedTerms: searchResult.expandedTerms
          })}
        </div>
      </div>
    `;
  });

  // 添加分页（如果需要）
  if (searchResult.total > searchResult.items.length) {
    const currentPage = Math.floor(searchResult.offset / searchResult.limit) + 1;
    const totalPages = Math.ceil(searchResult.total / searchResult.limit);

    html += '<div class="pagination">';

    // 上一页
    if (currentPage > 1) {
      html += `<button class="pagination-button" data-page="${currentPage - 1}">上一页</button>`;
    }

    // 页码
    for (let i = 1; i <= totalPages; i++) {
      if (i === currentPage) {
        html += `<span class="pagination-current">${i}</span>`;
      } else if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        html += `<button class="pagination-button" data-page="${i}">${i}</button>`;
      } else if (
        i === currentPage - 3 ||
        i === currentPage + 3
      ) {
        html += '<span class="pagination-ellipsis">...</span>';
      }
    }

    // 下一页
    if (currentPage < totalPages) {
      html += `<button class="pagination-button" data-page="${currentPage + 1}">下一页</button>`;
    }

    html += '</div>';
  }

  searchResultsContainer.innerHTML = html;

  // 添加分页事件监听器
  document.querySelectorAll('.pagination-button').forEach(button => {
    button.addEventListener('click', () => {
      const page = parseInt(button.dataset.page);
      const offset = (page - 1) * searchResult.limit;

      // 更新选项，添加分页参数
      const paginationOptions = {
        ...options,
        limit: searchResult.limit,
        offset: offset
      };

      // 执行带分页的搜索
      searchAPI(query, paginationOptions)
        .then(result => {
          displayResults(result, query, options);
        })
        .catch(error => {
          console.error('分页错误:', error);
        });
    });
  });
}

// Initialize search when the DOM is loaded.
document.addEventListener('DOMContentLoaded', initSearch);
